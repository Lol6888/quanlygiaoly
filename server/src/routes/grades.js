import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Điểm của một học viên: ?student_id=
router.get('/', requireAuth, (req, res) => {
  const { student_id } = req.query;
  if (!student_id) return res.status(400).json({ error: 'Cần student_id' });
  const rows = db
    .prepare('SELECT * FROM grades WHERE student_id = ? ORDER BY date DESC')
    .all(student_id);
  res.json(rows);
});

// Thêm cột điểm
router.post('/', requireAuth, (req, res) => {
  const { student_id, title, score, date } = req.body || {};
  if (!student_id || !title || score === undefined || score === null) {
    return res.status(400).json({ error: 'Cần student_id, title và score' });
  }
  const info = db
    .prepare('INSERT INTO grades (student_id, title, score, date) VALUES (?, ?, ?, ?)')
    .run(student_id, title, Number(score), date || new Date().toISOString().slice(0, 10));
  res.status(201).json(db.prepare('SELECT * FROM grades WHERE id = ?').get(info.lastInsertRowid));
});

// Xóa cột điểm
router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM grades WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
