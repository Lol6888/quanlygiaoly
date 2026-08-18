import { useEffect, useState } from 'react';
import api from '../api';
import { IconStudents, IconClass, IconTeacher } from '../components/Icons.jsx';

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/students').then((r) => setStudents(r.data));
    api.get('/classes').then((r) => setClasses(r.data));
  }, []);

  const assigned = classes.filter((c) => c.teacher_id).length;

  return (
    <div>
      <h1>Tổng quan</h1>
      <div className="stats">
        <div className="stat">
          <div className="icon ic-indigo"><IconStudents /></div>
          <div>
            <div className="num">{students.length}</div>
            <div className="lbl">Học viên</div>
          </div>
        </div>
        <div className="stat">
          <div className="icon ic-green"><IconClass /></div>
          <div>
            <div className="num">{classes.length}</div>
            <div className="lbl">Lớp học</div>
          </div>
        </div>
        <div className="stat">
          <div className="icon ic-orange"><IconTeacher /></div>
          <div>
            <div className="num">{assigned}</div>
            <div className="lbl">Lớp đã có GLV</div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Các lớp</h2>
        <table>
          <thead>
            <tr><th>Lớp</th><th>Niên khóa</th><th>Giáo lý viên</th><th>Sĩ số</th></tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.year || '—'}</td>
                <td>{c.teacher_name || <span className="muted">Chưa phân công</span>}</td>
                <td>{c.student_count}</td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr><td colSpan={4} className="muted">Chưa có lớp nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
