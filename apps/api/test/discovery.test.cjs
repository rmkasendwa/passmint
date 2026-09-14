const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");
function load(file, imports = {}) {
  const exports = {};
  runInNewContext(
    ts.transpileModule(
      readFileSync(join(__dirname, "../../web/", file), "utf8"),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    { exports, require: (name) => imports[name] },
  );
  return exports;
}
const category = load("event-category.ts");
const { filterEvents } = load("discovery-filter.ts", {
  "./event-category": category,
});
const row = (name, description = "", venue = "Show Grounds") => ({
  name,
  description,
  venue,
  startsAt: "2030-05-12T16:00:00Z",
});
test("discovery categories prefer specific event names over incidental venue and description words", () => {
  for (const [name, expected] of [
    ["Kampala Tech Night", "Conference"],
    ["Indie Film Night", "Cinema"],
    ["Startup Pitch Arena", "Conference"],
    ["Wellness Reset Day", "Wellness"],
    ["Basketball Opening Night", "Sports"],
    ["Sunday Craft Market", "Community"],
  ]) {
    assert.equal(
      category.eventCategory(row(name, "Talks and music at the venue")),
      expected,
    );
  }
  assert.equal(
    category.eventCategory(row("An evening together", "A live jazz band")),
    "Music",
  );
  assert.equal(
    category.eventCategory(row("A gathering", "", "National Stadium")),
    "Event",
  );
});
test("category queries and text searches combine with inclusive date ranges", () => {
  const rows = [
    row("Basketball Opening Night"),
    row("Tech Night"),
    { ...row("Community meetup"), startsAt: "2030-05-14T16:00:00Z" },
  ];
  const names = (filters) =>
    Array.from(
      filterEvents(rows, { q: "", start: "", end: "", ...filters }),
      (event) => event.name,
    );
  assert.deepEqual(names({ q: "sports" }), ["Basketball Opening Night"]);
  assert.deepEqual(
    names({ q: "  TECH  ", start: "2030-05-12", end: "2030-05-12" }),
    ["Tech Night"],
  );
  assert.deepEqual(
    names({ q: "community", start: "2030-05-14", end: "2030-05-12" }),
    ["Community meetup"],
  );
  assert.deepEqual(names({ q: "community", start: "2030-05-12" }), []);
  assert.deepEqual(names({ q: "nothing here" }), []);
});
