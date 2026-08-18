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

// Câu lệnh chèn học viên dùng chung cho thêm đơn lẻ và nhập hàng loạt
const insertStudent = (s) =>
  db
    .prepare(
      `INSERT INTO students (full_name, saint_name, birth_date, gender, parent_name, parent_phone, student_phone, address, class_id, notes)
       VALUES (@full_name, @saint_name, @birth_date, @gender, @parent_name, @parent_phone, @student_phone, @address, @class_id, @notes)`
    )
    .run({
      full_name: s.full_name,
      saint_name: s.saint_name || null,
      birth_date: s.birth_date || null,
      gender: s.gender || null,
      parent_name: s.parent_name || null,
      parent_phone: s.parent_phone || null,
      student_phone: s.student_phone || null,
      address: s.address || null,
      class_id: s.class_id || null,
      notes: s.notes || null,
    });

// Thêm học viên
router.post('/', requireAuth, (req, res) => {
  const { full_name } = req.body || {};
  if (!full_name) return res.status(400).json({ error: 'Thiếu họ tên học viên' });
  const info = insertStudent(req.body);
  res.status(201).json(db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid));
});

// Nhập hàng loạt: { class_id?, students: [...] }
router.post('/bulk', requireAuth, (req, res) => {
  const { class_id, students } = req.body || {};
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'Danh sách học viên trống' });
  }
  const valid = students.filter((s) => s.full_name && s.full_name.trim());
  if (valid.length === 0) {
    return res.status(400).json({ error: 'Không có dòng nào hợp lệ (thiếu họ tên)' });
  }
  const tx = db.transaction((items) => {
    for (const s of items) insertStudent({ ...s, class_id: class_id || s.class_id || null });
  });
  tx(valid);
  res.status(201).json({ count: valid.length, skipped: students.length - valid.length });
});

// Cập nhật học viên
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy học viên' });
  const {
    full_name, saint_name, birth_date, gender,
    parent_name, parent_phone, student_phone, address, class_id, notes,
  } = req.body || {};
  db.prepare(
    `UPDATE students SET full_name = ?, saint_name = ?, birth_date = ?, gender = ?,
     parent_name = ?, parent_phone = ?, student_phone = ?, address = ?, class_id = ?, notes = ? WHERE id = ?`
  ).run(
    full_name ?? existing.full_name,
    saint_name ?? existing.saint_name,
    birth_date ?? existing.birth_date,
    gender ?? existing.gender,
    parent_name ?? existing.parent_name,
    parent_phone ?? existing.parent_phone,
    student_phone ?? existing.student_phone,
    address ?? existing.address,
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
