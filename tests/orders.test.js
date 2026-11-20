import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createMockDb } from './helpers/mockDb.js';

describe('Promo codes and transactional checkout orders API', () => {
  let server;
  let baseUrl;
  let mockDb;

  before(async () => {
    mockDb = createMockDb();
    const app = createApp({ db: mockDb });
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

  it('POST /api/promo-codes/validate computes FIRST15 15% discount and checks minimum order', async () => {
    const res = await fetch(`${baseUrl}/api/promo-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'first15', subtotal: 200 }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.valid, true);
    assert.equal(body.code, 'FIRST15');
    assert.equal(body.discountAmount, 30);
    assert.equal(body.finalTotal, 170);

    const minFail = await fetch(`${baseUrl}/api/promo-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SNEAKER20', subtotal: 100 }),
    });
    assert.equal(minFail.status, 400);
    const minBody = await minFail.json();
    assert.equal(minBody.error, 'PROMO_MIN_ORDER');
  });

  it('POST /api/orders creates order with apparel + footwear, applies FIRST15, and deducts stock', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Sofía Martínez',
        customerEmail: 'sofia@example.com',
        shippingAddress: 'Av. Corrientes 1234',
        shippingCity: 'Buenos Aires',
        shippingPostalCode: '1043',
        paymentMethod: 'mercadopago',
        promoCode: 'FIRST15',
        items: [
          { slug: 'ld-hoodie-01', size: 'L', quantity: 1 }, // $110
          { slug: 'ld-sneaker-05', size: 'US 9.5', quantity: 1 }, // $165
        ],
      }),
    });

    assert.equal(res.status, 201);
    const order = await res.json();
    assert.match(order.orderNumber, /^LD-\d{6}$/);
    assert.equal(order.subtotal, 275);
    assert.equal(order.discountAmount, 41.25);
    assert.equal(order.total, 233.75);
    assert.equal(order.status, 'confirmed');
    assert.equal(order.items.length, 2);

    // Verifica descuento de stock en variantes
    const hoodieProd = await (await fetch(`${baseUrl}/api/products/ld-hoodie-01`)).json();
    const hoodieL = hoodieProd.variants.find((v) => v.size === 'L');
    assert.equal(hoodieL.stock, 8); // era 9

    const sneakerProd = await (await fetch(`${baseUrl}/api/products/ld-sneaker-05`)).json();
    const sneaker95 = sneakerProd.variants.find((v) => v.size === 'US 9.5');
    assert.equal(sneaker95.stock, 3); // era 4

    // Verifica consulta por orderNumber
    const lookupRes = await fetch(`${baseUrl}/api/orders/${order.orderNumber}`);
    assert.equal(lookupRes.status, 200);
    const lookup = await lookupRes.json();
    assert.equal(lookup.id, order.id);

    // Verifica cancelación y devolución automática de stock
    const cancelRes = await fetch(`${baseUrl}/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    assert.equal(cancelRes.status, 200);
    const cancelled = await cancelRes.json();
    assert.equal(cancelled.status, 'cancelled');

    const hoodieAfterCancel = await (await fetch(`${baseUrl}/api/products/ld-hoodie-01`)).json();
    assert.equal(hoodieAfterCancel.variants.find((v) => v.size === 'L').stock, 9);
  });

  it('POST /api/orders rolls back transaction when any item lacks sufficient stock', async () => {
    const beforeProd = await (await fetch(`${baseUrl}/api/products/ld-hoodie-01`)).json();
    const beforeHoodieStock = beforeProd.variants.find((v) => v.size === 'M').stock;

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Diego Gómez',
        customerEmail: 'diego@example.com',
        shippingAddress: 'Calle Falsa 123',
        shippingCity: 'Córdoba',
        items: [
          { slug: 'ld-hoodie-01', size: 'M', quantity: 2 },
          { slug: 'ld-sneaker-05', size: 'US 10', quantity: 99 }, // supera stock (2)
        ],
      }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error, 'INSUFFICIENT_STOCK');

    // Confirma que el primer ítem NO perdió stock por el rollback transaccional
    const afterProd = await (await fetch(`${baseUrl}/api/products/ld-hoodie-01`)).json();
    const afterHoodieStock = afterProd.variants.find((v) => v.size === 'M').stock;
    assert.equal(afterHoodieStock, beforeHoodieStock);
  });
});
