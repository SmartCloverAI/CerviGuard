import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

async function waitForServer(url, server) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Test server exited before becoming ready (${server.exitCode}).`);
    }
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Timed out waiting for the test server.');
}

function cookieFrom(response) {
  const value = response.headers.getSetCookie()[0];
  assert.ok(value, 'login response must set a session cookie');
  return value.split(';', 1)[0];
}

async function jsonRequest(baseUrl, path, { cookie, method = 'GET', body } = {}) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: 'manual',
  });
}

async function login(baseUrl, username, password) {
  const response = await jsonRequest(baseUrl, '/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  assert.equal(response.status, 200, `login failed for ${username}`);
  return cookieFrom(response);
}

test('case and image access stays isolated by owner and current role', { timeout: 45_000 }, async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'cerviguard-auth-'));
  const port = 3317;
  const baseUrl = `http://127.0.0.1:${port}`;
  const now = '2026-08-28T00:00:00.000Z';
  const caseA = {
    id: 'case-demo-a',
    username: 'clinician-a',
    imageCid: 'cid-demo-a',
    status: 'completed',
    createdAt: now,
    updatedAt: now,
  };
  const caseB = {
    id: 'case-demo-b',
    username: 'clinician-b',
    imageCid: 'cid-demo-b',
    status: 'completed',
    createdAt: now,
    updatedAt: now,
  };

  await mkdir(join(dataDir, 'files'), { recursive: true });
  await writeFile(
    join(dataDir, 'cases.json'),
    JSON.stringify({ cases: { [caseA.id]: caseA, [caseB.id]: caseB } }),
  );
  await writeFile(join(dataDir, 'files', `${caseA.imageCid}.b64`), ONE_PIXEL_PNG);
  await writeFile(join(dataDir, 'files', `${caseB.imageCid}.b64`), ONE_PIXEL_PNG);
  await writeFile(
    join(dataDir, 'files.json'),
    JSON.stringify({
      files: {
        [caseA.imageCid]: { filename: 'demo-a.png', createdAt: now },
        [caseB.imageCid]: { filename: 'demo-b.png', createdAt: now },
      },
    }),
  );

  const server = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DATA_DIR: dataDir,
        USE_LOCAL: 'true',
        USE_RATIO1_MOCK: 'true',
        SESSION_SECRET: 'integration-session-secret-000000000000000000000000',
        DEFAULT_ADMIN_USERNAME: 'admin',
        DEFAULT_ADMIN_PASSWORD: 'password',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let logs = '';
  server.stdout.on('data', (chunk) => { logs += chunk; });
  server.stderr.on('data', (chunk) => { logs += chunk; });

  try {
    await waitForServer(`${baseUrl}/login`, server);

    const anonymousList = await jsonRequest(baseUrl, '/api/cases');
    assert.equal(anonymousList.status, 401);

    const adminCookie = await login(baseUrl, 'admin', 'password');
    for (const user of [
      { username: 'clinician-a', role: 'user' },
      { username: 'clinician-b', role: 'user' },
      { username: 'admin-two', role: 'admin' },
    ]) {
      const created = await jsonRequest(baseUrl, '/api/users', {
        cookie: adminCookie,
        method: 'POST',
        body: { ...user, password: 'password-123' },
      });
      assert.equal(created.status, 201, `failed to create ${user.username}`);
    }

    const cookieA = await login(baseUrl, 'clinician-a', 'password-123');
    const cookieB = await login(baseUrl, 'clinician-b', 'password-123');
    const adminTwoCookie = await login(baseUrl, 'admin-two', 'password-123');

    const listAResponse = await jsonRequest(baseUrl, '/api/cases', { cookie: cookieA });
    assert.equal(listAResponse.status, 200);
    assert.deepEqual((await listAResponse.json()).cases.map((record) => record.id), [caseA.id]);

    const listBResponse = await jsonRequest(baseUrl, '/api/cases', { cookie: cookieB });
    assert.equal(listBResponse.status, 200);
    assert.deepEqual((await listBResponse.json()).cases.map((record) => record.id), [caseB.id]);

    const adminListResponse = await jsonRequest(baseUrl, '/api/cases', { cookie: adminCookie });
    assert.equal(adminListResponse.status, 200);
    assert.deepEqual(
      new Set((await adminListResponse.json()).cases.map((record) => record.id)),
      new Set([caseA.id, caseB.id]),
    );

    assert.equal((await jsonRequest(baseUrl, `/api/cases/${caseA.id}`, { cookie: cookieA })).status, 200);
    assert.equal((await jsonRequest(baseUrl, `/api/cases/${caseA.id}`, { cookie: cookieB })).status, 404);
    assert.equal((await jsonRequest(baseUrl, `/api/cases/${caseA.id}`, { cookie: adminCookie })).status, 200);
    assert.equal((await jsonRequest(baseUrl, `/cases/${caseA.id}`, { cookie: cookieB })).status, 404);

    const ownerImage = await jsonRequest(
      baseUrl,
      `/api/files/${caseA.imageCid}?caseId=${caseA.id}`,
      { cookie: cookieA },
    );
    assert.equal(ownerImage.status, 200);
    assert.equal(ownerImage.headers.get('cache-control'), 'private, no-store');
    assert.equal(ownerImage.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(
      (await jsonRequest(baseUrl, `/api/files/${caseA.imageCid}?caseId=${caseA.id}`, { cookie: cookieB })).status,
      404,
    );
    assert.equal(
      (await jsonRequest(baseUrl, `/api/files/${caseB.imageCid}?caseId=${caseA.id}`, { cookie: cookieA })).status,
      400,
    );

    assert.equal(
      (await jsonRequest(baseUrl, `/api/cases/${caseA.id}`, { cookie: cookieB, method: 'DELETE' })).status,
      404,
    );
    assert.equal(
      (await jsonRequest(baseUrl, `/api/cases/${caseA.id}`, { cookie: cookieA, method: 'DELETE' })).status,
      501,
    );

    const deactivate = await jsonRequest(baseUrl, '/api/users', {
      cookie: adminCookie,
      method: 'PATCH',
      body: { username: 'clinician-a', metadata: { isActive: false } },
    });
    assert.equal(deactivate.status, 200);
    assert.equal((await jsonRequest(baseUrl, '/api/cases', { cookie: cookieA })).status, 401);

    const demote = await jsonRequest(baseUrl, '/api/users', {
      cookie: adminCookie,
      method: 'PATCH',
      body: { username: 'admin-two', role: 'user' },
    });
    assert.equal(demote.status, 200);
    assert.equal((await jsonRequest(baseUrl, '/api/users', { cookie: adminTwoCookie })).status, 403);
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : error}\nServer output:\n${logs}`);
  } finally {
    server.kill('SIGTERM');
    await new Promise((resolve) => server.once('exit', resolve));
    await rm(dataDir, { recursive: true, force: true });
  }
});
