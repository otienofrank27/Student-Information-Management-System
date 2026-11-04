import './styles.css';

const app = document.getElementById('app');
const PAGES = [
  ['dashboard', 'Overview', 'Registry pulse'],
  ['students', 'Students', 'Master records'],
  ['courses', 'Courses', 'Catalogue'],
  ['registrations', 'Enrolment', 'Course seats'],
  ['exams', 'Examinations', 'Marks & grades'],
  ['fees', 'Bursary', 'Payments'],
  ['admin', 'DBA vault', 'Objects & backup']
];

const state = {
  authenticated: false,
  user: null,
  view: 'home',
  page: 'dashboard',
  message: '',
  error: '',
  loading: false,
  departments: [],
  lecturers: [],
  students: [],
  courses: [],
  registrations: [],
  exams: [],
  fees: [],
  dashboard: null,
  admin: null,
  backups: [],
  studentQuery: '',
  schoolFilter: '',
  levelFilter: '',
  modal: null,
  clock: new Date()
};

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin',
    ...options
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }));
  if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function initials(first, last) {
  return `${(first || '?')[0]}${(last || '')[0] || ''}`.toUpperCase();
}

function flash(msg, isError = false) {
  state.message = isError ? '' : msg;
  state.error = isError ? msg : '';
  render();
  window.setTimeout(() => {
    if (state.message === msg || state.error === msg) {
      state.message = '';
      state.error = '';
      render();
    }
  }, 4200);
}

function openModal(title, fields, onSubmit, note = '') {
  state.modal = {
    title,
    note,
    fields,
    values: Object.fromEntries(fields.map((f) => [f.name, f.value ?? '']))
  };
  state._onSubmit = onSubmit;
  render();
}

function closeModal() {
  state.modal = null;
  state._onSubmit = null;
  render();
}

function fieldControl(f, values) {
  if (f.type === 'select') {
    return `<select name="${f.name}">${(f.options || []).map((o) =>
      `<option value="${esc(o.value)}" ${String(values[f.name]) === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`
    ).join('')}</select>`;
  }
  if (f.type === 'textarea') return `<textarea name="${f.name}">${esc(values[f.name] || '')}</textarea>`;
  return `<input type="${f.type || 'text'}" name="${f.name}" value="${esc(values[f.name] ?? '')}" ${f.required ? 'required' : ''} ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} step="${f.step || 'any'}" />`;
}

async function loadCore() {
  const [deps, lecturers] = await Promise.all([api('/api/departments'), api('/api/lecturers')]);
  state.departments = deps.data;
  state.lecturers = lecturers.data;
}

async function loadPage() {
  state.loading = true;
  state.error = '';
  try {
    if (state.page === 'dashboard') {
      state.dashboard = await api('/api/dashboard');
    } else if (state.page === 'students') {
      state.students = (await api(`/api/students?q=${encodeURIComponent(state.studentQuery)}`)).data;
    } else if (state.page === 'courses') {
      const params = new URLSearchParams();
      if (state.schoolFilter) params.set('school', state.schoolFilter);
      if (state.levelFilter) params.set('level', state.levelFilter);
      const qs = params.toString();
      state.courses = (await api(`/api/courses${qs ? `?${qs}` : ''}`)).data;
    } else if (state.page === 'registrations') {
      const [regs, students, courses] = await Promise.all([
        api('/api/registrations'), api('/api/students'), api('/api/courses')
      ]);
      state.registrations = regs.data;
      state.students = students.data;
      state.courses = courses.data;
    } else if (state.page === 'exams') {
      const [exams, regs] = await Promise.all([api('/api/examinations'), api('/api/registrations')]);
      state.exams = exams.data;
      state.registrations = regs.data;
    } else if (state.page === 'fees') {
      const [fees, students] = await Promise.all([api('/api/fees'), api('/api/students')]);
      state.fees = fees.data;
      state.students = students.data;
    } else if (state.page === 'admin') {
      const [admin, backups] = await Promise.all([api('/api/admin/objects'), api('/api/admin/backups')]);
      state.admin = admin;
      state.backups = backups.data;
    }
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
    render();
  }
}

function header(active) {
  return `
    <header class="site-header">
      <div class="brand-lockup">
        <img class="crest" src="/crest.svg" alt="Crestwood crest" />
        <div>
          <h1>Crestwood University</h1>
          <small>Registry &amp; records</small>
        </div>
      </div>
      <nav class="header-nav">
        <button data-view="home" class="${active === 'home' ? 'active' : ''}">Campus</button>
        <button data-view="academics" class="${active === 'academics' ? 'active' : ''}">Academics</button>
        <button data-view="registry" class="${active === 'registry' ? 'active' : ''}">Staff registry</button>
      </nav>
      <div class="header-cta">
        <button class="btn ghost" data-view="academics">Prospectus</button>
        <button class="btn copper" data-view="registry">Enter registry</button>
        <button class="btn ghost" id="logout">Sign out</button>
      </div>
    </header>`;
}

function footer() {
  return `
    <footer class="footnote">
      <span>Crestwood University · Academic year 2025/2026 · Normalised to 3NF on MariaDB</span>
      <span>Student numbers follow CU####### · Marks constrained 0–100 by trigger</span>
    </footer>`;
}

function renderHome() {
  const s = state.dashboard?.stats || {};
  const faculties = [...new Set(state.departments.map((d) => d.faculty))];
  return `
    ${header('home')}
    <section class="hero">
      <div class="hero-copy">
        <div class="kicker">Est. in the highlands · Official registry</div>
        <h2>A living record of every scholar, seat, and seal.</h2>
        <p>Crestwood offers 104 programmes across six credential levels and five schools. The registry keeps identities, enrolments, examinations and bursary in one disciplined ledger.</p>
        <div class="hero-actions">
          <button class="btn gold" data-view="registry">Open the staff registry</button>
          <button class="btn ghost" data-view="academics" style="color:#f8efd8;border-color:rgba(248,239,216,0.35)">Browse schools</button>
        </div>
      </div>
      <aside class="hero-panel">
        <h3>This term at a glance</h3>
        <p style="margin:0;color:var(--muted);font-size:13px">Drawn live from <span class="mono">sp_dashboard_stats</span></p>
        <div class="metric-row">
          <div class="metric"><b>${s.active_students ?? '—'}</b><span>Active scholars</span></div>
          <div class="metric"><b>${s.total_courses ?? '—'}</b><span>Academic programmes</span></div>
          <div class="metric"><b>${s.active_registrations ?? '—'}</b><span>Open enrolments</span></div>
          <div class="metric"><b>${s.exam_records ?? '—'}</b><span>Exam scripts</span></div>
        </div>
        <div class="rule"></div>
        <p style="margin:0;font-size:13px;color:var(--muted)">${faculties.length} schools · 104 programmes · six credential levels</p>
      </aside>
    </section>
    <section class="section">
      <div class="section-head">
        <div>
          <h3>Six credential levels</h3>
          <p>Certificates through doctorates, counted live from the catalogue.</p>
        </div>
      </div>
      <div class="stats">
        ${(state.dashboard?.byCredential || [
          { credential_level: 'Certificate', total: 35 },
          { credential_level: 'Diploma', total: 25 },
          { credential_level: 'Advanced Diploma', total: 3 },
          { credential_level: 'Bachelor', total: 37 },
          { credential_level: 'Master', total: 3 },
          { credential_level: 'Doctorate', total: 1 }
        ]).map((row) => `
          <article class="card stat">
            <div class="label">${esc(row.credential_level)}</div>
            <div class="value">${row.total}</div>
            <div class="hint">programmes</div>
          </article>`).join('')}
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <div>
          <h3>Five schools, one ledger</h3>
          <p>Schools are stored once on the department. Student and course rows keep only a foreign key — never a copied school name.</p>
        </div>
      </div>
      <div class="faculty-grid">
        ${state.departments.map((d) => {
          const count = (state.dashboard?.byDepartment || []).find((x) => x.department_code === d.department_code)?.student_count || 0;
          const programmes = (state.dashboard?.bySchool || []).find((x) => x.faculty === d.faculty)?.programme_count || 0;
          return `
            <article class="faculty-card">
              <div class="code">${esc(d.department_code)}</div>
              <h4>${esc(d.faculty.replace('School of ', ''))}</h4>
              <p>${esc(d.department_name)}<br>${programmes} programmes · ${count} active scholars</p>
            </article>`;
        }).join('')}
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <div>
          <h3>How the archive is kept honest</h3>
          <p>Advanced DBMS objects are not decoration. They enforce the rules the registry lives by.</p>
        </div>
      </div>
      <div class="card-grid">
        ${[
          ['Stored procedures', 'Lookups and writes travel through named routines such as sp_get_student_details and sp_record_payment, so the application never improvises SQL for core business.'],
          ['Triggers', 'Marks outside 0–100 are rejected before they land. Letter grades are assigned in the same breath, so a 91 cannot sit beside a C.'],
          ['Views, indexes, roles', 'Examiners read vw_student_exam_results. Search rides last-name indexes. Lecturers cannot see bursary. The vault can dump and restore the whole schema.']
        ].map(([title, copy]) => `
          <article class="card">
            <div class="kicker" style="color:var(--copper)">${title}</div>
            <p style="margin:12px 0 0;color:var(--muted)">${copy}</p>
          </article>`).join('')}
      </div>
    </section>
    ${footer()}`;
}

function schoolList() {
  return [...new Set(state.departments.map((d) => d.faculty))].sort();
}

function renderAcademics() {
  const schools = schoolList();
  const levels = ['Certificate', 'Diploma', 'Advanced Diploma', 'Bachelor', 'Master', 'Doctorate'];
  const filtered = state.courses.filter((c) => {
    if (state.schoolFilter && c.faculty !== state.schoolFilter) return false;
    if (state.levelFilter && c.credential_level !== state.levelFilter) return false;
    return true;
  });
  const grouped = {};
  for (const c of filtered) {
    const key = c.faculty || 'Unassigned';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  }
  return `
    ${header('academics')}
    <section class="section" style="padding-top:28px">
      <div class="section-head">
        <div>
          <h3>Academic prospectus</h3>
          <p>104 programmes across five schools and six credential levels. Filter the ledger without leaving the page.</p>
        </div>
      </div>
      <div class="toolbar">
        <select id="school-filter">
          <option value="">All schools</option>
          ${schools.map((s) => `<option value="${esc(s)}" ${state.schoolFilter === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
        </select>
        <select id="level-filter">
          <option value="">All credentials</option>
          ${levels.map((lv) => `<option value="${esc(lv)}" ${state.levelFilter === lv ? 'selected' : ''}>${esc(lv)}</option>`).join('')}
        </select>
        <span class="mono" style="color:var(--muted)">${filtered.length} programmes</span>
      </div>
      ${Object.keys(grouped).sort().map((school) => `
        <div style="margin-bottom:28px">
          <div class="section-head">
            <div>
              <h3 style="font-size:26px">${esc(school)}</h3>
              <p>${grouped[school].length} programmes in this school</p>
            </div>
          </div>
          <div class="card-grid">
            ${grouped[school].map((c) => `
              <article class="course-card">
                <div class="person">
                  <div class="avatar">${esc((c.credential_level || 'B')[0])}</div>
                  <div>
                    <strong>${esc(c.course_code)}</strong>
                    <small>${esc(c.credential_level || 'Bachelor')}</small>
                  </div>
                  <span class="credits">${c.credits} cr</span>
                </div>
                <h4 style="margin:0;font-family:var(--serif);font-size:20px">${esc(c.course_name)}</h4>
                <div class="meta">${esc(c.department_name)} · ${esc(c.lecturer_name || 'Tutor to be assigned')}</div>
              </article>`).join('')}
          </div>
        </div>`).join('') || '<div class="empty card">No programmes match those filters.</div>'}
    </section>
    ${footer()}`;
}

function deptOptions() {
  return state.departments.map((d) => ({ value: d.department_id, label: `${d.department_code} — ${d.department_name}` }));
}
function lecturerOptions() {
  return [{ value: '', label: 'Unassigned' }, ...state.lecturers.map((l) => ({
    value: l.lecturer_id, label: `${l.first_name} ${l.last_name} (${l.department_name})`
  }))];
}
function studentOptions() {
  return state.students.map((s) => ({ value: s.student_id, label: `${s.student_number} — ${s.first_name} ${s.last_name}` }));
}
function courseOptions() {
  return state.courses.map((c) => ({ value: c.course_id, label: `${c.course_code} — ${c.course_name}` }));
}
function registrationOptions() {
  return state.registrations.map((r) => ({
    value: r.registration_id,
    label: `${r.student_number} / ${r.course_code} — ${r.first_name} ${r.last_name}`
  }));
}

function maxBar(rows, key) {
  return Math.max(1, ...rows.map((r) => Number(r[key] || 0)));
}

function renderDashboard() {
  const s = state.dashboard?.stats || {};
  const grades = state.dashboard?.gradeDistribution || [];
  const depts = state.dashboard?.byDepartment || [];
  const gMax = maxBar(grades, 'total');
  const dMax = maxBar(depts, 'student_count');
  const clock = state.clock.toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  return `
    <div class="topbar">
      <div>
        <div class="kicker" style="color:var(--copper)">Office of the registrar</div>
        <h2>Good day, registry.</h2>
        <p>${clock} · live counts from stored procedures and views</p>
      </div>
      <button class="btn copper" data-page="students">Register a scholar</button>
    </div>
    <div class="grid stats">
      ${[
        ['Active scholars', s.active_students, `${s.total_students || 0} in the master file`],
        ['Open seats', s.active_registrations, `${s.total_courses || 0} courses in catalogue`],
        ['Scripts marked', s.exam_records, `${s.total_lecturers || 0} lecturers`],
        ['Bursary collected', `${fmtMoney(s.total_fees_paid)}`, `${s.total_departments || 0} departments`]
      ].map(([label, value, hint]) =>
        `<article class="card stat"><div class="label">${label}</div><div class="value">${value ?? '—'}</div><div class="hint">${hint}</div></article>`
      ).join('')}
    </div>
    <div class="split" style="margin-top:16px">
      <section class="card">
        <h3 style="margin:0 0 14px;font-family:var(--serif)">Scholars by department</h3>
        <div class="bars">
          ${depts.map((d) => `
            <div class="bar-row">
              <span>${esc(d.department_code)}</span>
              <div class="bar"><span style="width:${(Number(d.student_count) / dMax) * 100}%"></span></div>
              <strong>${d.student_count}</strong>
            </div>`).join('') || '<div class="empty">No department data</div>'}
        </div>
      </section>
      <section class="card">
        <h3 style="margin:0 0 14px;font-family:var(--serif)">Grade distribution</h3>
        <div class="bars">
          ${grades.map((g) => `
            <div class="bar-row">
              <span class="badge ${esc(g.grade)}">${esc(g.grade)}</span>
              <div class="bar"><span style="width:${(Number(g.total) / gMax) * 100}%"></span></div>
              <strong>${g.total}</strong>
            </div>`).join('') || '<div class="empty">No scripts yet</div>'}
        </div>
      </section>
    </div>
    <div class="split" style="margin-top:16px">
      <section class="card">
        <h3 style="margin:0 0 8px;font-family:var(--serif)">Newest scholars</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Scholar</th><th>Number</th><th>Status</th></tr></thead>
            <tbody>
              ${(state.dashboard?.recentStudents || []).map((r) => `
                <tr>
                  <td>
                    <div class="person">
                      <div class="avatar">${esc(initials(r.first_name, r.last_name))}</div>
                      <div>${esc(r.first_name)} ${esc(r.last_name)}<small>Enrolled ${esc(r.enrollment_date)}</small></div>
                    </div>
                  </td>
                  <td class="mono">${esc(r.student_number)}</td>
                  <td><span class="badge ${esc(r.status)}">${esc(r.status)}</span></td>
                </tr>`).join('') || '<tr><td colspan="3">No data</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
      <section class="card">
        <h3 style="margin:0 0 8px;font-family:var(--serif)">Recent bursary</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Receipt</th><th>Scholar</th><th>Amount</th></tr></thead>
            <tbody>
              ${(state.dashboard?.recentPayments || []).map((r) => `
                <tr>
                  <td class="mono">${esc(r.receipt_number)}</td>
                  <td>${esc(r.first_name)} ${esc(r.last_name)}</td>
                  <td>${fmtMoney(r.amount)}</td>
                </tr>`).join('') || '<tr><td colspan="3">No data</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <section class="card" style="margin-top:16px">
      <h3 style="margin:0 0 12px;font-family:var(--serif)">Most subscribed courses</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Course</th><th>Department</th><th>Lecturer</th><th>Seats</th></tr></thead>
          <tbody>
            ${(state.dashboard?.topCourses || []).map((c) => `
              <tr>
                <td><strong>${esc(c.course_code)}</strong> · ${esc(c.course_name)}</td>
                <td>${esc(c.department_name)}</td>
                <td>${esc(c.lecturer_name || '—')}</td>
                <td>${c.enrolled_count}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderStudents() {
  return `
    <div class="topbar">
      <div>
        <div class="kicker" style="color:var(--copper)">Master file</div>
        <h2>Scholars</h2>
        <p>Search rides <span class="mono">sp_get_student_details</span> and the last-name index.</p>
      </div>
      <button class="btn copper" id="add-student">Admit scholar</button>
    </div>
    <div class="toolbar">
      <div class="search">
        <span>Search</span>
        <input id="student-q" placeholder="Number, family name or email" value="${esc(state.studentQuery)}" />
        <button class="btn sm" id="search-student">Look up</button>
      </div>
    </div>
    <section class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Scholar</th><th>Contact</th><th>School</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${state.students.map((s) => `
              <tr>
                <td>
                  <div class="person">
                    <div class="avatar">${esc(initials(s.first_name, s.last_name))}</div>
                    <div>${esc(s.first_name)} ${esc(s.last_name)}<small class="mono">${esc(s.student_number)}</small></div>
                  </div>
                </td>
                <td>${esc(s.email)}<small style="display:block;color:var(--muted)">${esc(s.phone || '')}</small></td>
                <td>${esc(s.department_name)}<small style="display:block;color:var(--muted)">${esc(s.faculty)}</small></td>
                <td><span class="badge ${esc(s.status)}">${esc(s.status)}</span></td>
                <td><button class="btn ghost sm" data-edit-student="${s.student_id}">Amend</button></td>
              </tr>`).join('') || '<tr><td colspan="5" class="empty">No scholars match that search.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderCourses() {
  return `
    <div class="topbar">
      <div>
        <div class="kicker" style="color:var(--copper)">Catalogue</div>
        <h2>Programme catalogue</h2>
        <p>${state.courses.length} programmes. Department and lecturer are referenced — the 3NF contract in practice.</p>
      </div>
      <button class="btn copper" id="add-course">Add programme</button>
    </div>
    <div class="toolbar">
      <select id="school-filter">
        <option value="">All schools</option>
        ${schoolList().map((s) => `<option value="${esc(s)}" ${state.schoolFilter === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
      </select>
      <select id="level-filter">
        <option value="">All credentials</option>
        ${['Certificate', 'Diploma', 'Advanced Diploma', 'Bachelor', 'Master', 'Doctorate'].map((lv) =>
          `<option value="${esc(lv)}" ${state.levelFilter === lv ? 'selected' : ''}>${esc(lv)}</option>`
        ).join('')}
      </select>
    </div>
    <section class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Code</th><th>Programme</th><th>Level</th><th>School</th><th>Credits</th></tr></thead>
          <tbody>
            ${state.courses.map((c) => `
              <tr>
                <td class="mono">${esc(c.course_code)}</td>
                <td>${esc(c.course_name)}<small style="display:block;color:var(--muted)">${esc(c.lecturer_name || 'Unassigned')}</small></td>
                <td><span class="badge A">${esc(c.credential_level || 'Bachelor')}</span></td>
                <td>${esc(c.faculty || c.department_name)}</td>
                <td>${c.credits}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderRegistrations() {
  return `
    <div class="topbar">
      <div>
        <div class="kicker" style="color:var(--copper)">Seats</div>
        <h2>Enrolment</h2>
        <p>The associative entity that resolves scholars to courses.</p>
      </div>
      <button class="btn copper" id="add-reg">Place a student</button>
    </div>
    <section class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Scholar</th><th>Module</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            ${state.registrations.map((r) => `
              <tr>
                <td>
                  <div class="person">
                    <div class="avatar">${esc(initials(r.first_name, r.last_name))}</div>
                    <div>${esc(r.first_name)} ${esc(r.last_name)}<small class="mono">${esc(r.student_number)}</small></div>
                  </div>
                </td>
                <td><strong>${esc(r.course_code)}</strong> · ${esc(r.course_name)}</td>
                <td>${esc(r.registration_date)}</td>
                <td>
                  <select data-reg-status="${r.registration_id}">
                    ${['Registered', 'Dropped', 'Completed'].map((st) =>
                      `<option ${st === r.status ? 'selected' : ''}>${st}</option>`
                    ).join('')}
                  </select>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderExams() {
  return `
    <div class="topbar">
      <div>
        <div class="kicker" style="color:var(--copper)">Scripts</div>
        <h2>Examinations</h2>
        <p>Read from <span class="mono">vw_student_exam_results</span>. The trigger will refuse 101.</p>
      </div>
      <button class="btn copper" id="add-exam">Enter marks</button>
    </div>
    <section class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Scholar</th><th>Module</th><th>Paper</th><th>Marks</th><th>Grade</th><th>Date</th></tr></thead>
          <tbody>
            ${state.exams.map((e) => `
              <tr>
                <td>${esc(e.student_name)}<small style="display:block" class="mono">${esc(e.student_number)}</small></td>
                <td>${esc(e.course_code)} · ${esc(e.course_name)}</td>
                <td>${esc(e.exam_type)}</td>
                <td>${esc(e.marks)}</td>
                <td><span class="badge ${esc(e.grade)}">${esc(e.grade)}</span></td>
                <td>${esc(e.exam_date)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderFees() {
  const paid = state.fees.filter((f) => f.status === 'Paid').reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const pending = state.fees.filter((f) => f.status === 'Pending').reduce((sum, f) => sum + Number(f.amount || 0), 0);
  return `
    <div class="topbar">
      <div>
        <div class="kicker" style="color:var(--copper)">Bursary</div>
        <h2>Fee ledger</h2>
        <p>Receipt numbers are minted by <span class="mono">sp_record_payment</span>.</p>
      </div>
      <button class="btn copper" id="add-fee">Record receipt</button>
    </div>
    <div class="stats" style="margin-bottom:16px">
      <article class="card stat"><div class="label">Received</div><div class="value">${fmtMoney(paid)}</div><div class="hint">Paid receipts</div></article>
      <article class="card stat"><div class="label">Outstanding</div><div class="value">${fmtMoney(pending)}</div><div class="hint">Pending invoices</div></article>
      <article class="card stat"><div class="label">Receipts</div><div class="value">${state.fees.length}</div><div class="hint">All methods</div></article>
      <article class="card stat"><div class="label">Lecturer access</div><div class="value">Denied</div><div class="hint">Role cannot read fees</div></article>
    </div>
    <section class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Receipt</th><th>Scholar</th><th>Amount</th><th>Channel</th><th>Term</th><th>Status</th></tr></thead>
          <tbody>
            ${state.fees.map((f) => `
              <tr>
                <td class="mono">${esc(f.receipt_number)}</td>
                <td>${esc(f.first_name)} ${esc(f.last_name)}<small style="display:block" class="mono">${esc(f.student_number)}</small></td>
                <td>${fmtMoney(f.amount)}</td>
                <td>${esc(f.payment_method)}</td>
                <td>${esc(f.academic_year)} / Sem ${esc(f.semester)}</td>
                <td><span class="badge ${esc(f.status)}">${esc(f.status)}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderAdmin() {
  const a = state.admin || { tables: [], indexes: [], routines: [], triggers: [], grants: [] };
  return `
    <div class="topbar">
      <div>
        <div class="kicker" style="color:var(--copper)">Vault</div>
        <h2>Database administration</h2>
        <p>Schema objects, least-privilege roles, logical backup and restore.</p>
      </div>
      <button class="btn gold" id="do-backup">Seal a backup</button>
    </div>
    <div class="split">
      <section class="card">
        <h3 style="margin:0 0 10px;font-family:var(--serif)">Tables and views</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Kind</th><th>Engine</th></tr></thead>
            <tbody>${a.tables.map((t) => `<tr><td class="mono">${esc(t.TABLE_NAME)}</td><td>${esc(t.TABLE_TYPE)}</td><td>${esc(t.ENGINE || '—')}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </section>
      <section class="card">
        <h3 style="margin:0 0 10px;font-family:var(--serif)">Routines and triggers</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Object</th><th>Kind</th></tr></thead>
            <tbody>
              ${a.routines.map((r) => `<tr><td class="mono">${esc(r.ROUTINE_NAME)}</td><td>${esc(r.ROUTINE_TYPE)}</td></tr>`).join('')}
              ${a.triggers.map((t) => `<tr><td class="mono">${esc(t.TRIGGER_NAME)}</td><td>${esc(t.ACTION_TIMING)} ${esc(t.EVENT_MANIPULATION)} on ${esc(t.EVENT_OBJECT_TABLE)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <section class="card" style="margin-top:16px">
      <h3 style="margin:0 0 10px;font-family:var(--serif)">Indexes</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Table</th><th>Index</th><th>Columns</th><th>Unique</th></tr></thead>
          <tbody>${a.indexes.map((i) =>
            `<tr><td>${esc(i.TABLE_NAME)}</td><td class="mono">${esc(i.INDEX_NAME)}</td><td>${esc(i.columns)}</td><td>${i.NON_UNIQUE === 0 ? 'Yes' : 'No'}</td></tr>`
          ).join('')}</tbody>
        </table>
      </div>
    </section>
    <section class="card" style="margin-top:16px">
      <h3 style="margin:0 0 10px;font-family:var(--serif)">Security roles</h3>
      ${(a.grants || []).map((g) => `<p><strong>${esc(g.user)}</strong></p><pre class="mono">${esc((g.grants || []).join('\n'))}</pre>`).join('')}
    </section>
    <section class="card" style="margin-top:16px">
      <h3 style="margin:0 0 10px;font-family:var(--serif)">Backups</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>File</th><th>Size</th><th>Modified</th><th></th></tr></thead>
          <tbody>
            ${state.backups.map((b) => `
              <tr>
                <td class="mono">${esc(b.name)}</td>
                <td>${(b.bytes / 1024).toFixed(1)} KB</td>
                <td>${esc(b.modified.replace('T', ' ').slice(0, 19))}</td>
                <td><button class="btn ghost sm" data-restore="${esc(b.name)}">Restore</button></td>
              </tr>`).join('') || '<tr><td colspan="4" class="empty">No backups yet. Seal one to demonstrate recovery.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>`;
}

function workspacePage() {
  if (state.page === 'dashboard') return renderDashboard();
  if (state.page === 'students') return renderStudents();
  if (state.page === 'courses') return renderCourses();
  if (state.page === 'registrations') return renderRegistrations();
  if (state.page === 'exams') return renderExams();
  if (state.page === 'fees') return renderFees();
  return renderAdmin();
}

function renderRegistry() {
  return `
    ${header('registry')}
    <div class="workspace">
      <aside class="rail">
        <div class="rail-label">Registry desk</div>
        ${PAGES.map(([id, label, hint]) => `
          <button data-page="${id}" class="${state.page === id ? 'active' : ''}">
            <span>${label}</span><small style="opacity:.7">${hint}</small>
          </button>`).join('')}
        <p class="rail-note">Administrator role holds the vault. Lecturer role may mark scripts but never open bursary.</p>
      </aside>
      <main class="main">${workspacePage()}</main>
    </div>`;
}

function modalHtml() {
  const m = state.modal;
  return `
    <div class="modal-bg" data-close="1">
      <form class="modal" id="modal-form">
        <h3>${esc(m.title)}</h3>
        ${m.note ? `<p style="margin:-6px 0 14px;color:var(--muted)">${esc(m.note)}</p>` : ''}
        <div class="form-grid">
          ${m.fields.map((f) =>
            `<label class="${f.full ? 'full' : ''}">${esc(f.label)}${fieldControl(f, m.values)}</label>`
          ).join('')}
        </div>
        <div class="toolbar" style="margin-top:18px">
          <button class="btn copper" type="submit">Save to ledger</button>
          <button class="btn ghost" type="button" id="cancel-modal">Dismiss</button>
        </div>
      </form>
    </div>`;
}

function renderLogin() {
  return `
    <main class="section" style="max-width:520px;margin:10vh auto">
      <section class="card" style="padding:32px">
        <div class="kicker" style="color:var(--copper)">Secure staff access</div>
        <h2 style="font-family:var(--serif);margin:10px 0">Crestwood Registry</h2>
        <p style="color:var(--muted)">Sign in with your authorised administrator credentials to access student, examination, fee and database records.</p>
        <form id="login-form">
          <label style="display:block;margin:18px 0 12px">Username<input name="username" autocomplete="username" required /></label>
          <label style="display:block;margin:12px 0 18px">Password<input name="password" type="password" autocomplete="current-password" required /></label>
          <button class="btn copper" type="submit">Sign in securely</button>
        </form>
        <p style="color:var(--muted);font-size:12px;margin-top:18px">Sessions expire automatically after eight hours. Do not share your login credentials.</p>
      </section>
    </main>`;
}

function render() {
  if (!state.authenticated) {
    app.innerHTML = `${renderLogin()}
      <div class="toast-stack">${state.error ? `<div class="toast error">${esc(state.error)}</div>` : ''}</div>`;
    bind();
    return;
  }
  let body = '';
  if (state.view === 'home') body = renderHome();
  else if (state.view === 'academics') body = renderAcademics();
  else body = renderRegistry();

  app.innerHTML = `
    ${body}
    ${state.modal ? modalHtml() : ''}
    <div class="toast-stack">
      ${state.error ? `<div class="toast error">${esc(state.error)}</div>` : ''}
      ${state.message ? `<div class="toast">${esc(state.message)}</div>` : ''}
    </div>`;
  bind();
}

function studentFields(s = {}) {
  return [
    { name: 'student_number', label: 'Student number (CU#######)', value: s.student_number, required: true },
    { name: 'first_name', label: 'Given name', value: s.first_name, required: true },
    { name: 'last_name', label: 'Family name', value: s.last_name, required: true },
    { name: 'email', label: 'University email', type: 'email', value: s.email, required: true },
    { name: 'phone', label: 'Telephone', value: s.phone },
    { name: 'date_of_birth', label: 'Date of birth', type: 'date', value: s.date_of_birth, required: true },
    { name: 'gender', label: 'Gender', type: 'select', value: s.gender || 'Male', options: [
      { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }
    ]},
    { name: 'department_id', label: 'Home department', type: 'select', value: s.department_id, options: deptOptions() },
    { name: 'enrollment_date', label: 'Matriculation date', type: 'date', value: s.enrollment_date || new Date().toISOString().slice(0, 10), required: true },
    { name: 'address', label: 'Address', type: 'textarea', value: s.address, full: true }
  ];
}

function bind() {
  const loginForm = app.querySelector('#login-form');
  if (loginForm) {
    loginForm.onsubmit = async (ev) => {
      ev.preventDefault();
      const values = Object.fromEntries(new FormData(loginForm).entries());
      try {
        const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(values) });
        state.authenticated = true;
        state.user = result.user;
        state.error = '';
        await loadCore();
        state.dashboard = await api('/api/dashboard');
        state.courses = (await api('/api/courses')).data;
        render();
      } catch (err) {
        state.error = err.message;
        render();
      }
    };
  }
  const logout = app.querySelector('#logout');
  if (logout) logout.onclick = async () => {
    try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } catch {}
    state.authenticated = false;
    state.user = null;
    state.dashboard = null;
    state.students = [];
    state.fees = [];
    state.admin = null;
    state.error = '';
    state.view = 'home';
    render();
  };

  app.querySelectorAll('[data-view]').forEach((btn) => {
    btn.onclick = async () => {
      state.view = btn.dataset.view;
      state.message = '';
      if (state.view === 'registry' && !state.dashboard) await loadPage();
      if (state.view === 'academics' && state.courses.length < 20) {
        try { state.courses = (await api('/api/courses')).data; } catch (err) { state.error = err.message; }
      }
      render();
    };
  });

  const schoolFilter = app.querySelector('#school-filter');
  const levelFilter = app.querySelector('#level-filter');
  if (schoolFilter) {
    schoolFilter.onchange = async () => {
      state.schoolFilter = schoolFilter.value;
      if (state.view === 'registry') await loadPage();
      else render();
    };
  }
  if (levelFilter) {
    levelFilter.onchange = async () => {
      state.levelFilter = levelFilter.value;
      if (state.view === 'registry') await loadPage();
      else render();
    };
  }

  app.querySelectorAll('[data-page]').forEach((btn) => {
    btn.onclick = async () => {
      state.view = 'registry';
      state.page = btn.dataset.page;
      state.message = '';
      await loadPage();
    };
  });

  const q = app.querySelector('#student-q');
  const search = app.querySelector('#search-student');
  if (search) {
    const run = async () => {
      state.studentQuery = q.value;
      await loadPage();
    };
    search.onclick = run;
    q.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') run(); });
  }

  const addStudent = app.querySelector('#add-student');
  if (addStudent) {
    addStudent.onclick = () => openModal('Admit a scholar', studentFields(), async (body) => {
      await api('/api/students', { method: 'POST', body: JSON.stringify(body) });
      flash('Scholar admitted to the master file.');
      await loadPage();
    }, 'Student numbers must match CU followed by seven digits.');
  }

  app.querySelectorAll('[data-edit-student]').forEach((btn) => {
    btn.onclick = () => {
      const s = state.students.find((x) => String(x.student_id) === btn.dataset.editStudent);
      const fields = studentFields(s).filter((f) => f.name !== 'student_number' && f.name !== 'enrollment_date');
      fields.push({
        name: 'status', label: 'Standing', type: 'select', value: s.status,
        options: ['Active', 'Inactive', 'Graduated', 'Suspended'].map((v) => ({ value: v, label: v }))
      });
      openModal('Amend scholar record', fields, async (body) => {
        await api(`/api/students/${s.student_id}`, { method: 'PUT', body: JSON.stringify(body) });
        flash('Scholar record updated.');
        await loadPage();
      });
    };
  });

  const addCourse = app.querySelector('#add-course');
  if (addCourse) {
    addCourse.onclick = () => openModal('Add a programme', [
      { name: 'course_code', label: 'Programme code', required: true },
      { name: 'course_name', label: 'Title', required: true },
      { name: 'credits', label: 'Credits (1–6)', type: 'number', value: 3, min: 1, max: 6, required: true },
      { name: 'credential_level', label: 'Credential', type: 'select', options: ['Certificate', 'Diploma', 'Advanced Diploma', 'Bachelor', 'Master', 'Doctorate'].map((v) => ({ value: v, label: v })) },
      { name: 'department_id', label: 'School / department', type: 'select', options: deptOptions() },
      { name: 'lecturer_id', label: 'Lecturer', type: 'select', options: lecturerOptions() },
      { name: 'semester', label: 'Semester', type: 'select', options: [{ value: '1', label: 'Semester 1' }, { value: '2', label: 'Semester 2' }] },
      { name: 'academic_year', label: 'Academic year', value: '2025/2026', required: true }
    ], async (body) => {
      await api('/api/courses', { method: 'POST', body: JSON.stringify(body) });
      flash('Programme added to the catalogue.');
      await loadPage();
    });
  }

  const addReg = app.querySelector('#add-reg');
  if (addReg) {
    addReg.onclick = () => openModal('Place a student on a module', [
      { name: 'student_id', label: 'Scholar', type: 'select', options: studentOptions(), full: true },
      { name: 'course_id', label: 'Module', type: 'select', options: courseOptions(), full: true }
    ], async (body) => {
      await api('/api/registrations', { method: 'POST', body: JSON.stringify(body) });
      flash('Enrolment sealed.');
      await loadPage();
    }, 'Only active scholars may be placed.');
  }

  app.querySelectorAll('[data-reg-status]').forEach((sel) => {
    sel.onchange = async () => {
      try {
        await api(`/api/registrations/${sel.dataset.regStatus}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: sel.value })
        });
        flash('Enrolment status updated.');
        await loadPage();
      } catch (err) {
        flash(err.message, true);
      }
    };
  });

  const addExam = app.querySelector('#add-exam');
  if (addExam) {
    addExam.onclick = () => openModal('Enter examination marks', [
      { name: 'registration_id', label: 'Scholar / module', type: 'select', options: registrationOptions(), full: true },
      { name: 'exam_type', label: 'Paper', type: 'select', options: ['CA', 'Midterm', 'Final'].map((v) => ({ value: v, label: v })) },
      { name: 'marks', label: 'Marks (0–100)', type: 'number', min: 0, max: 100, required: true },
      { name: 'exam_date', label: 'Date of paper', type: 'date', value: new Date().toISOString().slice(0, 10), required: true },
      { name: 'remarks', label: 'Examiner remarks', type: 'textarea', full: true }
    ], async (body) => {
      await api('/api/examinations', { method: 'POST', body: JSON.stringify(body) });
      flash('Marks recorded. Letter grade assigned by trigger.');
      await loadPage();
    }, 'Values outside 0–100 are rejected by trg_exam_marks_before_insert.');
  }

  const addFee = app.querySelector('#add-fee');
  if (addFee) {
    addFee.onclick = () => openModal('Record a bursary receipt', [
      { name: 'student_id', label: 'Scholar', type: 'select', options: studentOptions(), full: true },
      { name: 'amount', label: 'Amount (UGX)', type: 'number', min: 1, required: true },
      { name: 'payment_date', label: 'Date received', type: 'date', value: new Date().toISOString().slice(0, 10), required: true },
      { name: 'payment_method', label: 'Channel', type: 'select', options: ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque'].map((v) => ({ value: v, label: v })) },
      { name: 'academic_year', label: 'Academic year', value: '2025/2026', required: true },
      { name: 'semester', label: 'Semester', type: 'select', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { name: 'status', label: 'Status', type: 'select', options: ['Paid', 'Pending', 'Refunded'].map((v) => ({ value: v, label: v })) }
    ], async (body) => {
      await api('/api/fees', { method: 'POST', body: JSON.stringify(body) });
      flash('Receipt written to the bursary ledger.');
      await loadPage();
    });
  }

  const backupBtn = app.querySelector('#do-backup');
  if (backupBtn) {
    backupBtn.onclick = async () => {
      try {
        const r = await api('/api/admin/backup', { method: 'POST', body: '{}' });
        flash(`Backup sealed: ${r.file}`);
        await loadPage();
      } catch (err) {
        flash(err.message, true);
      }
    };
  }

  app.querySelectorAll('[data-restore]').forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api('/api/admin/restore', { method: 'POST', body: JSON.stringify({ file: btn.dataset.restore }) });
        flash(`Restored ${btn.dataset.restore}`);
        await loadPage();
      } catch (err) {
        flash(err.message, true);
      }
    };
  });

  const modalForm = app.querySelector('#modal-form');
  if (modalForm) {
    modalForm.onsubmit = async (ev) => {
      ev.preventDefault();
      const body = Object.fromEntries(new FormData(modalForm).entries());
      try {
        await state._onSubmit(body);
        closeModal();
      } catch (err) {
        flash(err.message, true);
      }
    };
    app.querySelector('#cancel-modal').onclick = closeModal;
    app.querySelector('.modal-bg').addEventListener('click', (e) => {
      if (e.target.dataset.close) closeModal();
    });
  }
}

async function boot() {
  try {
    const session = await api('/api/auth/session');
    state.authenticated = true;
    state.user = session.user;
    await loadCore();
    state.dashboard = await api('/api/dashboard');
    state.courses = (await api('/api/courses')).data;
  } catch {
    state.authenticated = false;
    state.user = null;
  }
  render();
}

boot();
