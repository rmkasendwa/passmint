const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, readFile, rm, readdir } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createServer } = require('node:http');
const { once } = require('node:events');
const sharp = require('sharp');
const config = values => ({ get: key => values[key] });
const { ImageStorageService } = require('../dist/events/image-storage.service');
const input = (buffer, contentType = 'image/png', fileName = 'banner.png') => ({ fileName, contentType, dataUrl: `data:${contentType};base64,${buffer.toString('base64')}` });
const pixels = (width = 80, height = 40) => sharp({ create: { width, height, channels: 4, background: { r: 100, g: 50, b: 200, alpha: 0.5 } } });

test('local banners are resized, oriented, metadata-free WebP with safe extensions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'passmint-images-'));
  try {
    const service = new ImageStorageService(config({ LOCAL_UPLOAD_DIR: root, PUBLIC_API_URL: 'https://example.com/api' }));
    const source = await pixels(2400, 1200).withMetadata({ orientation: 6 }).png().toBuffer();
    const { url } = await service.uploadImage(input(source, 'image/png', '../../banner.html'));
    assert.match(url, /^https:\/\/example.com\/api\/uploads\/event-images\/\d{4}\/[\w-]+\.webp$/);
    const stored = await readFile(join(root, url.split('/uploads/')[1]));
    const meta = await sharp(stored).metadata();
    assert.equal(meta.format, 'webp');
    assert.equal(meta.width, 960);
    assert.equal(meta.height, 1920);
    assert.equal(meta.exif, undefined);
    assert.equal(meta.orientation, undefined);
    assert.equal(meta.hasAlpha, true);
    for (const [format, mime] of [['jpeg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp'], ['gif', 'image/gif']]) {
      const { url: smallUrl } = await service.uploadImage(input(await pixels().toFormat(format).toBuffer(), mime));
      const small = await sharp(await readFile(join(root, smallUrl.split('/uploads/')[1]))).metadata();
      assert.equal(small.width, 80);
      assert.equal(small.height, 40);
      assert.equal(small.format, 'webp');
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('invalid, mislabeled, oversized and excessive-pixel images never reach storage', async () => {
  const root = await mkdtemp(join(tmpdir(), 'passmint-images-'));
  try {
    const service = new ImageStorageService(config({ LOCAL_UPLOAD_DIR: root }));
    const png = await pixels().png().toBuffer();
    for (const bad of [input(Buffer.from('<html>not an image</html>')), input(png, 'image/jpeg'), input(png.subarray(0, 40)), { ...input(png), dataUrl: 'data:image/png;base64,!!!=' }, input(Buffer.from('<svg/>'), 'image/svg+xml')]) {
      await assert.rejects(service.uploadImage(bad), error => error.getStatus() === 400);
    }
    const limited = new ImageStorageService(config({ LOCAL_UPLOAD_DIR: root, IMAGE_UPLOAD_MAX_BYTES: '10' }));
    await assert.rejects(limited.uploadImage(input(png)), /too large/);
    const huge = await pixels(6500, 6500).png().toBuffer();
    await assert.rejects(service.uploadImage(input(huge)), /40 megapixels/);
    assert.deepEqual(await readdir(root), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('S3 receives optimized bytes, matching content type, extension and signed request', async () => {
  let uploaded;
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    uploaded = { url: req.url, headers: req.headers, body: Buffer.concat(chunks) };
    res.writeHead(200); res.end();
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const service = new ImageStorageService(config({ S3_BUCKET: 'test', S3_ACCESS_KEY_ID: 'test', S3_SECRET_ACCESS_KEY: 'test', S3_ENDPOINT: `http://127.0.0.1:${server.address().port}`, S3_PUBLIC_BASE_URL: 'https://images.example.com' }));
    const result = await service.uploadImage(input(await pixels().png().toBuffer()));
    assert.match(result.url, /^https:\/\/images.example.com\/event-images\/.*\.webp$/);
    assert.match(uploaded.url, /^\/test\/event-images\/.*\.webp$/);
    assert.equal(uploaded.headers['content-type'], 'image/webp');
    assert.match(uploaded.headers.authorization, /^AWS4-HMAC-SHA256 /);
    assert.equal((await sharp(uploaded.body).metadata()).format, 'webp');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
