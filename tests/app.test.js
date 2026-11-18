import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app, { createApp } from '../src/app.js';
import { createMockDb } from './helpers/mockDb.js';

describe('API base endpoints', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('GET / returns API metadata', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.name, 'tienda-curso-full-stack-api');
    assert.equal(body.status, 'running');
    assert.equal(body.health, '/api/health');
    assert.equal(body.api, '/api');
  });

  it('GET /api returns endpoint discovery map', async () => {
    const res = await fetch(`${baseUrl}/api`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.name, 'tienda-curso-full-stack-api');
    assert.ok(body.endpoints.products);
    assert.ok(body.endpoints.categories);
    assert.ok(body.endpoints.orders);
  });

  it('GET /api/health returns ok status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.uptime, 'number');
    assert.ok(Date.parse(body.timestamp));
    assert.equal(body.database.engine, 'mysql');
  });

  it('GET /api/unknown returns 404 JSON error', async () => {
    const res = await fetch(`${baseUrl}/api/unknown`);
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.equal(body.error, 'NOT_FOUND');
  });
});

describe('Health strict mode with mock MySQL pool', () => {
  it('GET /api/health?strict=true returns 200 when connected and 503 when disconnected', async () => {
    const connectedApp = createApp({ db: createMockDb({ disconnected: false }) });
    const disconnectedApp = createApp({ db: createMockDb({ disconnected: true }) });

    const s1 = connectedApp.listen(0);
    const s2 = disconnectedApp.listen(0);
    try {
      const res1 = await fetch(`http://127.0.0.1:${s1.address().port}/api/health?strict=true`);
      assert.equal(res1.status, 200);
      const b1 = await res1.json();
      assert.equal(b1.database.status, 'connected');

      const res2 = await fetch(`http://127.0.0.1:${s2.address().port}/api/health?strict=true`);
      assert.equal(res2.status, 503);
      const b2 = await res2.json();
      assert.equal(b2.database.status, 'disconnected');
    } finally {
      s1.close();
      s2.close();
    }
  });
});
