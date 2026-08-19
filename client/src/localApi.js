// Adapter chạy hoàn toàn phía trình duyệt (localStorage) — dùng cho bản demo trên Vercel.
// Mô phỏng đúng các endpoint của backend Express để không phải sửa code trang.
import seed from './seedData.json';

const KEY = 'qlgl_demo_db';
let db = null;

function init() {
  if (db) return db;
  const raw = localStorage.getItem(KEY);
  if (raw) {
    db = JSON.parse(raw);
    return db;
  }
  db = {
    users: [
      { id: 1, username: 'admin', password: 'admin123', full_name: 'Quản trị viên', role: 'admin' },
      { id: 2, username: 'glv', password: 'glv123', full_name: 'Têrêsa Nguyễn Thị Hoa', role: 'teacher' },
    ],
    classes: seed.classes.map((c) => ({ ...c })),
    students: seed.students.map((s) => ({ ...s })),
    grades: seed.grades.map((g) => ({ ...g })),
    attendance: seed.attendance.map((a) => ({ ...a })),
  };
  save();
  return db;
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
}
const nextId = (arr) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const ok = (data) => Promise.resolve({ data });
const fail = (status, error) => Promise.reject({ response: { status, data: { error } } });

const className = (id) => db.classes.find((c) => c.id == id)?.name || null;
const round1 = (n) => Math.round(n * 10) / 10;

function studentPublic(s) {
  return { ...s, class_name: className(s.class_id) };
}

function handle(method, rawUrl, body = {}) {
  init();
  const [path, qs] = rawUrl.split('?');
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  const seg = path.split('/').filter(Boolean); // ['students','5']

  // ---- auth ----
  if (path === '/auth/login' && method === 'post') {
    const u = db.users.find((x) => x.username === body.username && x.password === body.password);
    if (!u) return fail(401, 'Sai tên đăng nhập hoặc mật khẩu');
    return ok({ token: 'demo-token', user: { id: u.id, username: u.username, full_name: u.full_name, role: u.role } });
  }
  if (path === '/auth/me' && method === 'get') {
    return ok({ user: db.users[0] });
  }
  if (path === '/auth/users' && method === 'get') {
    return ok(db.users.map((u) => ({ id: u.id, username: u.username, full_name: u.full_name, role: u.role })));
  }
  if (path === '/auth/users' && method === 'post') {
    if (!body.username || !body.password || !body.full_name) return fail(400, 'Thiếu thông tin bắt buộc');
    if (db.users.some((u) => u.username === body.username)) return fail(409, 'Tên đăng nhập đã tồn tại');
    const user = { id: nextId(db.users), username: body.username, password: body.password, full_name: body.full_name, role: body.role === 'admin' ? 'admin' : 'teacher' };
    db.users.push(user); save();
    return ok({ id: user.id, username: user.username, full_name: user.full_name, role: user.role });
  }
  if (seg[0] === 'auth' && seg[1] === 'users' && seg[2] && method === 'delete') {
    if (Number(seg[2]) === 1) return fail(400, 'Không thể xóa tài khoản quản trị mặc định');
    db.users = db.users.filter((u) => u.id != seg[2]); save();
    return ok({ ok: true });
  }

  // ---- classes ----
  if (path === '/classes' && method === 'get') {
    return ok(
      db.classes
        .map((c) => ({
          ...c,
          teacher_name: db.users.find((u) => u.id == c.teacher_id)?.full_name || null,
          student_count: db.students.filter((s) => s.class_id == c.id).length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    );
  }
  if (path === '/classes' && method === 'post') {
    if (!body.name) return fail(400, 'Thiếu tên lớp');
    const c = { id: nextId(db.classes), name: body.name, year: body.year || null, teacher_id: body.teacher_id || null };
    db.classes.push(c); save();
    return ok(c);
  }
  if (seg[0] === 'classes' && seg[1] && method === 'put') {
    const c = db.classes.find((x) => x.id == seg[1]);
    if (!c) return fail(404, 'Không tìm thấy lớp');
    Object.assign(c, { name: body.name ?? c.name, year: body.year ?? c.year, teacher_id: body.teacher_id ?? c.teacher_id });
    save();
    return ok(c);
  }
  if (seg[0] === 'classes' && seg[1] && method === 'delete') {
    db.classes = db.classes.filter((x) => x.id != seg[1]);
    db.students.forEach((s) => { if (s.class_id == seg[1]) s.class_id = null; });
    save();
    return ok({ ok: true });
  }

  // ---- students ----
  if (path === '/students' && method === 'get') {
    let rows = db.students.slice();
    if (q.class_id) rows = rows.filter((s) => s.class_id == q.class_id);
    rows.sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi'));
    return ok(rows.map(studentPublic));
  }
  if (path === '/students' && method === 'post') {
    if (!body.full_name) return fail(400, 'Thiếu họ tên học viên');
    const s = newStudent(body);
    db.students.push(s); save();
    return ok(studentPublic(s));
  }
  if (path === '/students/bulk' && method === 'post') {
    const list = Array.isArray(body.students) ? body.students : [];
    const valid = list.filter((s) => s.full_name && s.full_name.trim());
    if (valid.length === 0) return fail(400, 'Không có dòng nào hợp lệ (thiếu họ tên)');
    valid.forEach((s) => db.students.push(newStudent({ ...s, class_id: body.class_id || s.class_id || null })));
    save();
    return ok({ count: valid.length, skipped: list.length - valid.length });
  }
  if (seg[0] === 'students' && seg[1] && method === 'get') {
    const s = db.students.find((x) => x.id == seg[1]);
    if (!s) return fail(404, 'Không tìm thấy học viên');
    return ok({
      ...s,
      grades: db.grades.filter((g) => g.student_id == s.id),
      attendance: db.attendance.filter((a) => a.student_id == s.id),
    });
  }
  if (seg[0] === 'students' && seg[1] && method === 'put') {
    const s = db.students.find((x) => x.id == seg[1]);
    if (!s) return fail(404, 'Không tìm thấy học viên');
    for (const k of ['full_name', 'saint_name', 'birth_date', 'gender', 'parent_name', 'parent_phone', 'student_phone', 'address', 'class_id', 'notes', 'sacrament'])
      if (body[k] !== undefined) s[k] = body[k];
    save();
    return ok(studentPublic(s));
  }
  if (seg[0] === 'students' && seg[1] && method === 'delete') {
    db.students = db.students.filter((x) => x.id != seg[1]);
    db.grades = db.grades.filter((g) => g.student_id != seg[1]);
    db.attendance = db.attendance.filter((a) => a.student_id != seg[1]);
    save();
    return ok({ ok: true });
  }

  // ---- attendance ----
  if (path === '/attendance' && method === 'get') {
    if (!q.class_id || !q.date) return fail(400, 'Cần class_id và date');
    const students = db.students.filter((s) => s.class_id == q.class_id).sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi'));
    const recs = db.attendance.filter((a) => a.date === q.date);
    return ok(students.map((s) => ({ id: s.id, full_name: s.full_name, saint_name: s.saint_name, status: recs.find((r) => r.student_id == s.id)?.status || null })));
  }
  if (path === '/attendance' && method === 'post') {
    const { date, records } = body;
    if (!date || !Array.isArray(records)) return fail(400, 'Cần date và danh sách records');
    for (const r of records) {
      const ex = db.attendance.find((a) => a.student_id == r.student_id && a.date === date);
      if (ex) ex.status = r.status;
      else db.attendance.push({ id: nextId(db.attendance), student_id: r.student_id, date, status: r.status });
    }
    save();
    return ok({ ok: true, count: records.length });
  }

  // ---- grades ----
  if (path === '/grades' && method === 'get') {
    if (!q.student_id) return fail(400, 'Cần student_id');
    return ok(db.grades.filter((g) => g.student_id == q.student_id).sort((a, b) => (b.date || '').localeCompare(a.date || '')));
  }
  if (path === '/grades' && method === 'post') {
    if (!body.student_id || !body.title || body.score === undefined || body.score === null) return fail(400, 'Cần student_id, title và score');
    const g = { id: nextId(db.grades), student_id: body.student_id, title: body.title, score: Number(body.score), date: body.date || new Date().toISOString().slice(0, 10) };
    db.grades.push(g); save();
    return ok(g);
  }
  if (seg[0] === 'grades' && seg[1] && method === 'delete') {
    db.grades = db.grades.filter((g) => g.id != seg[1]); save();
    return ok({ ok: true });
  }

  // ---- dashboard ----
  if (path === '/dashboard' && method === 'get') {
    const counts = {
      students: db.students.length,
      classes: db.classes.length,
      teachers: db.users.filter((u) => u.role === 'teacher').length,
      avgScore: db.grades.length ? round1(db.grades.reduce((s, g) => s + g.score, 0) / db.grades.length) : 0,
    };
    const studentsPerClass = db.classes
      .map((c) => ({ name: c.name, count: db.students.filter((s) => s.class_id == c.id).length }))
      .sort((a, b) => b.count - a.count);
    const byStudent = {};
    db.grades.forEach((g) => { (byStudent[g.student_id] = byStudent[g.student_id] || []).push(g.score); });
    const topStudents = Object.entries(byStudent)
      .map(([id, arr]) => {
        const s = db.students.find((x) => x.id == id) || {};
        return { id: Number(id), saint_name: s.saint_name, full_name: s.full_name, avg: round1(arr.reduce((a, b) => a + b, 0) / arr.length), grade_count: arr.length };
      })
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
    const classAverages = db.classes
      .map((c) => {
        const ids = db.students.filter((s) => s.class_id == c.id).map((s) => s.id);
        const scores = db.grades.filter((g) => ids.includes(g.student_id)).map((g) => g.score);
        return scores.length ? { name: c.name, avg: round1(scores.reduce((a, b) => a + b, 0) / scores.length) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.avg - a.avg);
    return ok({ counts, studentsPerClass, topStudents, classAverages });
  }

  return fail(404, 'Không tìm thấy: ' + method.toUpperCase() + ' ' + path);
}

function newStudent(s) {
  return {
    id: nextId(db.students),
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
    sacrament: s.sacrament || 'none',
  };
}

const localApi = {
  get: (url) => handle('get', url),
  post: (url, body) => handle('post', url, body),
  put: (url, body) => handle('put', url, body),
  delete: (url) => handle('delete', url),
};

export default localApi;
