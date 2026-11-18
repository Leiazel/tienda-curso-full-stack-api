import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createMockDb } from './helpers/mockDb.js';

describe('Categories and Products API (urban apparel & footwear)', () => {
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

  it('GET /api/categories lists apparel, footwear, and accessory categories', async () => {
    const res = await fetch(`${baseUrl}/api/categories`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.total, 6);
    assert.ok(body.items.some((c) => c.slug === 'hoodies' && c.productType === 'apparel'));
    assert.ok(body.items.some((c) => c.slug === 'sneakers' && c.productType === 'footwear'));
  });

  it('GET /api/categories?type=footwear filters footwear categories only', async () => {
    const res = await fetch(`${baseUrl}/api/categories?type=footwear`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].slug, 'sneakers');
  });

  it('GET /api/products?type=footwear returns only footwear with US sizing', async () => {
    const res = await fetch(`${baseUrl}/api/products?type=footwear`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 2);
    assert.ok(body.items.every((p) => p.productType === 'footwear'));
    assert.ok(body.items.some((p) => p.sizes.includes('US 9.5')));
  });

  it('GET /api/products?type=apparel&maxPrice=150 filters urban clothing by type and price', async () => {
    const res = await fetch(`${baseUrl}/api/products?type=apparel&maxPrice=150&sort=price_asc`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 2);
    assert.equal(body.items[0].slug, 'dich-hoodie-01');
    assert.equal(body.items[1].slug, 'dich-cargo-02');
  });

  it('GET /api/products/:slug returns full product detail with variants and sizes', async () => {
    const res = await fetch(`${baseUrl}/api/products/dich-sneaker-05`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.name, 'DICH® LOW-TOP SNEAKER "CONCRETE"');
    assert.equal(body.category, 'sneakers');
    assert.equal(body.defaultSize, 'US 9.5');
    assert.ok(body.variants.length >= 3);
    assert.equal(body.totalStock, 9);
  });

  it('POST /api/products creates new footwear product with variants and updates stock', async () => {
    const createRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'DICH® SKATE SLIP-ON PRO',
        category: 'sneakers',
        productType: 'footwear',
        subtitle: 'Vulcanized Gum Sole · Heavy Canvas',
        price: 125,
        imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77',
        defaultSize: 'US 9',
        isFeatured: true,
        variants: [
          { size: 'US 9', color: 'Black Gum', colorHex: '#181818', stock: 5 },
          { size: 'US 10', color: 'Black Gum', colorHex: '#181818', stock: 7 },
        ],
      }),
    });

    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.slug, 'dich-skate-slip-on-pro');
    assert.equal(created.totalStock, 12);
    assert.deepEqual(created.sizes, ['US 9', 'US 10']);

    const variantId = created.variants[0].id;
    const stockRes = await fetch(
      `${baseUrl}/api/products/${created.id}/variants/${variantId}/stock`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: 3 }),
      }
    );
    assert.equal(stockRes.status, 200);
    const stockBody = await stockRes.json();
    assert.equal(stockBody.previousStock, 5);
    assert.equal(stockBody.stock, 8);

    const delRes = await fetch(`${baseUrl}/api/products/${created.id}`, {
      method: 'DELETE',
    });
    assert.equal(delRes.status, 200);
  });

  it('POST /api/products validates required fields and returns 400 with details', async () => {
    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', price: -5 }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(body.details));
    assert.ok(body.details.length >= 3);
  });

  it('DELETE /api/categories/:id prevents deleting category in use (409)', async () => {
    const res = await fetch(`${baseUrl}/api/categories/1`, { method: 'DELETE' });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error, 'CATEGORY_IN_USE');
  });
});
