import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Số liệu tổng hợp cho trang Tổng quan
router.get('/', requireAuth, (req, res) => {
  const counts = {
    students: db.prepare('SELECT COUNT(*) AS c FROM students').get().c,
    classes: db.prepare('SELECT COUNT(*) AS c FROM classes').get().c,
    teachers: db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'teacher'").get().c,
    avgScore: db.prepare('SELECT ROUND(AVG(score), 1) AS a FROM grades').get().a || 0,
  };

  // Học viên theo lớp (cho biểu đồ donut)
  const studentsPerClass = db
    .prepare(
      `SELECT c.name, COUNT(s.id) AS count
       FROM classes c LEFT JOIN students s ON s.class_id = c.id
       GROUP BY c.id ORDER BY count DESC`
    )
    .all();

  // Học viên xuất sắc (điểm TB cao nhất)
  const topStudents = db
    .prepare(
      `SELECT s.id, s.saint_name, s.full_name,
              ROUND(AVG(g.score), 1) AS avg, COUNT(g.id) AS grade_count
       FROM students s JOIN grades g ON g.student_id = s.id
       GROUP BY s.id ORDER BY avg DESC LIMIT 5`
    )
    .all();

  // Điểm TB theo lớp (cho thanh xếp hạng)
  const classAverages = db
    .prepare(
      `SELECT c.name, ROUND(AVG(g.score), 1) AS avg
       FROM classes c
       JOIN students s ON s.class_id = c.id
       JOIN grades g ON g.student_id = s.id
       GROUP BY c.id ORDER BY avg DESC`
    )
    .all();

  res.json({ counts, studentsPerClass, topStudents, classAverages });
});

export default router;
