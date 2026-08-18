// Tiện ích phân tích danh sách học viên nhập hàng loạt (dán hoặc file CSV).
// Thứ tự cột theo yêu cầu:
//   1. Tên thánh + họ và tên   2. Ngày sinh   3. Tên phụ huynh
//   4. SĐT phụ huynh           5. SĐT học sinh 6. Địa chỉ   7. Ghi chú

export const COLUMNS = [
  'Tên thánh và họ tên',
  'Ngày sinh',
  'Tên phụ huynh',
  'SĐT phụ huynh',
  'SĐT học sinh',
  'Địa chỉ',
  'Ghi chú',
];

// Tên thánh nhiều chữ (khớp trước để ưu tiên chuỗi dài hơn)
const SAINTS_MULTI = [
  'Gioan Baotixita', 'Gioan Tẩy Giả', 'Maria Madalena', 'Maria Mađalêna', 'Maria Goretti',
  'Phanxicô Xaviê', 'Phanxicô Assisi', 'Vinh Sơn', 'Đa Minh', 'Gioan Phaolô', 'Phêrô Phaolô',
  'Têrêsa Hài Đồng', 'Anna Maria', 'Martinô Porres',
];

// Tên thánh một chữ
const SAINTS_SINGLE = [
  'Giuse', 'Maria', 'Phêrô', 'Phaolô', 'Gioan', 'Anê', 'Anna', 'Anrê', 'Antôn', 'Antôniô',
  'Augustinô', 'Bênêđictô', 'Bênađô', 'Bosco', 'Catarina', 'Cêcilia', 'Cecilia', 'Clara',
  'Đaminh', 'Đôminicô', 'Emmanuel', 'Faustina', 'Gabriel', 'Giacôbê', 'Gioakim', 'Giêrônimô',
  'Grêgôriô', 'Inê', 'Ignatiô', 'Inhaxiô', 'Isave', 'Lôrensô', 'Laurensô', 'Lucia', 'Luca',
  'Máccô', 'Marcô', 'Mátthêu', 'Matthêu', 'Micae', 'Michael', 'Monica', 'Martinô', 'Mađalêna',
  'Madalena', 'Nicôla', 'Philipphê', 'Rôsa', 'Rosa', 'Simon', 'Stêphanô', 'Tôma', 'Têrêsa',
  'Têrêxa', 'Tađêô', 'Vincentê', 'Veronica', 'Bartôlômêô', 'Batôlômêô', 'Phanxicô', 'Anphongsô',
  'Anphong', 'Clêmentê', 'Cornêliô', 'Đamianô', 'Raphael', 'Agata', 'Agatha', 'Barbara',
  'Elisabeth', 'Êlisabeth', 'Isaac', 'Isaia', 'Kitô',
];

const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');
const lower = (s) => norm(s).toLowerCase();

// Tách tên thánh khỏi họ tên (khớp phần đầu chuỗi)
export function splitSaintName(combined) {
  const name = norm(combined);
  const nameLower = lower(name);
  for (const saint of SAINTS_MULTI) {
    if (nameLower.startsWith(lower(saint) + ' ')) {
      return { saint_name: name.slice(saint.length).trim() ? saint : '', full_name: name.slice(saint.length).trim() };
    }
  }
  const firstWord = name.split(' ')[0] || '';
  if (SAINTS_SINGLE.some((s) => lower(s) === lower(firstWord)) && name.includes(' ')) {
    return { saint_name: firstWord, full_name: name.slice(firstWord.length).trim() };
  }
  return { saint_name: '', full_name: name };
}

// Chuẩn hóa ngày sinh về dạng YYYY-MM-DD (chấp nhận dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd)
export function normalizeDate(raw) {
  const s = norm(raw);
  if (!s) return '';
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/); // yyyy-mm-dd
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/); // dd/mm/yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return s; // giữ nguyên nếu không nhận dạng được
}

// Tách một dòng: ưu tiên Tab (dán từ Excel/Sheets), nếu không thì CSV có xử lý dấu ngoặc kép
function splitLine(line) {
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

// Phân tích toàn bộ text -> mảng object học viên
export function parseStudents(text) {
  const rows = [];
  const lines = (text || '').replace(/^﻿/, '').split(/\r?\n/);
  for (const line of lines) {
    if (!norm(line)) continue;
    const cells = splitLine(line);
    // Bỏ qua dòng tiêu đề
    if (lower(cells[0]).includes('tên thánh') || lower(cells[0]) === lower(COLUMNS[0])) continue;

    const { saint_name, full_name } = splitSaintName(cells[0] || '');
    rows.push({
      saint_name,
      full_name,
      birth_date: normalizeDate(cells[1] || ''),
      parent_name: norm(cells[2] || ''),
      parent_phone: norm(cells[3] || ''),
      student_phone: norm(cells[4] || ''),
      address: norm(cells[5] || ''),
      notes: norm(cells[6] || ''),
      _valid: !!full_name,
    });
  }
  return rows;
}

// Nội dung file CSV mẫu (kèm BOM để Excel mở đúng tiếng Việt)
export function templateCsv() {
  const header = COLUMNS.join(',');
  const example =
    'Phêrô Nguyễn Văn An,26/12/2015,Nguyễn Văn Bố / Trần Thị Mẹ,0901234567,,"123 Đường ABC, Phường 5, Quận 3",Ghi chú mẫu';
  return '﻿' + header + '\n' + example + '\n';
}
