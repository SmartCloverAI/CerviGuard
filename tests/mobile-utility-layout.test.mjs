import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mobile utility controls return to document flow", async () => {
  const [layout, styles, components] = await Promise.all([
    readFile("src/app/layout.tsx", "utf8"),
    readFile("src/app/globals.css", "utf8"),
    Promise.all([
      "served-by.tsx",
      "version-footer.tsx",
      "model-publication-note.tsx",
      "huggingface-link.tsx",
      "github-link.tsx",
    ].map((name) => readFile(`src/components/${name}`, "utf8"))).then((values) => values.join("\n")),
  ]);

  assert.match(layout, /className="runtime-dock"/);
  assert.match(layout, /className="publication-dock"/);
  assert.match(styles, /\.runtime-dock[\s\S]*position: static/);
  assert.match(styles, /\.publication-dock[\s\S]*position: static/);
  assert.doesNotMatch(styles, /\.runtime-dock[\s\S]{0,500}position: fixed/);
  assert.doesNotMatch(styles, /\.publication-dock[\s\S]{0,500}position: fixed/);
  assert.doesNotMatch(components, /\bfixed\s+bottom-/);
});

test("public login identifies the CerviGuard product stage", async () => {
  const authLayout = await readFile("src/app/(auth)/layout.tsx", "utf8");

  assert.match(authLayout, /CerviGuard — Live MVP \/ Private Beta/);
  assert.match(authLayout, /className="badge mt-4 normal-case"/);
  assert.doesNotMatch(authLayout, /SmartClover Cervical Screening Pilot/);
});
