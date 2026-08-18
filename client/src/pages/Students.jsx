import { useEffect, useState } from 'react';
import api from '../api';
import BulkImport from '../components/BulkImport.jsx';
import { exportXlsx, exportPdf, STT_COL, fileSlug } from '../lib/exportUtils';

const empty = {
  full_name: '', saint_name: '', birth_date: '', gender: '',
  parent_name: '', parent_phone: '', student_phone: '', address: '', class_id: '', notes: '',
};

const studentColumns = [
  STT_COL,
  { label: 'Tên thánh', get: (s) => s.saint_name || '', width: 14 },
  { label: 'Họ và tên', get: (s) => s.full_name, width: 22 },
  { label: 'Ngày sinh', get: (s) => s.birth_date || '', width: 12 },
  { label: 'Giới tính', get: (s) => s.gender || '', width: 9 },
  { label: 'Lớp', get: (s) => s.class_name || '', width: 14 },
  { label: 'Phụ huynh', get: (s) => s.parent_name || '', width: 22 },
  { label: 'SĐT phụ huynh', get: (s) => s.parent_phone || '', width: 14 },
  { label: 'SĐT học sinh', get: (s) => s.student_phone || '', width: 14 },
  { label: 'Địa chỉ', get: (s) => s.address || '', width: 30 },
  { label: 'Ghi chú', get: (s) => s.notes || '', width: 20 },
];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | {form}
  const [bulkOpen, setBulkOpen] = useState(false);
  const [error, setError] = useState('');

  function load() {
    const q = filterClass ? `?class_id=${filterClass}` : '';
    api.get(`/students${q}`).then((r) => setStudents(r.data));
  }

  useEffect(() => { load(); }, [filterClass]);
  useEffect(() => { api.get('/classes').then((r) => setClasses(r.data)); }, []);

  function openCreate() { setError(''); setModal({ ...empty }); }
  function openEdit(s) { setError(''); setModal({ ...s, class_id: s.class_id || '' }); }

  async function save() {
    setError('');
    try {
      if (modal.id) await api.put(`/students/${modal.id}`, modal);
      else await api.post('/students', modal);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Lưu thất bại');
    }
  }

  async function remove(s) {
    if (!confirm(`Xóa học viên "${s.full_name}"?`)) return;
    await api.delete(`/students/${s.id}`);
    load();
  }

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const clsName = filterClass
    ? classes.find((c) => String(c.id) === String(filterClass))?.name
    : null;
  const exportMeta = {
    title: 'Danh sách học viên',
    subtitle: clsName ? `Lớp: ${clsName}` : 'Tất cả các lớp',
    columns: studentColumns,
    rows: filtered,
  };
  const exportName = `danh-sach-hoc-vien${clsName ? '-' + fileSlug(clsName) : ''}`;

  return (
    <div>
      <h1>Quản lý học viên</h1>
      <div className="toolbar">
        <input
          className="grow"
          placeholder="Tìm theo tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ width: 200 }}>
          <option value="">Tất cả lớp</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn ghost" onClick={() => setBulkOpen(true)}>⬆ Nhập hàng loạt</button>
        <button
          className="btn ghost"
          disabled={filtered.length === 0}
          onClick={() => exportXlsx({ filename: `${exportName}.xlsx`, sheetName: 'Học viên', ...exportMeta })}
        >
          ⬇ Excel
        </button>
        <button className="btn ghost" disabled={filtered.length === 0} onClick={() => exportPdf(exportMeta)}>
          🖨 PDF
        </button>
        <button className="btn" onClick={openCreate}>+ Thêm học viên</button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Tên thánh</th><th>Họ tên</th><th>Ngày sinh</th><th>Lớp</th><th>SĐT phụ huynh</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.saint_name || '—'}</td>
                <td>{s.full_name}</td>
                <td>{s.birth_date || '—'}</td>
                <td>{s.class_name || <span className="muted">Chưa xếp lớp</span>}</td>
                <td>{s.parent_phone || '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn ghost sm" onClick={() => openEdit(s)}>Sửa</button>{' '}
                  <button className="btn danger sm" onClick={() => remove(s)}>Xóa</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="muted">Không có học viên</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal.id ? 'Sửa học viên' : 'Thêm học viên'}</h2>
            <div className="row">
              <div className="field">
                <label>Tên thánh</label>
                <input value={modal.saint_name || ''} onChange={(e) => setModal({ ...modal, saint_name: e.target.value })} />
              </div>
              <div className="field">
                <label>Họ tên *</label>
                <input value={modal.full_name} onChange={(e) => setModal({ ...modal, full_name: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Ngày sinh</label>
                <input type="date" value={modal.birth_date || ''} onChange={(e) => setModal({ ...modal, birth_date: e.target.value })} />
              </div>
              <div className="field">
                <label>Giới tính</label>
                <select value={modal.gender || ''} onChange={(e) => setModal({ ...modal, gender: e.target.value })}>
                  <option value="">—</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Lớp</label>
                <select value={modal.class_id || ''} onChange={(e) => setModal({ ...modal, class_id: e.target.value })}>
                  <option value="">Chưa xếp lớp</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Tên phụ huynh</label>
                <input value={modal.parent_name || ''} onChange={(e) => setModal({ ...modal, parent_name: e.target.value })} placeholder="VD: Nguyễn Văn Bố / Trần Thị Mẹ" />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>SĐT phụ huynh</label>
                <input value={modal.parent_phone || ''} onChange={(e) => setModal({ ...modal, parent_phone: e.target.value })} />
              </div>
              <div className="field">
                <label>SĐT học sinh</label>
                <input value={modal.student_phone || ''} onChange={(e) => setModal({ ...modal, student_phone: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Địa chỉ</label>
              <input value={modal.address || ''} onChange={(e) => setModal({ ...modal, address: e.target.value })} />
            </div>
            <div className="field">
              <label>Ghi chú</label>
              <textarea rows={2} value={modal.notes || ''} onChange={(e) => setModal({ ...modal, notes: e.target.value })} />
            </div>
            {error && <div className="error">{error}</div>}
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModal(null)}>Hủy</button>
              <button className="btn" onClick={save}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <BulkImport
          classes={classes}
          onClose={() => setBulkOpen(false)}
          onDone={(res) => {
            setBulkOpen(false);
            load();
            alert(`Đã nhập ${res.count} học viên` + (res.skipped ? `, bỏ qua ${res.skipped} dòng thiếu họ tên` : ''));
          }}
        />
      )}
    </div>
  );
}
