import { useEffect, useState } from 'react';
import api from '../api';
import { exportXlsx, exportPdf, STT_COL, fileSlug } from '../lib/exportUtils';

const today = () => new Date().toISOString().slice(0, 10);

export default function Grades() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null); // student
  const [grades, setGrades] = useState([]);
  const [form, setForm] = useState({ title: '', score: '', date: today() });
  const [error, setError] = useState('');

  useEffect(() => { api.get('/classes').then((r) => setClasses(r.data)); }, []);

  useEffect(() => {
    if (!classId) { setStudents([]); return; }
    api.get(`/students?class_id=${classId}`).then((r) => setStudents(r.data));
    setSelected(null);
    setGrades([]);
  }, [classId]);

  function openStudent(s) {
    setSelected(s);
    setError('');
    api.get(`/grades?student_id=${s.id}`).then((r) => setGrades(r.data));
  }

  async function addGrade() {
    setError('');
    if (!form.title || form.score === '') { setError('Nhập tên cột điểm và điểm số'); return; }
    try {
      await api.post('/grades', { student_id: selected.id, ...form, score: Number(form.score) });
      setForm({ title: '', score: '', date: today() });
      const r = await api.get(`/grades?student_id=${selected.id}`);
      setGrades(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Lưu thất bại');
    }
  }

  async function removeGrade(g) {
    await api.delete(`/grades/${g.id}`);
    setGrades((gs) => gs.filter((x) => x.id !== g.id));
  }

  const avg = grades.length
    ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1)
    : null;

  const className = classes.find((c) => String(c.id) === String(classId))?.name || '';

  // Bảng điểm cả lớp: pivot học viên × cột điểm + TB (tải điểm mọi học viên rồi xuất)
  async function exportGradeSheet(mode) {
    const all = await Promise.all(
      students.map((s) =>
        api.get(`/grades?student_id=${s.id}`).then((r) => ({ student: s, grades: r.data }))
      )
    );
    const titles = [];
    for (const { grades: gs } of all)
      for (const g of gs) if (!titles.includes(g.title)) titles.push(g.title);

    const columns = [
      STT_COL,
      { label: 'Tên thánh', get: (r) => r.student.saint_name || '', width: 14 },
      { label: 'Họ và tên', get: (r) => r.student.full_name, width: 24 },
      ...titles.map((t) => ({
        label: t,
        get: (r) => {
          const g = r.grades.find((x) => x.title === t);
          return g ? g.score : '';
        },
        width: 12,
      })),
      {
        label: 'TB',
        get: (r) =>
          r.grades.length
            ? (r.grades.reduce((s, g) => s + g.score, 0) / r.grades.length).toFixed(1)
            : '',
        width: 8,
      },
    ];
    const meta = { title: 'Bảng điểm', subtitle: `Lớp: ${className}`, columns, rows: all };
    if (mode === 'excel')
      exportXlsx({ filename: `bang-diem-${fileSlug(className)}.xlsx`, sheetName: 'Bảng điểm', ...meta });
    else exportPdf(meta);
  }

  return (
    <div>
      <h1>Điểm số</h1>
      <div className="toolbar">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ width: 220 }}>
          <option value="">-- Chọn lớp --</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {classId && students.length > 0 && (
          <>
            <button className="btn ghost" onClick={() => exportGradeSheet('excel')}>⬇ Excel bảng điểm</button>
            <button className="btn ghost" onClick={() => exportGradeSheet('pdf')}>🖨 PDF bảng điểm</button>
          </>
        )}
      </div>

      {classId && (
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <div className="panel" style={{ flex: '0 0 280px' }}>
            <h2>Học viên</h2>
            <table>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => openStudent(s)}>
                    <td style={{ fontWeight: selected?.id === s.id ? 700 : 400 }}>
                      {s.saint_name ? s.saint_name + ' ' : ''}{s.full_name}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && <tr><td className="muted">Lớp chưa có học viên</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="panel" style={{ flex: 1 }}>
            {!selected ? (
              <p className="muted">Chọn một học viên để xem và nhập điểm.</p>
            ) : (
              <>
                <h2>
                  {selected.full_name}
                  {avg && <span className="muted" style={{ fontWeight: 400 }}> — TB: {avg}</span>}
                </h2>
                <div className="row" style={{ alignItems: 'flex-end' }}>
                  <div className="field">
                    <label>Tên cột điểm</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Kiểm tra 15'" />
                  </div>
                  <div className="field" style={{ flex: '0 0 100px' }}>
                    <label>Điểm</label>
                    <input type="number" step="0.1" min="0" max="10" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
                  </div>
                  <div className="field" style={{ flex: '0 0 150px' }}>
                    <label>Ngày</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="field" style={{ flex: '0 0 auto' }}>
                    <button className="btn" onClick={addGrade}>Thêm</button>
                  </div>
                </div>
                {error && <div className="error">{error}</div>}

                <table style={{ marginTop: 12 }}>
                  <thead>
                    <tr><th>Cột điểm</th><th>Điểm</th><th>Ngày</th><th></th></tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => (
                      <tr key={g.id}>
                        <td>{g.title}</td>
                        <td>{g.score}</td>
                        <td>{g.date}</td>
                        <td><button className="btn danger sm" onClick={() => removeGrade(g)}>Xóa</button></td>
                      </tr>
                    ))}
                    {grades.length === 0 && <tr><td colSpan={4} className="muted">Chưa có điểm</td></tr>}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
