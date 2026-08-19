import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import './db.js'; // khởi tạo DB + seed admin
import authRoutes from './routes/auth.js';
import classesRoutes from './routes/classes.js';
import studentsRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import gradesRoutes from './routes/grades.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'quanlygiaoly-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API đang chạy tại http://localhost:${PORT}`);
});
