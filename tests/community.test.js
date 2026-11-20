import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createMockDb } from './helpers/mockDb.js';

describe('Auth, Newsletter, and Contacts API', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp({ db: createMockDb() });
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('Auth flow: register, duplicate rejection, login, and protected /me + /my-orders', async () => {
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Valentina',
        lastName: 'Pérez',
        email: 'valentina@example.com',
        password: 'Password123',
      }),
    });
    assert.equal(regRes.status, 201);
    const regBody = await regRes.json();
    assert.equal(regBody.user.role, 'customer');
    assert.ok(regBody.token);

    // Registro duplicado -> 409
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Valentina',
        lastName: 'Pérez',
        email: 'valentina@example.com',
        password: 'Password123',
      }),
    });
    assert.equal(dupRes.status, 409);

    // Login con cuenta seed admin
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ldstore.com',
        password: 'Admin1234!',
      }),
    });
    assert.equal(adminLoginRes.status, 200);
    const adminBody = await adminLoginRes.json();
    assert.equal(adminBody.user.role, 'admin');

    // Sin token -> 401
    const unauthRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(unauthRes.status, 401);

    // Con token -> 200
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${regBody.token}` },
    });
    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.user.email, 'valentina@example.com');

    // Orden asociada al usuario autenticado
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regBody.token}`,
      },
      body: JSON.stringify({
        customerName: 'Valentina Pérez',
        customerEmail: 'valentina@example.com',
        shippingAddress: 'Av. Santa Fe 2100',
        shippingCity: 'CABA',
        items: [{ slug: 'ld-cap-10', size: 'ONE SIZE', quantity: 1 }],
      }),
    });
    assert.equal(orderRes.status, 201);

    const myOrdersRes = await fetch(`${baseUrl}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${regBody.token}` },
    });
    assert.equal(myOrdersRes.status, 200);
    const myOrders = await myOrdersRes.json();
    assert.equal(myOrders.items.length, 1);
  });

  it('Newsletter flow: subscribe returns FIRST15, handles duplicate, and unsubscribes', async () => {
    const subRes = await fetch(`${baseUrl}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dropfan@example.com' }),
    });
    assert.equal(subRes.status, 201);
    const subBody = await subRes.json();
    assert.equal(subBody.promoCode, 'FIRST15');
    assert.equal(subBody.alreadySubscribed, false);

    const dupRes = await fetch(`${baseUrl}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dropfan@example.com' }),
    });
    assert.equal(dupRes.status, 200);
    const dupBody = await dupRes.json();
    assert.equal(dupBody.alreadySubscribed, true);

    const unsubRes = await fetch(`${baseUrl}/api/newsletter/dropfan@example.com`, {
      method: 'DELETE',
    });
    assert.equal(unsubRes.status, 200);
  });

  it('Contacts flow: validates names/email/message and updates status', async () => {
    const badRes = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Juan123',
        lastName: 'Gomez',
        email: 'no-es-email',
        message: 'Hola',
      }),
    });
    assert.equal(badRes.status, 400);

    const okRes = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'María',
        lastName: 'González',
        email: 'maria@example.com',
        subject: 'Consulta de talles de zapatillas',
        message: 'Hola! Quería saber si el modelo Concrete US 9.5 vuelve a entrar pronto.',
      }),
    });
    assert.equal(okRes.status, 201);
    const okBody = await okRes.json();
    const id = okBody.contact.id;

    const patchRes = await fetch(`${baseUrl}/api/contacts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'replied' }),
    });
    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.status, 'replied');
  });

  it('Admin route protection: rejects unauthenticated/customer when PROTECT_ADMIN_ROUTES=true and allows admin', async () => {
    const prev = process.env.PROTECT_ADMIN_ROUTES;
    process.env.PROTECT_ADMIN_ROUTES = 'true';
    try {
      // Sin token -> 401
      const noAuthRes = await fetch(`${baseUrl}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Joggers', productType: 'apparel' }),
      });
      assert.equal(noAuthRes.status, 401);

      // Login como cliente -> 403
      const custLogin = await (
        await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'cliente@ldstore.com', password: 'Cliente1234!' }),
        })
      ).json();

      const custRes = await fetch(`${baseUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custLogin.token}`,
        },
        body: JSON.stringify({ name: 'Joggers', productType: 'apparel' }),
      });
      assert.equal(custRes.status, 403);

      // Login como admin -> 201
      const adminLogin = await (
        await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@ldstore.com', password: 'Admin1234!' }),
        })
      ).json();

      const adminRes = await fetch(`${baseUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminLogin.token}`,
        },
        body: JSON.stringify({ name: 'Joggers', productType: 'apparel' }),
      });
      assert.equal(adminRes.status, 201);
    } finally {
      if (prev === undefined) {
        delete process.env.PROTECT_ADMIN_ROUTES;
      } else {
        process.env.PROTECT_ADMIN_ROUTES = prev;
      }
    }
  });
});

