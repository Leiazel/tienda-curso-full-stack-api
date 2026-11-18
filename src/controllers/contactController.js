import * as contactService from '../services/contactService.js';

export async function createContact(req, res) {
  const db = req.app.locals.db;
  const contact = await contactService.createContactMessage(db, req.body);
  res.status(201).json({
    message: 'Mensaje enviado correctamente. Te responderemos a la brevedad.',
    contact,
  });
}

export async function getContacts(req, res) {
  const db = req.app.locals.db;
  const items = await contactService.listContactMessages(db, req.query);
  res.status(200).json({ items, total: items.length });
}

export async function updateContactStatus(req, res) {
  const db = req.app.locals.db;
  const contact = await contactService.updateContactStatus(db, req.params.id, req.body?.status);
  res.status(200).json(contact);
}
