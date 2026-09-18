import { open } from "node:fs/promises";
import { parseArgs } from "node:util";

const MAX_BYTES = 6 * 1024 * 1024;
const HELP = `Usage:
  pnpm events:archive export --api-url URL --file archive.json [options]
  pnpm events:archive import --api-url URL --file archive.json [options]

Common: --token-env NAME (default PASSMINT_TOKEN), --help
Export: --event-id ID (repeatable), --owner-id ID, --source-environment LABEL
Import: --dry-run (default), --apply, --target-owner-id ID,
        --on-duplicate skip|error (default skip), --report report.json

API URL: http://localhost:3000 or https://your-domain/api
Tokens are read only from the named environment variable, never from arguments.
Files must be new: existing archives and reports are never overwritten.
Imports write only with --apply. Review a dry run first.
Exit codes: 0 success, 1 command/API failure, 2 per-record import failures.
`;

class CommandError extends Error {}
function fail(message) {
  throw new CommandError(message);
}

function options(args) {
  if (!args.length || args[0] === "--help") return null;
  const [command, ...rest] = args;
  if (!["export", "import"].includes(command))
    fail("Choose export or import. Run with --help for usage.");
  const common = {
    "api-url": { type: "string" },
    file: { type: "string" },
    "token-env": { type: "string", default: "PASSMINT_TOKEN" },
    help: { type: "boolean" },
  };
  const specific =
    command === "export"
      ? {
          "event-id": { type: "string", multiple: true },
          "owner-id": { type: "string" },
          "source-environment": { type: "string" },
        }
      : {
          "dry-run": { type: "boolean" },
          apply: { type: "boolean" },
          "target-owner-id": { type: "string" },
          "on-duplicate": { type: "string", default: "skip" },
          report: { type: "string" },
        };
  let values;
  try {
    ({ values } = parseArgs({
      args: rest,
      options: { ...common, ...specific },
      strict: true,
      allowPositionals: false,
    }));
  } catch {
    fail("Invalid options. Run with --help for usage.");
  }
  if (values.help) return null;
  if (!values["api-url"] || !values.file)
    fail("--api-url and --file are required.");
  if (values.apply && values["dry-run"])
    fail("Use either --dry-run or --apply, not both.");
  if (
    command === "import" &&
    !["skip", "error"].includes(values["on-duplicate"])
  )
    fail("--on-duplicate must be skip or error.");
  let url;
  try {
    url = new URL(values["api-url"]);
  } catch {
    fail("--api-url must be an absolute HTTP(S) API base URL.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    fail(
      "--api-url must be HTTP(S) without credentials, query parameters or fragments.",
    );
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/events/archives/${command}`;
  const token = process.env[values["token-env"]];
  if (!token?.trim() || /\s/.test(token))
    fail(
      "Set a nonempty bearer token in the selected token environment variable.",
    );
  return { command, values, url, token };
}

async function boundedBytes(stream) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_BYTES)
      fail(
        "JSON exceeds the 6 MiB limit. Export a smaller selection of events.",
      );
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function parseJson(text) {
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    fail("Invalid JSON. Check the archive file or API response.");
  }
}

async function readArchive(file) {
  let handle;
  try {
    handle = await open(file, "r");
    const info = await handle.stat();
    if (!info.isFile()) fail("Archive input must be a regular file.");
    if (info.size > MAX_BYTES)
      fail("Archive file exceeds 6 MiB. Export a smaller selection of events.");
    return parseJson(
      await boundedBytes(handle.createReadStream({ autoClose: false })),
    );
  } catch (error) {
    if (error.code)
      fail(
        `Cannot read archive (${error.code}). Check the input file and permissions.`,
      );
    throw error;
  } finally {
    await handle?.close();
  }
}

async function reserveOutput(file) {
  try {
    return await open(file, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST")
      fail("Output file already exists. Choose a new filename.");
    fail(
      "Cannot create output file. Check the parent directory and permissions.",
    );
  }
}

const httpHint = (status) =>
  ({
    400: "Check archive version, checksum, fields and selected IDs.",
    401: "Log in to this environment again and update the token.",
    403: "Check account permissions and owner mapping.",
    404: "Check the API base path, selected IDs and target owner.",
    413: "Export fewer events; check the reverse proxy body limit.",
    429: "Wait before retrying.",
  })[status] ??
  (status >= 500
    ? "Check API/database health and the import schema upgrade before retrying."
    : "Check the API base URL and deployment configuration.");

async function post(url, token, body) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(120000),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    fail(
      "API request failed or timed out. Check the URL/network; redirects are not followed. After an interrupted import, retry the same archive and owner mapping.",
    );
  }
  if (!response.ok) {
    await response.body?.cancel();
    fail(`API returned HTTP ${response.status}. ${httpHint(response.status)}`);
  }
  if (!response.body) fail("API returned an empty response.");
  try {
    return parseJson(await boundedBytes(response.body));
  } catch (error) {
    if (
      error.name === "AbortError" ||
      error.name === "TimeoutError" ||
      error.name === "TypeError"
    )
      fail(
        "API response was interrupted. Retry the same archive and owner mapping.",
      );
    throw error;
  }
}

async function main() {
  const config = options(process.argv.slice(2));
  if (!config) {
    console.log(HELP);
    return;
  }
  const { command, values, url, token } = config;
  // JSON quoting prevents server-provided IDs/messages from injecting terminal controls.
  const display = (value) =>
    JSON.stringify(String(value).replaceAll(token, "[redacted]").slice(0, 500));
  let body;
  if (command === "export") {
    body = {
      eventIds: values["event-id"],
      ownerId: values["owner-id"],
      sourceEnvironment: values["source-environment"],
    };
  } else {
    body = {
      archive: await readArchive(values.file),
      dryRun: !values.apply,
      targetOwnerId: values["target-owner-id"],
      onDuplicate: values["on-duplicate"],
    };
  }
  const outputPath = command === "export" ? values.file : values.report;
  // Reserve the report before any mutation: a filename/permission error must not
  // first appear after an import has already committed to the target environment.
  const output = outputPath ? await reserveOutput(outputPath) : null;
  try {
    console.log(
      command === "export"
        ? "Exporting event definitions..."
        : values.apply
          ? "Importing event definitions..."
          : "Validating import (dry run; no changes)...",
    );
    const result = await post(url, token, body);
    if (command === "export") {
      if (
        result?.schemaVersion !== 1 ||
        !Array.isArray(result.events) ||
        !result.manifest?.counts
      )
        fail("API did not return a version 1 event archive.");
      await output.writeFile(JSON.stringify(result), "utf8");
      console.log(`Exported ${result.events.length} events. Archive saved.`);
    } else {
      if (
        !Array.isArray(result?.records) ||
        !result.counts ||
        result.dryRun !== !values.apply
      )
        fail(
          "API did not return the expected import report. Retry using the same archive and owner mapping.",
        );
      const counts = result.counts;
      if (
        ["total", "valid", "imported", "skipped", "failed"].some(
          (key) => !Number.isSafeInteger(counts[key]) || counts[key] < 0,
        )
      )
        fail("API returned invalid report counts.");
      if (
        counts.total !== result.records.length ||
        counts.valid + counts.imported + counts.skipped + counts.failed !==
          counts.total
      )
        fail("API returned inconsistent report counts.");
      if (output)
        await output.writeFile(
          JSON.stringify(
            result,
            (_key, value) =>
              typeof value === "string"
                ? value.replaceAll(token, "[redacted]")
                : value,
            2,
          ),
          "utf8",
        );
      console.log(
        `${counts.total} events: ${counts.valid} valid, ${counts.imported} imported, ${counts.skipped} skipped, ${counts.failed} failed.`,
      );
      for (const record of result.records) {
        console.log(
          `${display(record.sourceId)}: ${display(record.status)}${record.targetId ? ` -> ${display(record.targetId)}` : ""}`,
        );
        for (const mapping of record.ticketTypes ?? [])
          console.log(
            `  Category ${display(mapping.sourceId)} -> ${display(mapping.targetId)}`,
          );
        for (const warning of record.warnings ?? [])
          console.log(`  Warning: ${display(warning)}`);
        if (record.error) console.log(`  Error: ${display(record.error)}`);
      }
      if (output) console.log("Import report saved.");
      if (counts.failed > 0) process.exitCode = 2;
    }
  } catch (error) {
    if (error.code)
      fail(
        "Could not complete the output file. Check disk space and permissions. After an import, retry the same archive and owner mapping.",
      );
    throw error;
  } finally {
    await output?.close();
  }
}

main().catch((error) => {
  console.error(
    `Error: ${error instanceof CommandError ? error.message : "Command failed. Check files and API availability; retry interrupted imports with the same archive and owner mapping."}`,
  );
  process.exitCode = 1;
});
