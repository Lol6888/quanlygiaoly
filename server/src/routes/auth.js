import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, requireAuth, requireAdmin } from '../auth.js';

const router = Router();

// Đăng nhập
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
  });
});

// Thông tin người dùng hiện tại
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Danh sách người dùng (giáo lý viên) - chỉ admin
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const users = db
    .prepare('SELECT id, username, full_name, role FROM users ORDER BY full_name')
    .all();
  res.json(users);
});

// Tạo giáo lý viên / tài khoản mới - chỉ admin
router.post('/users', requireAuth, requireAdmin, (req, res) => {
  const { username, password, full_name, role } = req.body || {};
  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)')
    .run(username, hash, full_name, role === 'admin' ? 'admin' : 'teacher');
  res.status(201).json({ id: info.lastInsertRowid, username, full_name, role: role || 'teacher' });
});

// Xóa người dùng - chỉ admin
router.delete('/users/:id', requireAuth, requireAdmin, (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Không thể xóa chính mình' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
