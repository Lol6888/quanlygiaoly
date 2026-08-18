import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import {
  IconHome, IconStudents, IconClass, IconCheck, IconGrades,
  IconDice, IconGame, IconTeacher, IconLogout, IconBell,
} from './Icons.jsx';

const nav = [
  { to: '/', label: 'Tổng quan', Icon: IconHome, end: true },
  { to: '/students', label: 'Học viên', Icon: IconStudents },
  { to: '/classes', label: 'Lớp học', Icon: IconClass },
  { to: '/attendance', label: 'Điểm danh', Icon: IconCheck },
  { to: '/grades', label: 'Điểm số', Icon: IconGrades },
  { to: '/random', label: 'Chọn trả bài', Icon: IconDice },
  { to: '/games', label: 'Game học', Icon: IconGame },
  { to: '/teachers', label: 'Giáo lý viên', Icon: IconTeacher, adminOnly: true },
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] || '?').toUpperCase();
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">✝</div>
          <span>Quản lý Giáo lý</span>
        </div>
        <nav>
          {nav
            .filter((n) => !n.adminOnly || user?.role === 'admin')
            .map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="greeting">
            <div className="hi">Xin chào, {user?.full_name} 👋</div>
            <div className="sub">Chúc bạn một buổi dạy giáo lý tốt lành</div>
          </div>
          <div className="spacer" />
          <button className="icon-btn" title="Thông báo"><IconBell /></button>
          <div className="user-box">
            <div className="avatar">{initials(user?.full_name)}</div>
            <div className="user-meta">
              <div className="name">{user?.full_name}</div>
              <div className="role">{user?.role === 'admin' ? 'Quản trị viên' : 'Giáo lý viên'}</div>
            </div>
            <button className="icon-btn" title="Đăng xuất" onClick={handleLogout}><IconLogout /></button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
