import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Danh sách học viên, lọc theo lớp qua ?class_id=
router.get('/', requireAuth, (req, res) => {
  const { class_id } = req.query;
  let rows;
  if (class_id) {
    rows = db
      .prepare(
        `SELECT s.*, c.name AS class_name FROM students s
         LEFT JOIN classes c ON c.id = s.class_id
         WHERE s.class_id = ? ORDER BY s.full_name`
      )
      .all(class_id);
  } else {
    rows = db
      .prepare(
        `SELECT s.*, c.name AS class_name FROM students s
         LEFT JOIN classes c ON c.id = s.class_id
         ORDER BY s.full_name`
      )
      .all();
  }
  res.json(rows);
});

// Chi tiết học viên kèm điểm và điểm danh
router.get('/:id', requireAuth, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Không tìm thấy học viên' });
  student.grades = db
    .prepare('SELECT * FROM grades WHERE student_id = ? ORDER BY date DESC')
    .all(req.params.id);
  student.attendance = db
    .prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC')
    .all(req.params.id);
  res.json(student);
});

// Thêm học viên
router.post('/', requireAuth, (req, res) => {
  const { full_name, saint_name, birth_date, gender, parent_phone, class_id, notes } =
    req.body || {};
  if (!full_name) return res.status(400).json({ error: 'Thiếu họ tên học viên' });
  const info = db
    .prepare(
      `INSERT INTO students (full_name, saint_name, birth_date, gender, parent_phone, class_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(full_name, saint_name || null, birth_date || null, gender || null, parent_phone || null, class_id || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid));
});

// Cập nhật học viên
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy học viên' });
  const { full_name, saint_name, birth_date, gender, parent_phone, class_id, notes } =
    req.body || {};
  db.prepare(
    `UPDATE students SET full_name = ?, saint_name = ?, birth_date = ?, gender = ?,
     parent_phone = ?, class_id = ?, notes = ? WHERE id = ?`
  ).run(
    full_name ?? existing.full_name,
    saint_name ?? existing.saint_name,
    birth_date ?? existing.birth_date,
    gender ?? existing.gender,
    parent_phone ?? existing.parent_phone,
    class_id ?? existing.class_id,
    notes ?? existing.notes,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id));
});

// Xóa học viên
router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
