const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { spawn } = require("node:child_process");
const { mkdtemp, readFile, writeFile, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const script = resolve(__dirname, "../../../scripts/event-archives.mjs");
const token = "cli-test-bearer-secret";

test("CLI saves verification evidence and signals mismatches even with no import failures", () =>
  fixture(async ({ directory, url, respond }) => {
    const file = join(directory, "archive.json");
    await writeFile(file, "{}");
    const report = {
      dryRun: true,
      counts: { total: 1, valid: 0, imported: 0, skipped: 1, failed: 0 },
      records: [
        {
          sourceId: "source",
          targetId: "target",
          status: "skipped",
          warnings: [],
          verification: { status: "mismatch" },
        },
      ],
      verification: {
        version: 1,
        matched: 0,
        mismatched: 1,
        unavailable: 0,
        notImported: 0,
        notChecked: 0,
      },
    };
    respond(() => ({ status: 200, body: report }));
    const reportFile = join(directory, "report.json");
    const result = await run([
      "import",
      "--api-url",
      url,
      "--file",
      file,
      "--report",
      reportFile,
    ]);
    assert.equal(result.code, 2);
    assert.match(result.output, /Verification: 0 matched, 1 mismatched/);
    assert.deepEqual(JSON.parse(await readFile(reportFile, "utf8")), report);
  }));

function run(args, extraEnv = {}) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      env: { ...process.env, PASSMINT_TOKEN: token, ...extraEnv },
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolveResult({ code, output }));
  });
}

async function fixture(work) {
  const directory = await mkdtemp(join(tmpdir(), "passmint-cli-"));
  const requests = [];
  let handler = () => ({ status: 200, body: {} });
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    requests.push({
      url: req.url,
      method: req.method,
      auth: req.headers.authorization,
      body: body ? JSON.parse(body) : null,
    });
    const response = handler();
    res.writeHead(response.status, {
      "Content-Type": "application/json",
      ...response.headers,
    });
    res.end(
      typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.body),
    );
  });
  await new Promise((resolveReady) =>
    server.listen(0, "127.0.0.1", resolveReady),
  );
  try {
    await work({
      directory,
      requests,
      url: `http://127.0.0.1:${server.address().port}`,
      respond: (callback) => {
        handler = callback;
      },
    });
  } finally {
    await new Promise((done) => server.close(done));
    await rm(directory, { recursive: true, force: true });
  }
}

test("CLI preserves API prefixes, passes export filters and writes a new archive", () =>
  fixture(async ({ directory, requests, url, respond }) => {
    const archive = {
      schemaVersion: 1,
      events: [{ sourceId: "evt_source" }],
      manifest: { counts: { events: 1, ticketTypes: 0 } },
    };
    respond(() => ({ status: 200, body: archive }));
    const file = join(directory, "archive.json");
    const result = await run([
      "export",
      "--api-url",
      `${url}/api/`,
      "--file",
      file,
      "--event-id",
      "evt_source",
      "--event-id",
      "evt_second",
      "--owner-id",
      "usr_owner",
      "--source-environment",
      "local",
    ]);
    assert.equal(result.code, 0, result.output);
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")), archive);
    assert.equal(requests[0].url, "/api/events/archives/export");
    assert.equal(requests[0].method, "POST");
    assert.equal(requests[0].auth, `Bearer ${token}`);
    assert.deepEqual(requests[0].body, {
      eventIds: ["evt_source", "evt_second"],
      ownerId: "usr_owner",
      sourceEnvironment: "local",
    });
    assert.ok(!result.output.includes(token));
    assert.equal(
      (await run(["export", "--api-url", url, "--file", file])).code,
      1,
    );
    assert.equal(requests.length, 1);
  }));

test("CLI defaults to dry run, supports explicit apply and saves partial-failure reports", () =>
  fixture(async ({ directory, requests, url, respond }) => {
    const file = join(directory, "archive.json");
    await writeFile(file, '\uFEFF{"schemaVersion":1,"events":[]}');
    const preview = {
      dryRun: true,
      records: [],
      counts: { total: 0, valid: 0, imported: 0, skipped: 0, failed: 0 },
    };
    respond(() => ({ status: 200, body: preview }));
    const first = await run(
      [
        "import",
        "--api-url",
        url,
        "--file",
        file,
        "--target-owner-id",
        "usr_target",
        "--token-env",
        "SOURCE_TOKEN",
      ],
      { SOURCE_TOKEN: token },
    );
    assert.equal(first.code, 0, first.output);
    assert.equal(requests[0].url, "/events/archives/import");
    assert.deepEqual(requests[0].body, {
      archive: { schemaVersion: 1, events: [] },
      dryRun: true,
      targetOwnerId: "usr_target",
      onDuplicate: "skip",
    });
    const report = {
      dryRun: false,
      records: [
        {
          sourceId: "source",
          targetId: "evt_target",
          status: "imported",
          ticketTypes: [{ sourceId: "type", targetId: "typ_target" }],
          warnings: ["Reference only"],
        },
        {
          sourceId: "bad",
          status: "failed",
          error: "Invalid category",
          warnings: [],
        },
      ],
      counts: { total: 2, valid: 0, imported: 1, skipped: 0, failed: 1 },
    };
    respond(() => ({ status: 200, body: report }));
    const reportFile = join(directory, "report.json");
    const applied = await run([
      "import",
      "--api-url",
      url,
      "--file",
      file,
      "--apply",
      "--on-duplicate",
      "error",
      "--report",
      reportFile,
    ]);
    assert.equal(applied.code, 2);
    assert.equal(requests[1].body.dryRun, false);
    assert.equal(requests[1].body.onDuplicate, "error");
    assert.deepEqual(JSON.parse(await readFile(reportFile, "utf8")), report);
    assert.match(applied.output, /evt_target/);
    assert.match(applied.output, /typ_target/);
    assert.match(applied.output, /Invalid category/);
    const count = requests.length;
    assert.equal(
      (
        await run([
          "import",
          "--api-url",
          url,
          "--file",
          file,
          "--apply",
          "--report",
          file,
        ])
      ).code,
      1,
    );
    assert.equal(requests.length, count); // Never mutate before discovering an existing output file.
  }));

test("CLI rejects bad options/files before requests and bounds input and response bytes", () =>
  fixture(async ({ directory, requests, url, respond }) => {
    const file = join(directory, "archive.json");
    await writeFile(file, "{}");
    for (const args of [
      ["import", "--api-url", url, "--file", file, "--apply", "--dry-run"],
      [
        "import",
        "--api-url",
        url,
        "--file",
        file,
        "--on-duplicate",
        "overwrite",
      ],
      ["export", "--api-url", url, "--file", file, "--apply"],
      ["export", "--api-url", `http://user:${token}@localhost`, "--file", file],
      ["export", "--api-url", `${url}?secret=${token}`, "--file", file],
    ]) {
      const result = await run(args);
      assert.equal(result.code, 1);
      assert.ok(!result.output.includes(token));
    }
    assert.equal(
      (
        await run(["import", "--api-url", url, "--file", file], {
          PASSMINT_TOKEN: "",
        })
      ).code,
      1,
    );
    await writeFile(file, "not JSON");
    assert.equal(
      (await run(["import", "--api-url", url, "--file", file])).code,
      1,
    );
    await writeFile(file, " ".repeat(6 * 1024 * 1024 + 1));
    assert.equal(
      (await run(["import", "--api-url", url, "--file", file])).code,
      1,
    );
    assert.equal(requests.length, 0);
    respond(() => ({ status: 200, body: " ".repeat(6 * 1024 * 1024 + 1) }));
    const output = join(directory, "large.json");
    assert.equal(
      (await run(["export", "--api-url", url, "--file", output])).code,
      1,
    );
    assert.equal((await readFile(output)).length, 0);
  }));

test("CLI gives safe HTTP errors, does not follow redirects, and redacts echoed credentials", () =>
  fixture(async ({ directory, requests, url, respond }) => {
    for (const status of [400, 401, 403, 404, 413, 500, 302]) {
      respond(() => ({
        status,
        body: { message: token },
        headers: status === 302 ? { Location: `${url}/redirected` } : {},
      }));
      const result = await run([
        "export",
        "--api-url",
        url,
        "--file",
        join(directory, `${status}.json`),
      ]);
      assert.equal(result.code, 1);
      assert.ok(!result.output.includes(token));
      if (status !== 302)
        assert.match(result.output, new RegExp(`HTTP ${status}`));
    }
    assert.equal(requests.length, 7);
    const file = join(directory, "input.json");
    await writeFile(file, "{}");
    respond(() => ({
      status: 200,
      body: {
        dryRun: true,
        counts: { total: 1, valid: 0, imported: 0, skipped: 0, failed: 1 },
        records: [
          {
            sourceId: token,
            status: "failed",
            error: token,
            warnings: ["\u001b[2J"],
          },
        ],
      },
    }));
    const reportFile = join(directory, "redacted-report.json");
    const result = await run([
      "import",
      "--api-url",
      url,
      "--file",
      file,
      "--report",
      reportFile,
    ]);
    assert.equal(result.code, 2);
    assert.ok(!result.output.includes(token));
    assert.ok(!result.output.includes("\u001b"));
    assert.match(result.output, /redacted/);
    assert.ok(!(await readFile(reportFile, "utf8")).includes(token));
  }));
