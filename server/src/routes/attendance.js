import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Điểm danh của một lớp trong một ngày: ?class_id=&date=
router.get('/', requireAuth, (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id || !date) {
    return res.status(400).json({ error: 'Cần class_id và date' });
  }
  const students = db
    .prepare('SELECT id, full_name, saint_name FROM students WHERE class_id = ? ORDER BY full_name')
    .all(class_id);
  const records = db
    .prepare(
      `SELECT a.student_id, a.status FROM attendance a
       JOIN students s ON s.id = a.student_id
       WHERE s.class_id = ? AND a.date = ?`
    )
    .all(class_id, date);
  const statusMap = Object.fromEntries(records.map((r) => [r.student_id, r.status]));
  res.json(
    students.map((s) => ({ ...s, status: statusMap[s.id] || null }))
  );
});

// Lưu điểm danh (upsert nhiều học viên cùng lúc)
router.post('/', requireAuth, (req, res) => {
  const { date, records } = req.body || {};
  if (!date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Cần date và danh sách records' });
  }
  const upsert = db.prepare(
    `INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)
     ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status`
  );
  const tx = db.transaction((items) => {
    for (const r of items) upsert.run(r.student_id, date, r.status);
  });
  tx(records);
  res.json({ ok: true, count: records.length });
});

export default router;
