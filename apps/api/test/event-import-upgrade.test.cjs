const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { Client } = require("pg");

test("additive import upgrade preserves retained data and enforces receipt uniqueness and cleanup", async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const schema = `upgrade_${randomUUID().replaceAll("-", "")}`;
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    await client.query(
      `CREATE TABLE users (id VARCHAR PRIMARY KEY); CREATE TABLE events (id VARCHAR PRIMARY KEY); INSERT INTO users VALUES ('owner'); INSERT INTO events VALUES ('retained'), ('other')`,
    );
    await client.query(
      readFileSync(
        join(__dirname, "../../../prisma/upgrades/20260918-event-imports.sql"),
        "utf8",
      ),
    );
    assert.equal(
      (await client.query("SELECT count(*)::int AS count FROM events")).rows[0]
        .count,
      2,
    );
    const insert =
      'INSERT INTO event_imports ("archiveId", "sourceEventId", "ownerId", "eventId", "ticketTypeMapping") VALUES ($1, $2, $3, $4, $5)';
    await client.query(insert, [
      "archive",
      "source",
      "owner",
      "retained",
      "[]",
    ]);
    await assert.rejects(
      client.query(insert, ["archive", "source", "owner", "other", "[]"]),
      { code: "23505" },
    );
    await assert.rejects(
      client.query(insert, ["another", "source", "missing", "other", "[]"]),
      { code: "23503" },
    );
    await client.query("DELETE FROM events WHERE id = 'retained'");
    assert.equal(
      (await client.query("SELECT count(*)::int AS count FROM event_imports"))
        .rows[0].count,
      0,
    );
    assert.equal(
      (await client.query("SELECT count(*)::int AS count FROM events")).rows[0]
        .count,
      1,
    );
  } finally {
    await client.query("ROLLBACK");
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.end();
  }
});
