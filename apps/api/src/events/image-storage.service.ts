import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, createHash, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, extname, join } from 'path';

type UploadImageInput = {
  fileName: string;
  contentType: string;
  dataUrl: string;
};

type DecodedImage = {
  buffer: Buffer;
  contentType: string;
};

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const extensionByType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class ImageStorageService {
  private readonly maxImageBytes: number;

  constructor(private readonly config: ConfigService) {
    this.maxImageBytes = Number(
      this.config.get<string>('IMAGE_UPLOAD_MAX_BYTES') ?? 5 * 1024 * 1024,
    );
  }

  async uploadImage(input: UploadImageInput) {
    const decoded = this.decodeImage(input);
    const key = this.createObjectKey(input.fileName, decoded.contentType);

    if (this.hasS3Config()) {
      return { url: await this.uploadToS3(key, decoded) };
    }

    return { url: await this.uploadLocally(key, decoded) };
  }

  private decodeImage(input: UploadImageInput): DecodedImage {
    const dataUrlMatch = input.dataUrl.match(
      /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.+)$/i,
    );

    if (!dataUrlMatch) {
      throw new BadRequestException('Image must be a base64 data URL.');
    }

    const [, dataUrlType, payload] = dataUrlMatch;
    const contentType = input.contentType || dataUrlType;

    if (contentType !== dataUrlType || !allowedImageTypes.has(contentType)) {
      throw new BadRequestException('Unsupported image type.');
    }

    const buffer = Buffer.from(payload, 'base64');

    if (buffer.length === 0) {
      throw new BadRequestException('Image file is empty.');
    }

    if (buffer.length > this.maxImageBytes) {
      throw new BadRequestException('Image file is too large.');
    }

    return { buffer, contentType };
  }

  private createObjectKey(fileName: string, contentType: string) {
    const rawExtension = extname(fileName).toLowerCase();
    const extension =
      rawExtension && rawExtension.length <= 8
        ? rawExtension
        : extensionByType[contentType];

    return `event-images/${new Date().getFullYear()}/${randomUUID()}${extension}`;
  }

  private hasS3Config() {
    return Boolean(
      this.config.get<string>('S3_BUCKET') &&
      this.config.get<string>('S3_ACCESS_KEY_ID') &&
      this.config.get<string>('S3_SECRET_ACCESS_KEY'),
    );
  }

  private async uploadLocally(key: string, image: DecodedImage) {
    const uploadRoot =
      this.config.get<string>('LOCAL_UPLOAD_DIR') ??
      join(process.cwd(), 'uploads');
    const targetPath = join(uploadRoot, key);

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, image.buffer);

    const publicBaseUrl =
      this.config.get<string>('PUBLIC_API_URL') ??
      `http://localhost:${this.config.get<string>('API_PORT') ?? '3000'}`;

    return `${publicBaseUrl.replace(/\/$/, '')}/uploads/${key}`;
  }

  private async uploadToS3(key: string, image: DecodedImage) {
    const bucket = this.requiredConfig('S3_BUCKET');
    const region = this.config.get<string>('S3_REGION') ?? 'us-east-1';
    const accessKey = this.requiredConfig('S3_ACCESS_KEY_ID');
    const secretKey = this.requiredConfig('S3_SECRET_ACCESS_KEY');
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const forcePathStyle =
      this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true' ||
      Boolean(endpoint);
    const objectUrl = this.createS3ObjectUrl(
      bucket,
      key,
      region,
      endpoint,
      forcePathStyle,
    );
    const now = new Date();
    const amzDate = this.formatAmzDate(now);
    const dateStamp = amzDate.slice(0, 8);
    const bodyHash = createHash('sha256').update(image.buffer).digest('hex');
    const host = objectUrl.host;
    const headers: Record<string, string> = {
      'content-type': image.contentType,
      host,
      'x-amz-content-sha256': bodyHash,
      'x-amz-date': amzDate,
    };
    const sessionToken = this.config.get<string>('S3_SESSION_TOKEN');

    if (sessionToken) {
      headers['x-amz-security-token'] = sessionToken;
    }

    const signedHeaders = Object.keys(headers).sort().join(';');
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map((header) => `${header}:${headers[header]}\n`)
      .join('');
    const canonicalRequest = [
      'PUT',
      objectUrl.pathname,
      '',
      canonicalHeaders,
      signedHeaders,
      bodyHash,
    ].join('\n');
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');
    const signingKey = this.getSigningKey(secretKey, dateStamp, region);
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');

    const response = await fetch(objectUrl, {
      method: 'PUT',
      body: new Uint8Array(image.buffer),
      headers: {
        ...headers,
        Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Image upload failed.');
    }

    const publicBaseUrl = this.config.get<string>('S3_PUBLIC_BASE_URL');
    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    return objectUrl.toString();
  }

  private createS3ObjectUrl(
    bucket: string,
    key: string,
    region: string,
    endpoint: string | undefined,
    forcePathStyle: boolean,
  ) {
    if (endpoint) {
      const baseUrl = new URL(endpoint);
      if (forcePathStyle) {
        baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, '')}/${bucket}/${key}`;
      } else {
        baseUrl.hostname = `${bucket}.${baseUrl.hostname}`;
        baseUrl.pathname = `/${key}`;
      }
      return baseUrl;
    }

    return new URL(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
  }

  private getSigningKey(secretKey: string, dateStamp: string, region: string) {
    const dateKey = createHmac('sha256', `AWS4${secretKey}`)
      .update(dateStamp)
      .digest();
    const dateRegionKey = createHmac('sha256', dateKey).update(region).digest();
    const dateRegionServiceKey = createHmac('sha256', dateRegionKey)
      .update('s3')
      .digest();

    return createHmac('sha256', dateRegionServiceKey)
      .update('aws4_request')
      .digest();
  }

  private formatAmzDate(date: Date) {
    return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  private requiredConfig(key: string) {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`${key} is not configured.`);
    }
    return value;
  }
}
