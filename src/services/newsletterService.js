import { AppError, isValidEmail } from '../middlewares/validate.js';

function mapSubscriberRow(row) {
  return {
    id: row.id,
    email: row.email,
    source: row.source,
    isActive: Boolean(row.is_active),
    subscribedAt: row.subscribed_at,
  };
}

export async function subscribeNewsletter(db, payload) {
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const source = typeof payload?.source === 'string' && payload.source.trim()
    ? payload.source.trim().slice(0, 60)
    : 'web_footer';

  if (!isValidEmail(email)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Debes ingresar un email válido');
  }

  const [existing] = await db.execute(
    'SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1',
    [email]
  );

  if (existing.length > 0) {
    const row = existing[0];
    if (!row.is_active) {
      await db.execute('UPDATE newsletter_subscribers SET is_active = 1, source = ? WHERE id = ?', [
        source,
        row.id,
      ]);
      const [updated] = await db.execute(
        'SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1',
        [row.id]
      );
      return {
        subscriber: mapSubscriberRow(updated[0]),
        alreadySubscribed: false,
        promoCode: 'FIRST15',
      };
    }

    return {
      subscriber: mapSubscriberRow(row),
      alreadySubscribed: true,
      promoCode: 'FIRST15',
    };
  }

  const [result] = await db.execute(
    'INSERT INTO newsletter_subscribers (email, source, is_active) VALUES (?, ?, 1)',
    [email, source]
  );

  const [rows] = await db.execute('SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1', [
    result.insertId,
  ]);

  return {
    subscriber: mapSubscriberRow(rows[0]),
    alreadySubscribed: false,
    promoCode: 'FIRST15',
  };
}

export async function listNewsletterSubscribers(db) {
  const [rows] = await db.execute(
    'SELECT * FROM newsletter_subscribers WHERE is_active = 1 ORDER BY subscribed_at DESC, id DESC'
  );
  return rows.map(mapSubscriberRow);
}

export async function unsubscribeNewsletter(db, emailParam) {
  const email = typeof emailParam === 'string' ? emailParam.trim().toLowerCase() : '';
  if (!isValidEmail(email)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email inválido');
  }

  const [result] = await db.execute(
    'UPDATE newsletter_subscribers SET is_active = 0 WHERE email = ? AND is_active = 1',
    [email]
  );

  if (result.affectedRows === 0) {
    throw new AppError(404, 'SUBSCRIBER_NOT_FOUND', `El email "${email}" no está suscripto`);
  }

  return { unsubscribed: true, email };
}
