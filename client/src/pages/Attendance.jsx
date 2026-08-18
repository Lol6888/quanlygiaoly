import { useEffect, useState } from 'react';
import api from '../api';

const today = () => new Date().toISOString().slice(0, 10);
const STATUSES = [
  { key: 'present', label: 'Có mặt' },
  { key: 'absent', label: 'Vắng' },
  { key: 'late', label: 'Trễ' },
];

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.get('/classes').then((r) => setClasses(r.data)); }, []);

  useEffect(() => {
    if (!classId) { setRows([]); return; }
    api.get(`/attendance?class_id=${classId}&date=${date}`).then((r) => setRows(r.data));
    setSaved(false);
  }, [classId, date]);

  function setStatus(studentId, status) {
    setRows((rs) => rs.map((r) => (r.id === studentId ? { ...r, status } : r)));
    setSaved(false);
  }

  function markAll(status) {
    setRows((rs) => rs.map((r) => ({ ...r, status })));
    setSaved(false);
  }

  async function save() {
    const records = rows.map((r) => ({ student_id: r.id, status: r.status || 'present' }));
    await api.post('/attendance', { date, records });
    setSaved(true);
  }

  return (
    <div>
      <h1>Điểm danh</h1>
      <div className="toolbar">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ width: 220 }}>
          <option value="">-- Chọn lớp --</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
        {classId && rows.length > 0 && (
          <button className="btn ghost" onClick={() => markAll('present')}>Đánh dấu tất cả có mặt</button>
        )}
      </div>

      {classId && (
        <div className="panel">
          {rows.length === 0 ? (
            <p className="muted">Lớp chưa có học viên.</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr><th>Tên thánh</th><th>Họ tên</th><th>Trạng thái</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.saint_name || '—'}</td>
                      <td>{r.full_name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {STATUSES.map((s) => (
                            <button
                              key={s.key}
                              className={`btn sm ${r.status === s.key ? '' : 'ghost'}`}
                              onClick={() => setStatus(r.id, s.key)}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn" onClick={save}>Lưu điểm danh</button>
                {saved && <span style={{ color: 'var(--success)' }}>✓ Đã lưu</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
