import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { loadRootEnv } from "./root-env.mjs";

loadRootEnv();
const require = createRequire(
  new URL("../apps/api/package.json", import.meta.url),
);
const { Client } = require("pg");
const schema = `test_${randomUUID().replaceAll("-", "")}`;
const databaseUrl = new URL(
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL,
);
databaseUrl.searchParams.set("schema", schema);
const env = { ...process.env, DATABASE_URL: databaseUrl.toString() };
const client = new Client({ connectionString: databaseUrl.toString() });
function run(args) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Test command exited with ${result.status}`);
}
try {
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  run(["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"]);
  run([
    "apps/api/node_modules/typescript/bin/tsc",
    "-p",
    "apps/api/tsconfig.build.json",
  ]);
  const tests = process.argv.slice(2);
  run([
    "--test",
    ...(tests.length
      ? tests
      : readdirSync("apps/api/test")
          .filter((name) => name.endsWith(".test.cjs"))
          .map((name) => `apps/api/test/${name}`)),
  ]);
} finally {
  // Only this run's randomly named schema is removed; application tables are untouched.
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await client.end();
}
