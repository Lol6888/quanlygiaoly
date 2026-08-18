import { useRef, useState } from 'react';
import api from '../api';
import { COLUMNS, parseStudents, templateCsv } from '../lib/parseStudents';

export default function BulkImport({ classes, onClose, onDone }) {
  const [text, setText] = useState('');
  const [classId, setClassId] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const validCount = rows.filter((r) => r._valid).length;

  function preview(t) {
    setText(t);
    setError('');
    setRows(parseStudents(t));
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => preview(String(reader.result || ''));
    reader.readAsText(file, 'utf-8');
  }

  function downloadTemplate() {
    const blob = new Blob([templateCsv()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau-nhap-hoc-vien.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function doImport() {
    setError('');
    if (validCount === 0) { setError('Không có dòng hợp lệ để nhập'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/students/bulk', {
        class_id: classId || null,
        students: rows.filter((r) => r._valid),
      });
      onDone(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Nhập thất bại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 760 }} onClick={(e) => e.stopPropagation()}>
        <h2>Nhập học viên hàng loạt</h2>

        <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>
          Mỗi dòng một học viên, các cột theo thứ tự (ngăn cách bởi dấu phẩy hoặc Tab khi dán từ Excel):
        </p>
        <div style={{ fontSize: 12.5, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '8px 12px', borderRadius: 10, marginBottom: 12 }}>
          {COLUMNS.join('  •  ')}
        </div>

        <div className="toolbar" style={{ marginBottom: 12 }}>
          <button className="btn ghost" onClick={downloadTemplate}>⬇ Tải form mẫu (CSV)</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>📄 Tải lên file CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: 'none' }} />
          <div className="grow" />
          <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ width: 200 }}>
            <option value="">Xếp vào lớp... (tùy chọn)</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => preview(e.target.value)}
          placeholder={'Phêrô Nguyễn Văn An, 26/12/2015, Nguyễn Văn Bố / Trần Thị Mẹ, 0901234567, , 123 Đường ABC, Ghi chú\nMaria Trần Thị Bình, 05/03/2016, Trần Văn Cha, 0912345678, , 45 Đường XYZ, '}
        />

        {rows.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Xem trước: <b>{validCount}</b> hợp lệ
              {rows.length - validCount > 0 && (
                <span style={{ color: 'var(--danger)' }}> · {rows.length - validCount} dòng thiếu họ tên sẽ bị bỏ qua</span>
              )}
            </div>
            <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
              <table>
                <thead>
                  <tr><th>Tên thánh</th><th>Họ tên</th><th>Ngày sinh</th><th>Phụ huynh</th><th>SĐT PH</th><th>SĐT HS</th><th>Địa chỉ</th></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ opacity: r._valid ? 1 : 0.45 }}>
                      <td>{r.saint_name || '—'}</td>
                      <td>{r.full_name || <span style={{ color: 'var(--danger)' }}>(thiếu)</span>}</td>
                      <td>{r.birth_date || '—'}</td>
                      <td>{r.parent_name || '—'}</td>
                      <td>{r.parent_phone || '—'}</td>
                      <td>{r.student_phone || '—'}</td>
                      <td>{r.address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Hủy</button>
          <button className="btn" onClick={doImport} disabled={saving || validCount === 0}>
            {saving ? 'Đang nhập...' : `Nhập ${validCount} học viên`}
          </button>
        </div>
      </div>
    </div>
  );
}
