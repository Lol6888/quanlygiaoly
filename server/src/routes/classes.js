import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = Router();

// Danh sách lớp kèm tên giáo lý viên phụ trách và sĩ số
router.get('/', requireAuth, (req, res) => {
  const classes = db
    .prepare(
      `SELECT c.*, u.full_name AS teacher_name,
              (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
       FROM classes c
       LEFT JOIN users u ON u.id = c.teacher_id
       ORDER BY c.name`
    )
    .all();
  res.json(classes);
});

// Tạo lớp - chỉ admin
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, year, teacher_id } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Thiếu tên lớp' });
  const info = db
    .prepare('INSERT INTO classes (name, year, teacher_id) VALUES (?, ?, ?)')
    .run(name, year || null, teacher_id || null);
  res.status(201).json(db.prepare('SELECT * FROM classes WHERE id = ?').get(info.lastInsertRowid));
});

// Cập nhật lớp - chỉ admin
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { name, year, teacher_id } = req.body || {};
  const existing = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy lớp' });
  db.prepare('UPDATE classes SET name = ?, year = ?, teacher_id = ? WHERE id = ?').run(
    name ?? existing.name,
    year ?? existing.year,
    teacher_id ?? existing.teacher_id,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id));
});

// Xóa lớp - chỉ admin
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
