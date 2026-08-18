import { useEffect, useState } from 'react';
import api from '../api';

const empty = { username: '', password: '', full_name: '', role: 'teacher' };

export default function Teachers() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');

  function load() { api.get('/auth/users').then((r) => setUsers(r.data)); }
  useEffect(() => { load(); }, []);

  function openCreate() { setError(''); setModal({ ...empty }); }

  async function save() {
    setError('');
    try {
      await api.post('/auth/users', modal);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Lưu thất bại');
    }
  }

  async function remove(u) {
    if (!confirm(`Xóa tài khoản "${u.full_name}"?`)) return;
    try {
      await api.delete(`/auth/users/${u.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Xóa thất bại');
    }
  }

  return (
    <div>
      <h1>Quản lý giáo lý viên</h1>
      <div className="toolbar">
        <button className="btn" onClick={openCreate}>+ Thêm tài khoản</button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr><th>Họ tên</th><th>Tên đăng nhập</th><th>Vai trò</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.username}</td>
                <td>{u.role === 'admin' ? 'Quản trị' : 'Giáo lý viên'}</td>
                <td><button className="btn danger sm" onClick={() => remove(u)}>Xóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Thêm tài khoản</h2>
            <div className="field">
              <label>Họ tên *</label>
              <input value={modal.full_name} onChange={(e) => setModal({ ...modal, full_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Tên đăng nhập *</label>
              <input value={modal.username} onChange={(e) => setModal({ ...modal, username: e.target.value })} />
            </div>
            <div className="field">
              <label>Mật khẩu *</label>
              <input type="password" value={modal.password} onChange={(e) => setModal({ ...modal, password: e.target.value })} />
            </div>
            <div className="field">
              <label>Vai trò</label>
              <select value={modal.role} onChange={(e) => setModal({ ...modal, role: e.target.value })}>
                <option value="teacher">Giáo lý viên</option>
                <option value="admin">Quản trị</option>
              </select>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModal(null)}>Hủy</button>
              <button className="btn" onClick={save}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
