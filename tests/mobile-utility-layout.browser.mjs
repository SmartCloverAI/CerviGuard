import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const port = 3321;
const baseUrl = `http://127.0.0.1:${port}`;
const dataDir = await mkdtemp(join(tmpdir(), "cerviguard-ui-"));

async function waitForServer(server) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`UI test server exited (${server.exitCode}).`);
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.status < 500) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the UI test server.");
}

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATA_DIR: dataDir,
      USE_RATIO1_MOCK: "true",
      SESSION_SECRET: "ui-test-session-secret-00000000000000000000000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let logs = "";
server.stdout.on("data", (chunk) => { logs += chunk; });
server.stderr.on("data", (chunk) => { logs += chunk; });

const browser = await chromium.launch({ headless: true });

async function inspectLayout(page) {
  return page.evaluate(() => {
    const box = (element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left };
    };
    const overlaps = (left, right) =>
      left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;

    const app = document.querySelector("h1")?.closest(".min-h-screen");
    const contentRegions = [...document.querySelectorAll("section, main, .card")];
    const runtime = document.querySelector(".runtime-dock");
    const publication = document.querySelector(".publication-dock");
    if (!app || contentRegions.length === 0 || !runtime || !publication) {
      throw new Error("Required UI region is missing.");
    }

    const appBox = box(app);
    const runtimeBox = box(runtime);
    const publicationBox = box(publication);
    const contentBoxes = contentRegions.map(box);

    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      runtimePosition: getComputedStyle(runtime).position,
      publicationPosition: getComputedStyle(publication).position,
      runtimeAfterApp: runtimeBox.top >= appBox.bottom - 1,
      publicationAfterRuntime: publicationBox.top >= runtimeBox.bottom - 1,
      contentOverlap: contentBoxes.some(
        (contentBox) => overlaps(contentBox, runtimeBox) || overlaps(contentBox, publicationBox),
      ),
      linkHeights: [...document.querySelectorAll(".publication-dock__link")].map(
        (link) => link.getBoundingClientRect().height,
      ),
    };
  });
}

async function assertKeyboardFocusUnobscured(page, label) {
  const focusableCount = await page.locator(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ).count();

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });

  for (let index = 0; index < focusableCount; index += 1) {
    await page.keyboard.press("Tab");
    const focusState = await page.evaluate(() => {
      const active = document.activeElement;
      const docks = [...document.querySelectorAll(".runtime-dock, .publication-dock")];
      if (!(active instanceof HTMLElement) || docks.some((dock) => dock.contains(active))) {
        return { obscured: false };
      }
      const activeRect = active.getBoundingClientRect();
      const obscured = docks.some((dock) => {
        const dockRect = dock.getBoundingClientRect();
        return activeRect.left < dockRect.right && activeRect.right > dockRect.left &&
          activeRect.top < dockRect.bottom && activeRect.bottom > dockRect.top;
      });
      return { obscured };
    });
    assert.equal(focusState.obscured, false, `${label} focused control ${index + 1}`);
  }
}

try {
  await waitForServer(server);

  for (const viewport of [
    { width: 640, height: 900 },
    { width: 768, height: 900 },
    { width: 900, height: 900 },
    { width: 1024, height: 600 },
    { width: 1024, height: 768 },
    { width: 1440, height: 600 },
    { width: 1440, height: 900 },
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200, `${viewport.width}px response`);

    const state = await inspectLayout(page);

    assert.equal(state.overflow, 0, `${viewport.width}px horizontal overflow`);
    assert.equal(state.contentOverlap, false, `${viewport.width}x${viewport.height}px content overlap`);
    assert.deepEqual(errors, [], `${viewport.width}px browser errors`);
    assert.equal(state.runtimePosition, "static", `${viewport.width}px runtime position`);
    assert.equal(state.publicationPosition, "static", `${viewport.width}px publication position`);
    assert.equal(state.runtimeAfterApp, true, `${viewport.width}px runtime flow`);
    assert.equal(state.publicationAfterRuntime, true, `${viewport.width}px publication flow`);
    assert.ok(state.linkHeights.every((height) => height >= 44), `${viewport.width}px target size`);
    await assertKeyboardFocusUnobscured(page, `${viewport.width}x${viewport.height}`);

    await page.close();
  }

  const authenticatedPage = await browser.newPage({ viewport: { width: 1024, height: 600 } });
  await authenticatedPage.goto(`${baseUrl}/login`);
  await authenticatedPage.getByLabel("Username").fill("admin");
  await authenticatedPage.getByLabel("Password").fill("password");
  await Promise.all([
    authenticatedPage.waitForURL(/\/dashboard$/),
    authenticatedPage.getByRole("button", { name: "Sign In" }).click(),
  ]);
  const authenticatedState = await inspectLayout(authenticatedPage);
  assert.equal(authenticatedState.contentOverlap, false, "authenticated dashboard content overlap");
  assert.equal(authenticatedState.runtimeAfterApp, true, "authenticated runtime flow");
  assert.equal(authenticatedState.publicationAfterRuntime, true, "authenticated publication flow");
  await assertKeyboardFocusUnobscured(authenticatedPage, "authenticated dashboard");
  await authenticatedPage.close();
} catch (error) {
  throw new Error(`${error instanceof Error ? error.message : error}\nServer output:\n${logs}`);
} finally {
  await browser.close();
  if (server.exitCode === null) {
    await new Promise((resolve) => {
      server.once("exit", resolve);
      server.kill("SIGTERM");
    });
  }
  await rm(dataDir, { recursive: true, force: true });
}
