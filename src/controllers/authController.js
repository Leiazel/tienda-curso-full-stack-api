import * as authService from '../services/authService.js';

export async function register(req, res) {
  const db = req.app.locals.db;
  const result = await authService.registerUser(db, req.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const db = req.app.locals.db;
  const result = await authService.loginUser(db, req.body);
  res.status(200).json(result);
}

export async function getMe(req, res) {
  const db = req.app.locals.db;
  const user = await authService.getUserProfile(db, req.user.id);
  res.status(200).json({ user });
}
