import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'quanlygiaoly.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'teacher'  -- 'admin' | 'teacher'
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    year TEXT,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    saint_name TEXT,
    birth_date TEXT,
    gender TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    student_phone TEXT,
    address TEXT,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    notes TEXT,
    sacrament TEXT DEFAULT 'none'  -- 'none' | 'vo_long' | 'them_suc'
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'present',  -- 'present' | 'absent' | 'late'
    UNIQUE(student_id, date)
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    score REAL NOT NULL,
    date TEXT NOT NULL DEFAULT (date('now'))
  );
`);

// Migration: thêm cột mới cho CSDL đã tồn tại (nếu thiếu)
const studentCols = db.prepare('PRAGMA table_info(students)').all().map((c) => c.name);
for (const col of ['parent_name', 'student_phone', 'address']) {
  if (!studentCols.includes(col)) {
    db.exec(`ALTER TABLE students ADD COLUMN ${col} TEXT`);
  }
}
if (!studentCols.includes('sacrament')) {
  db.exec("ALTER TABLE students ADD COLUMN sacrament TEXT DEFAULT 'none'");
}

// Seed tài khoản admin mặc định nếu chưa có user nào
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
  ).run('admin', hash, 'Quản trị viên', 'admin');
  console.log('Đã tạo tài khoản admin mặc định: admin / admin123');
}

export default db;
