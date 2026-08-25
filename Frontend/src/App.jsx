import { Component, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  DollarSign,
  FileCheck2,
  FileText,
  Code2,
  HeartHandshake,
  LayoutDashboard,
  BadgeCheck,
  ListChecks,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Pencil,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  UserRound,
  X,
  XCircle,
  Zap,
  Trash2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_BASE });

const developer = {
  name: 'LIKITH T N',
  role: 'Full Stack Developer',
  email: 'likithram0803@gmail.com',
  linkedin: 'https://www.linkedin.com/in/likith-t-n',
  github: 'https://github.com/Likiith08',
  image: '/Developer.jpeg',
};

const roleNav = {
  ADMIN: [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['employees', 'Employees', Users],
    ['departments', 'Departments', BriefcaseBusiness],
    ['attendance', 'Attendance', Clock3],
    ['leaves', 'Leave Management', CalendarDays],
    ['payroll', 'Payroll', DollarSign],
    ['users', 'User Management', ShieldCheck],
    ['audit', 'Audit Logs', FileCheck2],
    ['ai', 'AI Assistant', Sparkles],
    ['developer', 'Developer', UserRound],
  ],
  HR: [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['employees', 'Employees', Users],
    ['departments', 'Departments', BriefcaseBusiness],
    ['attendance', 'Attendance', Clock3],
    ['leaves', 'Leave Management', CalendarDays],
    ['payroll', 'Payroll', DollarSign],
    ['ai', 'AI Assistant', Sparkles],
    ['developer', 'Developer', UserRound],
  ],
  MANAGER: [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['employees', 'Team', Users],
    ['attendance', 'Attendance', Clock3],
    ['leaves', 'Leave Approvals', CalendarDays],
    ['payroll', 'Payroll', DollarSign],
    ['ai', 'AI Assistant', Sparkles],
    ['developer', 'Developer', UserRound],
  ],
  EMPLOYEE: [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['attendance', 'My Attendance', Clock3],
    ['leaves', 'My Leave', CalendarDays],
    ['payroll', 'My Payslips', DollarSign],
    ['ai', 'AI Assistant', Sparkles],
    ['developer', 'Developer', UserRound],
  ],
};

function getStoredAuth() {
  try {
    return JSON.parse(sessionStorage.getItem('hrms_auth') || 'null');
  } catch {
    return null;
  }
}
function saveAuth(auth) {
  sessionStorage.setItem('hrms_auth', JSON.stringify(auth));
}
function clearAuth() {
  sessionStorage.removeItem('hrms_auth');
}
function authHeaders() {
  const auth = getStoredAuth();
  return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
}
function displayName(profile, auth) {
  return profile?.employee
    ? `${profile.employee.first_name} ${profile.employee.last_name}`
    : auth?.user?.username || 'User';
}
function money(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}
function dateLabel(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

api.interceptors.request.use((config) => {
  config.headers = { ...config.headers, ...authHeaders() };
  return config;
});
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}

// Prevents a single page-level error (bad API shape, unexpected null, etc.)
// from blanking the entire application. Renders an "Unable to load" state
// with a retry instead of a blank white screen.

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Page render error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="page-error-state">
          <XCircle size={28} />
          <h2>Unable to load this page</h2>
          <p>
            Something went wrong while rendering this section. This has been logged; you can try
            again.
          </p>
          <button className="primary-btn" onClick={() => this.setState({ error: null })}>
            <ArrowUpRight size={16} style={{ transform: 'rotate(45deg)' }} /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (!data.success) throw new Error(data.message);
      saveAuth(data.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-shell">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <div className="login-brand">
        <img className="brand-logo-mark" src="/hrms-logo-mark.png" alt="Smart HRMS" />
        <span>Smart Human Resource Management System</span>
      </div>
      <div className="login-card glass">
        <div className="eyebrow">
          <Sparkles size={16} /> Intelligent HR workspace
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to continue to your Smart HRMS workspace.</p>
        <form onSubmit={submit} className="form-stack">
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </label>
          {error && (
            <div className="alert danger">
              <XCircle size={17} />
              {error}
            </div>
          )}
          <button className="primary-btn full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
            <ChevronRight size={18} />
          </button>
        </form>
        <div className="login-foot">
          <ShieldCheck size={15} /> Secure role-based access
        </div>
      </div>
    </div>
  );
}

function ProtectedApp() {
  const auth = getStoredAuth();
  if (!auth?.accessToken || !auth?.user) return <Navigate to="/login" replace />;
  return <Shell />;
}

function Shell() {
  const auth = getStoredAuth();
  const role = auth.user.role || 'EMPLOYEE';
  const [profile, setProfile] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem('hrms_theme') === 'dark');
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    api
      .get('/users/me')
      .then((r) => setProfile(r.data.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('hrms_theme', dark ? 'dark' : 'light');
  }, [dark]);
  const links = roleNav[role] || roleNav.EMPLOYEE;
  const logout = () => {
    clearAuth();
    navigate('/login');
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <img className="brand-logo-mark" src="/hrms-logo-mark.png" alt="Smart HRMS" />
          <div>
            <strong>Smart HRMS</strong>
            <small>People • Payroll • Intelligence</small>
          </div>
        </div>
        <div className="role-pill">
          <span className="status-dot" />
          {role}
        </div>
        <nav>
          {links.map(([key, label, Icon]) => (
            <NavLink
              key={key}
              to={`/${key}`}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <CircleUserRound size={18} />
            Profile
          </NavLink>
          <button className="ghost-nav" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />} {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="ghost-nav logout" onClick={logout}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
      {mobileOpen && <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="breadcrumbs">
            <span>Smart HRMS</span>
            <ChevronRight size={14} />
            <b>{location.pathname.slice(1) || 'dashboard'}</b>
          </div>
          <div className="top-actions">
            <button className="icon-btn">
              <Bell size={19} />
              <i />
            </button>
            <button className="profile-chip" onClick={() => navigate('/profile')}>
              <span className="avatar">
                {displayName(profile, auth)
                  .split(' ')
                  .map((x) => x[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span>
                <b>{displayName(profile, auth)}</b>
                <small>{role}</small>
              </span>
            </button>
          </div>
        </header>
        <div className="page-content">
          <PageErrorBoundary key={location.pathname}>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  role === 'EMPLOYEE' ? (
                    <Dashboard auth={auth} profile={profile} />
                  ) : (
                    <ManagementDashboard role={role} profile={profile} />
                  )
                }
              />
              <Route
                path="/profile"
                element={<Profile profile={profile} setProfile={setProfile} />}
              />
              <Route path="/attendance" element={<Attendance role={role} />} />
              <Route path="/leaves" element={<Leaves role={role} />} />
              <Route path="/payroll" element={<Payroll role={role} />} />
              <Route path="/employees" element={<Employees role={role} />} />
              <Route path="/departments" element={<Departments role={role} />} />
              <Route
                path="/users"
                element={role === 'ADMIN' ? <UsersPage /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/audit"
                element={role === 'ADMIN' ? <Audit /> : <Navigate to="/dashboard" replace />}
              />
              <Route path="/ai" element={<AIAssistant role={role} />} />
              <Route path="/developer" element={<Developer />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </PageErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
function StatCard({ icon: Icon, label, value, meta, tone = 'blue' }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
    </div>
  );
}
function Section({ title, action, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

const roleBlueprints = {
  ADMIN: {
    eyebrow: 'ADMIN COMMAND CENTER',
    title: 'Executive HR dashboard',
    description: 'A complete operational view of people, access, attendance, leave and payroll.',
    thought: 'Strong systems make good people operations feel effortless.',
    focus: "Today's focus: keep the organization healthy, secure and moving.",
    workflow: [
      'People & structure',
      'Attendance & leave',
      'Payroll & controls',
      'Security & audit',
    ],
    responsibilities: [
      'Workforce oversight',
      'Department control',
      'Payroll governance',
      'User & access control',
      'Audit & compliance',
    ],
  },
  HR: {
    eyebrow: 'HR OPERATIONS CENTER',
    title: 'People operations dashboard',
    description: 'Keep employee records, attendance, leave and payroll workflows in sync.',
    thought: 'Every well-supported employee is one step closer to a stronger team.',
    focus: "Today's focus: resolve people operations items before they become blockers.",
    workflow: ['Employee records', 'Attendance & leave', 'Payroll support', 'People insights'],
    responsibilities: [
      'Employee administration',
      'Department coordination',
      'Leave operations',
      'Payroll operations',
      'HR insights',
    ],
  },
  MANAGER: {
    eyebrow: 'MANAGER COMMAND CENTER',
    title: 'Team dashboard',
    description: 'See the people, attendance and leave decisions that need your attention.',
    thought: 'Great teams grow when clarity, trust and accountability work together.',
    focus: "Today's focus: support your team and clear pending leave decisions.",
    workflow: ['Your team', 'Attendance', 'Leave approvals', 'Payroll visibility'],
    responsibilities: [
      'Team oversight',
      'Attendance review',
      'Leave approvals',
      'Team support',
      'Performance awareness',
    ],
  },
  EMPLOYEE: {
    eyebrow: 'PERSONAL WORKSPACE',
    title: 'Your HR workspace',
    description: 'Everything you need for your day, attendance, leave and salary in one place.',
    thought: 'Great things are built one step at a time.',
    focus: "Today's focus: stay on top of your attendance and important HR tasks.",
    workflow: ['Start your day', 'Track attendance', 'Request leave', 'Review payslip'],
    responsibilities: [
      'Daily attendance',
      'Leave requests',
      'Payslip review',
      'Profile updates',
      'HR assistance',
    ],
  },
};

function getThought(role) {
  const thoughts = {
    ADMIN: [
      'Strong systems make good people operations feel effortless.',
      'Clarity creates confident decisions.',
      'Good governance gives teams room to do their best work.',
    ],
    HR: [
      'Every well-supported employee is one step closer to a stronger team.',
      'People first, process second, progress always.',
      'A clear HR process creates a better employee experience.',
    ],
    MANAGER: [
      'Great teams grow when clarity, trust and accountability work together.',
      'Good managers create clarity, remove blockers and celebrate progress.',
      'The best team decisions start with listening.',
    ],
    EMPLOYEE: [
      'Great things are built one step at a time.',
      'Small consistent actions create meaningful progress.',
      'Your work matters — make today count.',
    ],
  };
  const list = thoughts[role] || thoughts.EMPLOYEE;
  return list[new Date().getDate() % list.length];
}

function RoleWorkflow({ role }) {
  const blueprint = roleBlueprints[role] || roleBlueprints.EMPLOYEE;
  return (
    <Section title="Your HRMS workflow" className="workflow-panel">
      <div className="workflow-diagram" aria-label={`${role} HRMS workflow`}>
        {blueprint.workflow.map((step, index) => (
          <div className="workflow-node" key={step}>
            <div className="workflow-index">{String(index + 1).padStart(2, '0')}</div>
            <b>{step}</b>
            {index < blueprint.workflow.length - 1 && (
              <ChevronRight className="workflow-arrow" size={18} />
            )}
          </div>
        ))}
      </div>
      <div className="role-focus-row">
        <div className="role-focus-card">
          <Sparkles size={18} />
          <div>
            <b>Today</b>
            <span>{blueprint.focus}</span>
          </div>
        </div>
        <div className="role-focus-card">
          <ShieldCheck size={18} />
          <div>
            <b>Your responsibilities</b>
            <span>{blueprint.responsibilities.join(' • ')}</span>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Dashboard({ auth, profile }) {
  const role = auth.user.role;
  const [today, setToday] = useState(null),
    [balances, setBalances] = useState([]),
    [payroll, setPayroll] = useState(null),
    [leaves, setLeaves] = useState([]),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState('');
  const load = () =>
    Promise.allSettled([
      api.get('/attendance/today'),
      api.get('/leaves/balances'),
      api.get('/payroll/my'),
      api.get('/leaves'),
    ]).then(([a, b, p, l]) => {
      if (a.status === 'fulfilled') setToday(a.value.data.data);
      if (b.status === 'fulfilled') setBalances(b.value.data.data || []);
      if (p.status === 'fulfilled') setPayroll(p.value.data.data?.[0] || null);
      if (l.status === 'fulfilled') setLeaves(l.value.data.data || []);
    });
  useEffect(() => {
    load();
  }, [role]);
  const punch = async (path) => {
    setBusy(true);
    try {
      const r = await api.post(`/attendance/${path}`);
      setToast(r.data.message);
      await load();
    } catch (e) {
      setToast(e.response?.data?.message || 'Attendance action failed');
    } finally {
      setBusy(false);
      setTimeout(() => setToast(''), 3000);
    }
  };
  const remaining = balances.reduce((s, b) => s + Number(b.remaining_days || 0), 0);
  const pending = leaves.filter((l) => l.status === 'PENDING').length;
  const name = displayName(profile, auth);
  const blueprint = roleBlueprints.EMPLOYEE;
  return (
    <div className="dashboard">
      <PageHeader
        eyebrow={blueprint.eyebrow}
        title={`Good morning, ${name.split(' ')[0]}!`}
        description={blueprint.description}
        action={
          <div className="live-pill">
            <span className="pulse" /> System online
          </div>
        }
      />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      <div className="dashboard-hero">
        <div>
          <span className="hero-kicker">{blueprint.title}</span>
          <h2>{blueprint.focus}</h2>
          <p>Welcome back, {name}. Your most important HR actions are organized below.</p>
        </div>
        <div className="hero-avatar">
          {name
            .split(' ')
            .map((x) => x[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
      </div>
      <div className="thought">
        <Sparkles size={19} />
        <div>
          <b>Thought of the day</b>
          <span>“{getThought(role)}”</span>
        </div>
      </div>
      <div className="quick-actions">
        <button
          className="quick primary"
          onClick={() => punch('punch-in')}
          disabled={busy || !!today?.punch_in}
        >
          <span>
            <Zap size={19} />
          </span>
          <b>Punch In</b>
          <small>{today?.punch_in ? 'Already recorded' : 'Start your day'}</small>
        </button>
        <button
          className="quick danger"
          onClick={() => punch('punch-out')}
          disabled={busy || !today?.punch_in || !!today?.punch_out}
        >
          <span>
            <Clock3 size={19} />
          </span>
          <b>Punch Out</b>
          <small>{today?.punch_out ? 'Completed' : 'Finish your day'}</small>
        </button>
        <NavLink className="quick" to="/leaves">
          <span>
            <CalendarDays size={19} />
          </span>
          <b>Apply Leave</b>
          <small>Request time off</small>
        </NavLink>
        <NavLink className="quick" to="/attendance">
          <span>
            <ListChecks size={19} />
          </span>
          <b>Attendance</b>
          <small>View records</small>
        </NavLink>
        <NavLink className="quick" to="/payroll">
          <span>
            <DollarSign size={19} />
          </span>
          <b>Payslip</b>
          <small>Latest salary</small>
        </NavLink>
        <NavLink className="quick ai" to="/ai">
          <span>
            <Sparkles size={19} />
          </span>
          <b>AI Assistant</b>
          <small>Ask HRMS anything</small>
        </NavLink>
      </div>
      <div className="stats-grid">
        <StatCard
          icon={Activity}
          label="Attendance"
          value={today?.status || '—'}
          meta={today?.working_hours ? `${today.working_hours} hours today` : 'Today'}
          tone="green"
        />
        <StatCard
          icon={Clock3}
          label="Work Hours"
          value={today?.working_hours ? `${today.working_hours}h` : '—'}
          meta="Today"
          tone="purple"
        />
        <StatCard
          icon={HeartHandshake}
          label="Leave Balance"
          value={`${remaining.toFixed(0)} days`}
          meta={`${pending} pending request${pending === 1 ? '' : 's'}`}
          tone="orange"
        />
        <StatCard
          icon={DollarSign}
          label="Net Salary"
          value={payroll ? money(payroll.net_salary) : '—'}
          meta={payroll?.status || 'No payroll'}
          tone="blue"
        />
      </div>
      <RoleWorkflow role={role} />
      <div className="dashboard-grid">
        <Section
          title="Attendance snapshot"
          action={
            <NavLink className="text-link" to="/attendance">
              View details <ChevronRight size={15} />
            </NavLink>
          }
        >
          <div className="snapshot">
            <div className="snapshot-score">
              <strong>Today</strong>
              <span className="score-ring">{today?.status === 'PRESENT' ? '✓' : '—'}</span>
              <small>{today?.status || 'Not started'}</small>
            </div>
            <div className="snapshot-list">
              <span>
                <i className="dot green" />
                Punch in{' '}
                <b>
                  {today?.punch_in
                    ? new Date(today.punch_in).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </b>
              </span>
              <span>
                <i className="dot blue" />
                Punch out{' '}
                <b>
                  {today?.punch_out
                    ? new Date(today.punch_out).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </b>
              </span>
              <span>
                <i className="dot purple" />
                Working hours <b>{today?.working_hours || '—'}</b>
              </span>
            </div>
          </div>
        </Section>
        <Section
          title="Leave overview"
          action={
            <NavLink className="text-link" to="/leaves">
              Manage <ChevronRight size={15} />
            </NavLink>
          }
        >
          <div className="mini-bars">
            {balances.slice(0, 4).map((b) => (
              <div key={b.leave_balance_id || `${b.leave_type_id}-${b.year}`}>
                <span>{b.leaveType?.leave_name || 'Leave'}</span>
                <div>
                  <i
                    style={{
                      width: `${Math.min(100, (Number(b.used_days || 0) / Math.max(1, Number(b.total_days || 1))) * 100)}%`,
                    }}
                  />
                </div>
                <b>{Number(b.remaining_days || 0).toFixed(0)} left</b>
              </div>
            ))}
            {!balances.length && <Empty text="No leave balance data yet." />}
          </div>
        </Section>
      </div>
      <Section title="Quick HRMS tutorials" className="tutorials">
        <div className="tutorial-grid">
          <Tutorial icon={Clock3} title="Attendance" time="2 min" />
          <Tutorial icon={CalendarDays} title="Leave workflow" time="3 min" />
          <Tutorial icon={DollarSign} title="Payslips" time="2 min" />
          <Tutorial icon={Sparkles} title="AI Assistant" time="2 min" />
        </div>
      </Section>
    </div>
  );
}
function Tutorial({ icon: Icon, title, time }) {
  return (
    <div className="tutorial">
      <span>
        <Icon size={20} />
      </span>
      <div>
        <b>{title}</b>
        <small>{time} tutorial</small>
      </div>
      <button>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function ManagementDashboard({ role, profile }) {
  const [employees, setEmployees] = useState([]),
    [leaves, setLeaves] = useState([]),
    [payroll, setPayroll] = useState([]),
    [attendance, setAttendance] = useState([]),
    [departments, setDepartments] = useState([]),
    [users, setUsers] = useState([]),
    [loadError, setLoadError] = useState(false);
  const name = displayName(profile, getStoredAuth());

  const load = () => {
    const requests = [
      api.get('/employees?limit=100'),
      api.get('/leaves'),
      api.get('/payroll'),
      api.get('/attendance'),
    ];
    if (role === 'ADMIN') requests.push(api.get('/departments'), api.get('/users'));
    return Promise.allSettled(requests).then((results) => {
      let index = 0;
      let failed = false;
      const apply = (setter) => {
        const r = results[index++];
        if (r?.status === 'fulfilled')
          setter(Array.isArray(r.value.data?.data) ? r.value.data.data : []);
        else failed = true;
      };
      apply(setEmployees);
      apply(setLeaves);
      apply(setPayroll);
      apply(setAttendance);
      if (role === 'ADMIN') {
        apply(setDepartments);
        apply(setUsers);
      }
      setLoadError(failed);
    });
  };
  useEffect(() => {
    load();
  }, [role]);

  const pending = leaves.filter((x) => x.status === 'PENDING').length;
  const present = attendance.filter((x) => x.status === 'PRESENT').length;
  const paid = payroll.filter((x) => x.status === 'PAID').length;
  const blueprint = roleBlueprints[role] || roleBlueprints.HR;
  const firstName = name.split(' ')[0];
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = weekdayLabels
    .map((day, idx) => ({
      name: day,
      value: attendance.filter(
        (a) => a.status === 'PRESENT' && new Date(a.attendance_date).getDay() === idx,
      ).length,
    }))
    .filter((_, idx) => idx >= 1 && idx <= 6);

  const quickByRole = {
    ADMIN: [
      ['/employees', 'Employees', Users, 'Manage workforce'],
      ['/users', 'User accounts', ShieldCheck, 'Roles & access'],
      ['/departments', 'Departments', BriefcaseBusiness, 'Organization structure'],
      ['/payroll', 'Payroll', DollarSign, 'Salary controls'],
      ['/audit', 'Audit logs', FileCheck2, 'Security trail'],
      ['/ai', 'AI Assistant', Sparkles, 'Ask HRMS'],
    ],
    HR: [
      ['/employees', 'Employees', Users, 'People records'],
      ['/departments', 'Departments', BriefcaseBusiness, 'Organization'],
      ['/leaves', 'Leave queue', CalendarDays, `${pending} pending`],
      ['/payroll', 'Payroll', DollarSign, `${payroll.length} records`],
      ['/attendance', 'Attendance', Clock3, 'Workforce time'],
      ['/ai', 'AI Assistant', Sparkles, 'HR support'],
    ],
    MANAGER: [
      ['/employees', 'My team', Users, `${employees.length} direct reports`],
      ['/attendance', 'Team attendance', Clock3, `${present} present`],
      ['/leaves', 'Approve leave', CalendarDays, `${pending} pending`],
      ['/payroll', 'Team payroll', DollarSign, `${payroll.length} records`],
      ['/ai', 'AI Assistant', Sparkles, 'Manager support'],
      ['/profile', 'My profile', CircleUserRound, 'Account details'],
    ],
  };
  const quick = quickByRole[role] || quickByRole.HR;

  return (
    <div className="management-dashboard">
      {loadError && (
        <div className="empty error-state">
          <XCircle size={19} />
          <span>
            Some dashboard data could not be loaded. The available sections are still usable.
          </span>
          <button className="secondary-btn" onClick={load}>
            Retry
          </button>
        </div>
      )}
      <PageHeader
        eyebrow={blueprint.eyebrow}
        title={`${blueprint.title}${firstName ? `, ${firstName}` : ''}`}
        description={blueprint.description}
        action={
          <div className="live-pill">
            <span className="pulse" /> Live data
          </div>
        }
      />
      <div className="dashboard-hero">
        <div>
          <span className="hero-kicker">{role} workspace</span>
          <h2>{blueprint.focus}</h2>
          <p>
            Welcome back, {name}. This command center puts the workflows and decisions owned by your
            role in one place.
          </p>
        </div>
        <div className="hero-avatar">
          {name
            .split(' ')
            .map((x) => x[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
      </div>
      <div className="thought">
        <Sparkles size={19} />
        <div>
          <b>Thought of the day</b>
          <span>“{getThought(role)}”</span>
        </div>
      </div>

      <Section title="Your command shortcuts" className="command-shortcuts">
        <div className="quick-actions">
          {quick.map(([to, label, Icon, meta]) => (
            <NavLink key={to} className="quick" to={to}>
              <span>
                <Icon size={19} />
              </span>
              <b>{label}</b>
              <small>{meta}</small>
            </NavLink>
          ))}
        </div>
      </Section>

      <div className="stats-grid">
        <StatCard
          icon={Users}
          label={role === 'MANAGER' ? 'Team employees' : 'Employees'}
          value={employees.length}
          meta={role === 'MANAGER' ? 'Direct reports' : 'People directory'}
          tone="blue"
        />
        <StatCard
          icon={Activity}
          label="Present today"
          value={present}
          meta="Attendance records"
          tone="green"
        />
        <StatCard
          icon={CalendarDays}
          label={role === 'MANAGER' ? 'Leave approvals' : 'Pending leaves'}
          value={pending}
          meta="Needs attention"
          tone="orange"
        />
        <StatCard
          icon={DollarSign}
          label={role === 'ADMIN' ? 'Payroll records' : 'Paid payroll'}
          value={role === 'ADMIN' ? payroll.length : paid}
          meta={role === 'ADMIN' ? 'Current system' : 'Completed'}
          tone="purple"
        />
      </div>

      <RoleWorkflow role={role} />

      {role === 'ADMIN' && (
        <Section title="Organization command map" className="admin-diagram">
          <div className="admin-map">
            <div className="admin-map-center">
              <ShieldCheck size={22} />
              <b>ADMIN</b>
              <small>Governance & access</small>
            </div>
            <div className="admin-map-branches">
              <div>
                <Users size={18} />
                <b>{employees.length}</b>
                <small>Employees</small>
              </div>
              <div>
                <BriefcaseBusiness size={18} />
                <b>{departments.length}</b>
                <small>Departments</small>
              </div>
              <div>
                <ShieldCheck size={18} />
                <b>{users.length}</b>
                <small>User accounts</small>
              </div>
              <div>
                <FileCheck2 size={18} />
                <b>LIVE</b>
                <small>Audit trail</small>
              </div>
            </div>
          </div>
        </Section>
      )}

      <div className="dashboard-grid">
        <Section title="Attendance activity">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`g-${role}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity=".35" />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--brand)"
                  fill={`url(#g-${role})`}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section
          title={role === 'MANAGER' ? 'Leave approvals' : 'Recent leave requests'}
          action={
            <NavLink className="text-link" to="/leaves">
              Open queue <ChevronRight size={15} />
            </NavLink>
          }
        >
          <div className="activity-list">
            {leaves.slice(0, 5).map((l) => (
              <div className="activity-row" key={l.leave_request_id}>
                <span className="avatar soft">
                  {`${l.employee?.first_name || 'U'}${l.employee?.last_name || ''}`.slice(0, 2)}
                </span>
                <div>
                  <b>
                    {l.employee?.first_name} {l.employee?.last_name}
                  </b>
                  <small>
                    {l.leaveType?.leave_name} • {dateLabel(l.start_date)}
                  </small>
                </div>
                <Badge
                  tone={
                    l.status === 'APPROVED'
                      ? 'success'
                      : l.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {l.status}
                </Badge>
              </div>
            ))}
            {!leaves.length && <Empty text="No leave requests yet." />}
          </div>
        </Section>
      </div>

      <Section title="Role priorities">
        <div className="priority-grid">
          {blueprint.responsibilities.map((item, i) => (
            <div className="priority-card" key={item}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <b>{item}</b>
                <small>Keep this workflow current and actionable.</small>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
function Attendance({ role }) {
  const [today, setToday] = useState(null),
    [rows, setRows] = useState([]),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState('');
  const load = () =>
    Promise.all([
      api.get('/attendance/today'),
      ['ADMIN', 'HR', 'MANAGER'].includes(role)
        ? api.get('/attendance')
        : Promise.resolve({ data: { data: [] } }),
    ])
      .then(([a, b]) => {
        setToday(a.data.data);
        setRows(b.data.data || []);
      })
      .catch(() => {});
  useEffect(() => {
    load();
  }, []);
  const punch = async (p) => {
    setBusy(true);
    try {
      const r = await api.post(`/attendance/${p}`);
      setToast(r.data.message);
      load();
    } catch (e) {
      setToast(e.response?.data?.message || 'Request failed');
    } finally {
      setBusy(false);
      setTimeout(() => setToast(''), 2500);
    }
  };
  return (
    <div>
      <PageHeader
        eyebrow="Time & attendance"
        title={role === 'EMPLOYEE' ? 'My attendance' : 'Attendance control'}
        description="Punch activity, working hours and attendance records."
        action={
          <div className="button-row">
            <button
              className="primary-btn"
              disabled={busy || !!today?.punch_in}
              onClick={() => punch('punch-in')}
            >
              <Zap size={17} /> Punch In
            </button>
            <button
              className="secondary-btn"
              disabled={busy || !today?.punch_in || !!today?.punch_out}
              onClick={() => punch('punch-out')}
            >
              <Clock3 size={17} /> Punch Out
            </button>
          </div>
        }
      />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      <div className="stats-grid">
        <StatCard
          icon={Activity}
          label="Today"
          value={today?.status || 'NOT STARTED'}
          meta={today?.attendance_date || '—'}
          tone="green"
        />
        <StatCard
          icon={Clock3}
          label="Punch in"
          value={
            today?.punch_in
              ? new Date(today.punch_in).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'
          }
          meta="Today"
          tone="purple"
        />
        <StatCard
          icon={Clock3}
          label="Punch out"
          value={
            today?.punch_out
              ? new Date(today.punch_out).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'
          }
          meta="Today"
          tone="blue"
        />
        <StatCard
          icon={Activity}
          label="Working hours"
          value={today?.working_hours ? `${today.working_hours}h` : '—'}
          meta="Calculated on punch out"
          tone="orange"
        />
      </div>
      <Section title={role === 'EMPLOYEE' ? 'Today' : 'All attendance records'}>
        <DataTable
          columns={['Employee', 'Date', 'Status', 'Punch in', 'Punch out', 'Hours']}
          rows={(role === 'EMPLOYEE' ? [today].filter(Boolean) : rows).map((r) => [
            `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}`.trim() || 'My record',
            dateLabel(r.attendance_date),
            <Badge tone={r.status === 'PRESENT' ? 'success' : 'warning'}>{r.status}</Badge>,
            r.punch_in ? new Date(r.punch_in).toLocaleTimeString() : '—',
            r.punch_out ? new Date(r.punch_out).toLocaleTimeString() : '—',
            r.working_hours ?? '—',
          ])}
        />
      </Section>
    </div>
  );
}

function Leaves({ role }) {
  const [types, setTypes] = useState([]),
    [balances, setBalances] = useState([]),
    [rows, setRows] = useState([]),
    [form, setForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' }),
    [modal, setModal] = useState(false),
    [toast, setToast] = useState(''),
    [loading, setLoading] = useState(false);
  const management = ['ADMIN', 'HR', 'MANAGER'].includes(role);
  const load = () =>
    Promise.all([api.get('/leaves'), api.get('/leaves/types'), api.get('/leaves/balances')])
      .then(([l, t, b]) => {
        setRows(l.data.data || []);
        setTypes(t.data.data || []);
        setBalances(b.data.data || []);
      })
      .catch(() => {});
  useEffect(() => {
    load();
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/leaves', form);
      setToast(r.data.message);
      setModal(false);
      setForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      load();
    } catch (e) {
      setToast(e.response?.data?.message || 'Could not apply leave');
    } finally {
      setLoading(false);
      setTimeout(() => setToast(''), 3000);
    }
  };
  const status = async (id, s) => {
    let reason = '';
    if (s === 'REJECTED') reason = window.prompt('Rejection reason') || '';
    try {
      await api.put(`/leaves/${id}/status`, { status: s, rejection_reason: reason });
      load();
    } catch (e) {
      setToast(e.response?.data?.message || 'Could not update leave');
    }
  };
  return (
    <div>
      <PageHeader
        eyebrow="Leave management"
        title={management ? 'Leave management' : 'My leave'}
        description="Balances, requests and approvals in one place."
        action={
          <button className="primary-btn" onClick={() => setModal(true)}>
            <CalendarDays size={17} /> Apply leave
          </button>
        }
      />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      <div className="balance-grid">
        {balances.slice(0, 6).map((b) => (
          <div className="balance-card" key={`${b.leave_type_id}-${b.year}`}>
            <span>{b.leaveType?.leave_name || 'Leave'}</span>
            <strong>{Number(b.remaining_days || 0).toFixed(0)}</strong>
            <small>of {Number(b.total_days || 0).toFixed(0)} days remaining</small>
            <div className="balance-bar">
              <i
                style={{
                  width: `${Math.min(100, (Number(b.remaining_days || 0) / Math.max(1, Number(b.total_days || 1))) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <Section title="Leave requests">
        <DataTable
          columns={[
            'Employee',
            'Type',
            'Dates',
            'Days',
            'Reason',
            'Status',
            management ? 'Action' : '',
          ].filter(Boolean)}
          rows={rows.map((l) => {
            const days = Math.max(
              1,
              Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / 86400000) + 1,
            );
            return [
              `${l.employee?.first_name || ''} ${l.employee?.last_name || ''}`.trim() || 'Mine',
              l.leaveType?.leave_name || '—',
              `${dateLabel(l.start_date)} – ${dateLabel(l.end_date)}`,
              days,
              l.reason || '—',
              <Badge
                tone={
                  l.status === 'APPROVED'
                    ? 'success'
                    : l.status === 'REJECTED'
                      ? 'danger'
                      : 'warning'
                }
              >
                {l.status}
              </Badge>,
              management && l.status === 'PENDING' ? (
                <span className="table-actions">
                  <button
                    className="mini-btn success"
                    onClick={() => status(l.leave_request_id, 'APPROVED')}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="mini-btn danger"
                    onClick={() => status(l.leave_request_id, 'REJECTED')}
                  >
                    <X size={14} />
                  </button>
                </span>
              ) : null,
            ];
          })}
        />
      </Section>
      {modal && (
        <Modal title="Apply for leave" close={() => setModal(false)}>
          <form onSubmit={submit} className="form-grid">
            <label>
              Leave type
              <select
                required
                value={form.leave_type_id}
                onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}
              >
                <option value="">Select type</option>
                {types.map((t) => (
                  <option key={t.leave_type_id} value={t.leave_type_id}>
                    {t.leave_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start date
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </label>
            <label>
              End date
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </label>
            <label className="full-span">
              Reason
              <textarea
                rows="4"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Tell your manager why you need leave…"
              />
            </label>
            <div className="modal-actions full-span">
              <button type="button" className="secondary-btn" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="primary-btn" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Payroll({ role }) {
  const management = ['ADMIN', 'HR', 'MANAGER'].includes(role);
  const [rows, setRows] = useState([]),
    [employees, setEmployees] = useState([]),
    [modal, setModal] = useState(false),
    [payslip, setPayslip] = useState(null),
    [form, setForm] = useState({
      employee_id: '',
      pay_period_start: '',
      pay_period_end: '',
      basic_salary: '',
      allowances: '0',
      deductions: '0',
      remarks: '',
    }),
    [toast, setToast] = useState('');
  const load = () => {
    api
      .get(management ? '/payroll' : '/payroll/my')
      .then((r) => setRows(r.data.data || []))
      .catch(() => {});
    if (management)
      api
        .get('/employees?limit=100')
        .then((r) => setEmployees(r.data.data || []))
        .catch(() => {});
  };
  useEffect(load, []);
  const create = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/payroll', form);
      setToast(r.data.message);
      setModal(false);
      load();
    } catch (e) {
      setToast(e.response?.data?.message || 'Could not create payroll');
    }
    setTimeout(() => setToast(''), 3000);
  };
  const openPayslip = async (id) => {
    try {
      const r = await api.get(`/payroll/${id}/payslip`);
      setPayslip(r.data.data);
    } catch (e) {
      setToast(e.response?.data?.message || 'Could not load payslip');
      setTimeout(() => setToast(''), 3000);
    }
  };
  const action = async (id, path) => {
    try {
      await api.patch(`/payroll/${id}/${path}`);
      load();
    } catch (e) {
      setToast(e.response?.data?.message || 'Action failed');
    }
  };
  return (
    <div>
      <PageHeader
        eyebrow="Payroll & payslips"
        title={management ? 'Payroll control' : 'My payslips'}
        description={
          management
            ? 'Create, process and track payroll records.'
            : 'Review your salary history and payslips.'
        }
        action={
          management ? (
            <button className="primary-btn" onClick={() => setModal(true)}>
              <DollarSign size={17} /> Create payroll
            </button>
          ) : null
        }
      />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      <div className="stats-grid">
        <StatCard
          icon={DollarSign}
          label="Records"
          value={rows.length}
          meta={management ? 'Payroll database' : 'Your payslips'}
          tone="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Paid"
          value={rows.filter((r) => r.status === 'PAID').length}
          meta="Completed"
          tone="green"
        />
        <StatCard
          icon={Clock3}
          label="Draft / pending"
          value={rows.filter((r) => r.status !== 'PAID').length}
          meta="In progress"
          tone="orange"
        />
        <StatCard
          icon={ArrowUpRight}
          label="Latest net"
          value={rows[0] ? money(rows[0].net_salary) : '—'}
          meta={rows[0]?.status || '—'}
          tone="purple"
        />
      </div>
      <Section title="Payroll records">
        <DataTable
          columns={[
            'Employee',
            'Period',
            'Basic',
            'Allowances',
            'Deductions',
            'Net salary',
            'Status',
            'Actions',
          ]}
          rows={rows.map((p) => [
            `${p.employee?.first_name || ''} ${p.employee?.last_name || ''}`.trim() || 'My payroll',
            `${dateLabel(p.pay_period_start)} – ${dateLabel(p.pay_period_end)}`,
            money(p.basic_salary),
            money(p.allowances),
            money(p.deductions),
            <b>{money(p.net_salary)}</b>,
            <Badge
              tone={p.status === 'PAID' ? 'success' : p.status === 'PROCESSED' ? 'info' : 'warning'}
            >
              {p.status}
            </Badge>,
            <span className="table-actions">
              <button
                className="mini-btn"
                title="Payslip"
                onClick={() => openPayslip(p.payroll_id)}
              >
                <FileText size={14} />
              </button>
              {management && p.status === 'DRAFT' && (
                <button
                  className="mini-btn success"
                  onClick={() => action(p.payroll_id, 'process')}
                >
                  <Check size={14} />
                </button>
              )}
              {management && p.status === 'PROCESSED' && (
                <button className="mini-btn" onClick={() => action(p.payroll_id, 'pay')}>
                  <DollarSign size={14} />
                </button>
              )}
            </span>,
          ])}
        />
      </Section>
      {payslip && (
        <Modal title="Payslip" close={() => setPayslip(null)}>
          <div className="payslip">
            <div className="payslip-head">
              <img src="/smart-hrms-logo.svg" alt="Smart HRMS" />
              <div>
                <b>
                  {payslip.employee?.first_name} {payslip.employee?.last_name}
                </b>
                <small>
                  {payslip.employee?.employee_code} • {payslip.employee?.designation}
                </small>
              </div>
            </div>
            <div className="payslip-period">
              <span>Pay period</span>
              <b>
                {dateLabel(payslip.pay_period?.start)} – {dateLabel(payslip.pay_period?.end)}
              </b>
            </div>
            <div className="payslip-lines">
              <span>
                Basic salary <b>{money(payslip.earnings?.basic_salary)}</b>
              </span>
              <span>
                Allowances <b>{money(payslip.earnings?.allowances)}</b>
              </span>
              <span>
                Deductions <b>- {money(payslip.deductions)}</b>
              </span>
              <strong>
                Net salary <b>{money(payslip.net_salary)}</b>
              </strong>
            </div>
            <div className="payslip-foot">
              <Badge tone={payslip.status === 'PAID' ? 'success' : 'warning'}>
                {payslip.status}
              </Badge>
              <span>Payment date: {dateLabel(payslip.payment_date)}</span>
            </div>
          </div>
        </Modal>
      )}
      {modal && (
        <Modal title="Create payroll" close={() => setModal(false)}>
          <form onSubmit={create} className="form-grid">
            <label>
              Employee
              <select
                required
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              >
                <option value="">Select employee</option>
                {employees.map((e) => (
                  <option key={e.employee_id} value={e.employee_id}>
                    {e.employee_code} — {e.first_name} {e.last_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Basic salary
              <input
                type="number"
                min="0"
                required
                value={form.basic_salary}
                onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
              />
            </label>
            <label>
              Period start
              <input
                type="date"
                required
                value={form.pay_period_start}
                onChange={(e) => setForm({ ...form, pay_period_start: e.target.value })}
              />
            </label>
            <label>
              Period end
              <input
                type="date"
                required
                value={form.pay_period_end}
                onChange={(e) => setForm({ ...form, pay_period_end: e.target.value })}
              />
            </label>
            <label>
              Allowances
              <input
                type="number"
                min="0"
                value={form.allowances}
                onChange={(e) => setForm({ ...form, allowances: e.target.value })}
              />
            </label>
            <label>
              Deductions
              <input
                type="number"
                min="0"
                value={form.deductions}
                onChange={(e) => setForm({ ...form, deductions: e.target.value })}
              />
            </label>
            <label className="full-span">
              Remarks
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </label>
            <div className="modal-actions full-span">
              <button type="button" className="secondary-btn" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="primary-btn">Create payroll</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const emptyEmployeeForm = {
  employee_code: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  department_id: '',
  designation: '',
  joining_date: '',
  manager_id: '',
  employment_status: 'ACTIVE',
  account_role_id: '4',
  account_password: '',
};

function Employees({ role }) {
  // Editing is only offered where the backend actually authorizes PUT /employees/:id
  // (ADMIN, HR). Manager and Employee never see the edit control — this mirrors
  // backend authorizeRoles("ADMIN","HR") exactly, so the UI never promises an
  // action the API will reject.
  const canEdit = ['ADMIN', 'HR'].includes(role);
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(false),
    [search, setSearch] = useState('');
  const [modal, setModal] = useState(false),
    [viewing, setViewing] = useState(null),
    [editing, setEditing] = useState(null),
    [confirmDelete, setConfirmDelete] = useState(null);
  const [departments, setDepartments] = useState([]),
    [managers, setManagers] = useState([]),
    [form, setForm] = useState(emptyEmployeeForm),
    [toast, setToast] = useState(''),
    [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    return api
      .get(`/employees?limit=100&search=${encodeURIComponent(search)}`)
      .then((r) => setRows(r.data.data || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    Promise.allSettled([api.get('/departments'), api.get('/employees?limit=100')]).then(
      ([d, e]) => {
        if (d.status === 'fulfilled') setDepartments(d.value.data.data || []);
        if (e.status === 'fulfilled') setManagers(e.value.data.data || []);
      },
    );
  }, [search]);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.post('/employees', form);
      setToast(r.data.message || 'Employee and login account created');
      setModal(false);
      setForm(emptyEmployeeForm);
      load();
    } catch (e) {
      setToast(e.response?.data?.message || 'Could not create employee');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(''), 3500);
    }
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      employee_code: emp.employee_code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone: emp.phone || '',
      department_id: emp.department?.department_id || emp.department_id || '',
      designation: emp.designation,
      joining_date: (emp.joining_date || '').slice(0, 10),
      manager_id: emp.manager_id || emp.manager?.employee_id || '',
      employment_status: emp.employment_status || 'ACTIVE',
    });
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const editable = { ...form };
      delete editable.employee_code; // employee_code is immutable once created
      const r = await api.put(`/employees/${editing.employee_id}`, editable);
      setToast(r.data.message || 'Employee updated');
      setEditing(null);
      load();
    } catch (err) {
      setToast(err.response?.data?.message || 'Could not update employee');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const removeEmployee = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      const r = await api.delete(`/employees/${confirmDelete.employee_id}`);
      setToast(r.data.message || 'Employee deleted successfully');
      setConfirmDelete(null);
      setViewing(null);
      await load();
    } catch (err) {
      setToast(err.response?.data?.message || 'Could not delete employee');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(''), 4000);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={role === 'MANAGER' ? 'Team directory' : 'People directory'}
        title={role === 'MANAGER' ? 'Your team' : 'Employees'}
        description="Search employee records and keep the organization directory current."
        action={
          canEdit ? (
            <button
              className="primary-btn"
              onClick={() => {
                setForm(emptyEmployeeForm);
                setModal(true);
              }}
            >
              <Users size={17} /> Add employee
            </button>
          ) : null
        }
      />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      <Section title="Employee directory">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search by name, code or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="muted">{rows.length} records</span>
        </div>
        {loading && (
          <div className="empty">
            <FileText size={19} />
            <span>Loading employees…</span>
          </div>
        )}
        {!loading && loadError && (
          <div className="empty error-state">
            <XCircle size={19} />
            <span>Unable to load employees.</span>
            <button className="secondary-btn" onClick={load}>
              Retry
            </button>
          </div>
        )}
        {!loading && !loadError && (
          <DataTable
            columns={[
              'Employee',
              'Code',
              'Department',
              'Designation',
              'Email',
              'Phone',
              'Status',
              'Actions',
            ]}
            rows={rows.map((e) => [
              <div className="person-cell">
                <span className="avatar soft">
                  {`${e.first_name}${e.last_name}`.slice(0, 2).toUpperCase()}
                </span>
                <b>
                  {e.first_name} {e.last_name}
                </b>
              </div>,
              e.employee_code,
              e.department?.department_name || '—',
              e.designation,
              e.email,
              e.phone || '—',
              <Badge tone={e.employment_status === 'ACTIVE' ? 'success' : 'warning'}>
                {e.employment_status}
              </Badge>,
              <span className="table-actions">
                <button className="mini-btn" title="View" onClick={() => setViewing(e)}>
                  <CircleUserRound size={14} />
                </button>
                {canEdit && (
                  <button className="mini-btn" title="Edit" onClick={() => openEdit(e)}>
                    <Pencil size={14} />
                  </button>
                )}
                {role === 'ADMIN' && (
                  <button
                    className="mini-btn danger-icon"
                    title="Delete employee"
                    onClick={() => setConfirmDelete(e)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </span>,
            ])}
          />
        )}
      </Section>

      {viewing && (
        <Modal title="Employee details" close={() => setViewing(null)}>
          <div className="details-grid">
            <Detail label="Name" value={`${viewing.first_name} ${viewing.last_name}`} />
            <Detail label="Employee code" value={viewing.employee_code} />
            <Detail label="Department" value={viewing.department?.department_name} />
            <Detail label="Designation" value={viewing.designation} />
            <Detail label="Email" value={viewing.email} />
            <Detail label="Phone" value={viewing.phone} />
            <Detail label="Joining date" value={dateLabel(viewing.joining_date)} />
            <Detail label="Status" value={viewing.employment_status} />
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete employee?" close={() => setConfirmDelete(null)}>
          <div className="delete-warning">
            <div className="delete-warning-icon">
              <Trash2 size={20} />
            </div>
            <div>
              <b>
                Delete {confirmDelete.first_name} {confirmDelete.last_name}?
              </b>
              <p>
                This permanently removes the employee and their login account if there is no
                attendance, payroll or leave history. Employees with historical records cannot be
                deleted; deactivate them instead so your HR history stays intact.
              </p>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="primary-btn danger"
              disabled={saving}
              onClick={removeEmployee}
            >
              {saving ? 'Deleting…' : 'Delete employee'}
            </button>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title="Add employee" close={() => setModal(false)}>
          <form onSubmit={create} className="form-grid">
            <label>
              Employee code
              <input
                required
                value={form.employee_code}
                onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
              />
            </label>
            <label>
              Designation
              <input
                required
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </label>
            <label>
              First name
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </label>
            <label>
              Last name
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Department
              <select
                required
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              >
                <option value="">Select</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reporting manager
              <select
                value={form.manager_id}
                onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
              >
                <option value="">No manager assigned</option>
                {managers
                  .filter((m) => String(m.employee_id) !== String(editing?.employee_id || ''))
                  .map((m) => (
                    <option key={m.employee_id} value={m.employee_id}>
                      {m.first_name} {m.last_name} • {m.designation}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Joining date
              <input
                type="date"
                required
                value={form.joining_date}
                onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
              />
            </label>
            <label>
              Login role
              <select
                required
                value={form.account_role_id}
                onChange={(e) => setForm({ ...form, account_role_id: e.target.value })}
              >
                <option value="4">EMPLOYEE</option>
                <option value="3">MANAGER</option>
                <option value="2">HR</option>
                {role === 'ADMIN' && <option value="1">ADMIN</option>}
              </select>
            </label>
            <label>
              Initial password
              <input
                type="password"
                minLength="8"
                required
                value={form.account_password}
                onChange={(e) => setForm({ ...form, account_password: e.target.value })}
                placeholder="Minimum 8 characters"
              />
            </label>
            <div className="form-help full-span">
              Login username is generated as <b>employee-name.role</b> and login email is the same
              as the employee email.
            </div>
            <div className="modal-actions full-span">
              <button type="button" className="secondary-btn" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="primary-btn" disabled={saving}>
                {saving ? 'Creating…' : 'Create employee'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal
          title={`Edit — ${editing.first_name} ${editing.last_name}`}
          close={() => setEditing(null)}
        >
          <form onSubmit={saveEdit} className="form-grid">
            <label>
              Employee code
              <input disabled value={form.employee_code} />
            </label>
            <label>
              Designation
              <input
                required
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </label>
            <label>
              First name
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </label>
            <label>
              Last name
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Department
              <select
                required
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              >
                <option value="">Select</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reporting manager
              <select
                value={form.manager_id || ''}
                onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
              >
                <option value="">No manager assigned</option>
                {managers
                  .filter((m) => String(m.employee_id) !== String(editing?.employee_id || ''))
                  .map((m) => (
                    <option key={m.employee_id} value={m.employee_id}>
                      {m.first_name} {m.last_name} • {m.designation}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Joining date
              <input
                type="date"
                required
                value={form.joining_date}
                onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={form.employment_status}
                onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
              >
                <option>ACTIVE</option>
                <option>INACTIVE</option>
                <option>ON_LEAVE</option>
                <option>TERMINATED</option>
              </select>
            </label>
            <div className="modal-actions full-span">
              <button type="button" className="secondary-btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="primary-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Departments({ role: roleProp }) {
  const role = roleProp || getStoredAuth()?.user?.role;
  const canManage = ['ADMIN', 'HR'].includes(role);
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [employeeCounts, setEmployeeCounts] = useState({});
  const [modal, setModal] = useState(null),
    [form, setForm] = useState({ department_name: '', description: '' }),
    [toast, setToast] = useState(''),
    [confirmDelete, setConfirmDelete] = useState(null),
    [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const d = await api.get('/departments');
      setRows(Array.isArray(d.data?.data) ? d.data.data : []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Unable to load departments from the server.');
    }
    // Employee counts are supplemental. A failure here must never make the
    // actual department list disappear.
    try {
      const e = await api.get('/employees?limit=100');
      const counts = {};
      (Array.isArray(e.data?.data) ? e.data.data : []).forEach((emp) => {
        const id = emp.department?.department_id || emp.department_id;
        if (id) counts[id] = (counts[id] || 0) + 1;
      });
      setEmployeeCounts(counts);
    } catch (err) {
      setEmployeeCounts({});
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm({ department_name: '', description: '' });
    setModal({ mode: 'create' });
  };
  const openEdit = (d) => {
    setForm({ department_name: d.department_name || '', description: d.description || '' });
    setModal({ mode: 'edit', dept: d });
  };
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r =
        modal.mode === 'create'
          ? await api.post('/departments', form)
          : await api.put(`/departments/${modal.dept.department_id}`, form);
      setToast(r.data.message || 'Department saved successfully');
      setModal(null);
      await load();
    } catch (err) {
      setToast(err.response?.data?.message || 'Could not save department');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(''), 3000);
    }
  };
  const remove = async (d) => {
    try {
      await api.delete(`/departments/${d.department_id}`);
      setToast('Department deleted');
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setToast(
        err.response?.data?.message ||
          'Department cannot be deleted because it may contain employees',
      );
      setConfirmDelete(null);
    }
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Organization"
        title="Departments"
        description="Manage the organizational structure used across HRMS."
        action={
          canManage ? (
            <button className="primary-btn" onClick={openCreate}>
              <BriefcaseBusiness size={17} /> Add department
            </button>
          ) : null
        }
      />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      {loading && (
        <div className="empty">
          <FileText size={19} />
          <span>Loading departments…</span>
        </div>
      )}
      {!loading && loadError && (
        <div className="empty error-state">
          <XCircle size={19} />
          <span>{loadError}</span>
          <button className="secondary-btn" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {!loading && !loadError && !rows.length && <Empty text="No departments found." />}
      {!loading && !loadError && !!rows.length && (
        <div className="cards-grid">
          {rows.map((d) => (
            <div className="department-card" key={d.department_id}>
              <div className="department-icon">
                <BriefcaseBusiness size={20} />
              </div>
              <h3>{d.department_name || 'Unnamed department'}</h3>
              <p>{d.description || 'No description available.'}</p>
              <span>
                {employeeCounts[d.department_id] ?? 0} employee
                {employeeCounts[d.department_id] === 1 ? '' : 's'}
              </span>
              {canManage && (
                <div className="table-actions" style={{ marginTop: 10 }}>
                  <button className="mini-btn" title="Edit" onClick={() => openEdit(d)}>
                    <Pencil size={14} />
                  </button>
                  <button
                    className="mini-btn danger"
                    title="Delete"
                    onClick={() => setConfirmDelete(d)}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Create department' : 'Edit department'}
          close={() => setModal(null)}
        >
          <form onSubmit={submit} className="form-stack">
            <label>
              Name
              <input
                required
                value={form.department_name}
                onChange={(e) => setForm({ ...form, department_name: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                rows="4"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="primary-btn" disabled={saving}>
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Create' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Delete department?" close={() => setConfirmDelete(null)}>
          <p>
            This will permanently delete <b>{confirmDelete.department_name}</b>. Departments that
            still contain employees cannot be deleted. This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button className="primary-btn danger" onClick={() => remove(confirmDelete)}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UsersPage() {
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [toast, setToast] = useState('');
  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const r = await api.get('/users');
      setRows(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch (e) {
      setLoadError(e.response?.data?.message || 'Could not load users from the server.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const change = async (id, role_id) => {
    try {
      await api.patch(`/users/${id}/role`, { role_id: Number(role_id) });
      setToast('User role updated');
      await load();
    } catch (e) {
      setToast(e.response?.data?.message || 'Could not update role');
    } finally {
      setTimeout(() => setToast(''), 3000);
    }
  };
  const status = async (id, s) => {
    try {
      await api.patch(`/users/${id}/status`, { status: s });
      setToast('User status updated');
      await load();
    } catch (e) {
      setToast(e.response?.data?.message || 'Could not update status');
    } finally {
      setTimeout(() => setToast(''), 3000);
    }
  };
  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="User management"
        description="Control account roles and access status."
      />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      <Section title="System users" action={<span className="muted">{rows.length} accounts</span>}>
        {loading && (
          <div className="empty">
            <FileText size={19} />
            <span>Loading users…</span>
          </div>
        )}
        {!loading && loadError && (
          <div className="empty error-state">
            <XCircle size={19} />
            <span>{loadError}</span>
            <button className="secondary-btn" onClick={load}>
              Retry
            </button>
          </div>
        )}
        {!loading && !loadError && (
          <DataTable
            columns={['User', 'Login email', 'Employee', 'Role', 'Status', 'Access']}
            rows={rows.map((u) => {
              const username = u.username || 'Unknown user';
              const roleId = Number(u.role_id) || 0;
              const statusValue = u.status || 'INACTIVE';

              return [
                <div className="person-cell">
                  <span className="avatar soft">{username.slice(0, 2).toUpperCase()}</span>
                  <b>{username}</b>
                </div>,
                u.email || '—',
                u.employee
                  ? `${u.employee.first_name || ''} ${u.employee.last_name || ''}`.trim()
                  : 'Unlinked',
                <select
                  className="table-select"
                  value={roleId}
                  onChange={(e) => change(u.user_id, e.target.value)}
                >
                  <option value="1">ADMIN</option>
                  <option value="2">HR</option>
                  <option value="3">MANAGER</option>
                  <option value="4">EMPLOYEE</option>
                </select>,
                <Badge
                  tone={
                    statusValue === 'ACTIVE'
                      ? 'success'
                      : statusValue === 'LOCKED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {statusValue}
                </Badge>,
                <select
                  className="table-select"
                  value={statusValue}
                  onChange={(e) => status(u.user_id, e.target.value)}
                >
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                  <option>LOCKED</option>
                </select>,
              ];
            })}
          />
        )}
      </Section>
    </div>
  );
}

function Audit() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api
      .get('/audit-logs')
      .then((r) => setRows(r.data.data || []))
      .catch(() => {});
  }, []);
  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Audit logs"
        description="Recent actions recorded by Smart HRMS."
      />
      <Section title="Activity trail">
        <DataTable
          columns={['Action', 'Entity', 'Entity ID', 'User', 'Timestamp', 'Details']}
          rows={rows.map((a) => [
            <b>{a.action}</b>,
            a.entity_type || '—',
            a.entity_id || '—',
            a.user_id || '—',
            dateLabel(a.created_at),
            a.details ? JSON.stringify(a.details) : '—',
          ])}
        />
      </Section>
    </div>
  );
}

// Suggested questions are role-specific: each role only sees prompts that its
// own backend authorization actually supports an answer for (see aiService.js).
const aiSuggestionsByRole = {
  EMPLOYEE: [
    'What is my leave balance?',
    'What is my attendance today?',
    'What was my latest payroll?',
    'Do I have any pending leave requests?',
    'What is my joining date?',
    'Who is my manager?',
    'Explain the leave approval process',
  ],
  MANAGER: [
    'How many employees are in my team?',
    'Who is absent today?',
    'Which leave requests need my approval?',
    "Show my team's attendance",
    'What is my leave balance?',
    'Explain leave approval workflow',
  ],
  HR: [
    'How many employees are currently active?',
    'Show department-wise employee count',
    'Show pending leave requests',
    'What is my attendance today?',
    'Explain payroll processing workflow',
  ],
  ADMIN: [
    'How many users are in the system?',
    'Show active employees',
    'Show department statistics',
    'Show pending leave requests',
    'Show recent audit activity',
  ],
};

function AIAssistant({ role: roleProp }) {
  const role = roleProp || getStoredAuth()?.user?.role || 'EMPLOYEE';
  const suggestions = aiSuggestionsByRole[role] || aiSuggestionsByRole.EMPLOYEE;
  const [messages, setMessages] = useState([
    {
      from: 'ai',
      text: 'Hi! I’m your Smart HRMS Assistant. Ask me about leave balance, attendance, payroll, employees or HR workflows relevant to your role.',
    },
  ]);
  const [input, setInput] = useState(''),
    [loading, setLoading] = useState(false),
    [lastFailed, setLastFailed] = useState(null);

  const dispatch = async (text) => {
    setMessages((m) => [...m, { from: 'user', text }]);
    setLoading(true);
    setLastFailed(null);
    try {
      const r = await api.post('/ai/chat', { message: text });
      setMessages((m) => [
        ...m,
        { from: 'ai', text: r.data.data?.response || 'I could not generate a response.' },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          from: 'ai',
          text: err.response?.data?.message || 'The AI service is temporarily unavailable.',
          isError: true,
        },
      ]);
      setLastFailed(text);
    } finally {
      setLoading(false);
    }
  };
  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await dispatch(text);
  };
  const retry = () => {
    if (lastFailed) dispatch(lastFailed);
  };

  return (
    <div className="ai-page">
      <PageHeader
        eyebrow="Smart intelligence"
        title="AI Assistant"
        description="Context-aware HR help powered by your HRMS data."
        action={
          <div className="ai-status">
            <span className="pulse" /> Assistant ready
          </div>
        }
      />
      <div className="ai-layout">
        <div className="ai-chat panel">
          <div className="ai-chat-head">
            <div className="ai-avatar">
              <Sparkles size={21} />
            </div>
            <div>
              <b>Smart HRMS Assistant</b>
              <small>Leave • Attendance • Payroll • HR workflows</small>
            </div>
          </div>
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.from}${m.isError ? ' error' : ''}`}>
                <div>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="message ai">
                <div className="typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
            {!loading && lastFailed && (
              <button className="secondary-btn" onClick={retry}>
                <ArrowUpRight size={15} style={{ transform: 'rotate(-45deg)' }} /> Retry last
                message
              </button>
            )}
          </div>
          <form onSubmit={send} className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask: How many casual leaves do I have?"
              maxLength={2000}
            />
            <button className="primary-btn" disabled={loading}>
              <MessageCircle size={17} />
            </button>
          </form>
        </div>
        <div className="ai-side">
          <Section title="Try asking">
            <div className="suggestions">
              {suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    if (!loading) dispatch(q);
                  }}
                >
                  {q}
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </Section>
          <Section title="Capabilities">
            <div className="cap-list">
              <span>
                <CheckCircle2 />
                Role-aware HR context
              </span>
              <span>
                <CheckCircle2 />
                Intent detection
              </span>
              <span>
                <CheckCircle2 />
                FastAPI integration
              </span>
              <span>
                <CheckCircle2 />
                Node fallback
              </span>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Profile({ profile, setProfile }) {
  const [phone, setPhone] = useState(profile?.employee?.phone || ''),
    [editing, setEditing] = useState(false),
    [saving, setSaving] = useState(false),
    [toast, setToast] = useState('');
  useEffect(() => setPhone(profile?.employee?.phone || ''), [profile]);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/users/me', { phone });
      setProfile(r.data.data);
      setEditing(false);
      setToast(r.data.message);
    } catch (e) {
      setToast(e.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(''), 3000);
    }
  };
  const e = profile?.employee;
  return (
    <div>
      <PageHeader
        eyebrow="My account"
        title="Profile"
        description="View your HR identity and update the contact field allowed by your role."
        action={
          !editing ? (
            <button className="secondary-btn" onClick={() => setEditing(true)}>
              <Pencil size={16} /> Edit phone
            </button>
          ) : null
        }
      />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      <div className="profile-grid">
        <section className="profile-hero panel">
          <div className="profile-cover" />
          <div className="profile-avatar">
            {`${e?.first_name || profile?.username || 'U'}${e?.last_name || ''}`
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <h2>{e ? `${e.first_name} ${e.last_name}` : profile?.username}</h2>
          <p>{e?.designation || profile?.role?.role_name}</p>
          <Badge tone="success">{profile?.status || 'ACTIVE'}</Badge>
          <div className="profile-meta">
            <span>
              <BriefcaseBusiness size={16} />
              {profile?.role?.role_name || '—'}
            </span>
            <span>
              <ShieldCheck size={16} />
              {e?.employee_code || '—'}
            </span>
            <span>
              <HeartHandshake size={16} />
              {e?.department?.department_name || '—'}
            </span>
          </div>
        </section>
        <Section title="Account information">
          <div className="details-grid">
            <Detail label="Username" value={profile?.username} />
            <Detail label="Login email" value={profile?.email} />
            <Detail label="Employee email" value={e?.email} />
            <Detail label="Employee code" value={e?.employee_code} />
            <Detail label="Designation" value={e?.designation} />
            <Detail label="Department" value={e?.department?.department_name} />
            <Detail label="First name" value={e?.first_name} />
            <Detail label="Last name" value={e?.last_name} />
          </div>
          {editing ? (
            <form onSubmit={save} className="inline-edit">
              <label>
                Phone number
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </label>
              <div>
                <button type="button" className="secondary-btn" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button className="primary-btn" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="phone-display">
              <span>
                <span className="label">Phone</span>
                <b>{e?.phone || 'Not provided'}</b>
              </span>
              <ShieldCheck size={17} />
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <b>{value || '—'}</b>
    </div>
  );
}

function Developer() {
  return (
    <div>
      <PageHeader
        eyebrow="Product & engineering"
        title="Developer"
        description="Smart HRMS engineering, architecture and product capabilities in one place."
      />
      <div className="developer-card panel">
        <div className="developer-glow" />
        <div className="developer-banner">
          <div className="developer-orbit">
            <Code2 size={28} />
          </div>
          <div>
            <span className="dev-kicker">SMART HRMS • ENGINEERING</span>
            <h2>Built for people, payroll & intelligence.</h2>
            <p>
              Full-stack architecture with secure role-based workflows, automation and AI-assisted
              HR operations.
            </p>
          </div>
        </div>
        <div className="developer-profile">
          <img src={developer.image} alt="Developer" />
          <div className="dev-copy">
            <Badge tone="info">Full Stack Developer</Badge>
            <h2>{developer.name}</h2>
            <p>{developer.role}</p>
            <div className="social-row">
              <a href={`mailto:${developer.email}`}>
                <MessageCircle size={17} />
                {developer.email}
              </a>
              <a href={developer.linkedin} target="_blank" rel="noreferrer">
                <BadgeCheck size={17} />
                LinkedIn
              </a>
              <a href={developer.github} target="_blank" rel="noreferrer">
                <Code2 size={17} />
                GitHub
              </a>
            </div>
          </div>
        </div>
        <div className="developer-capabilities">
          <div>
            <Sparkles size={18} />
            <b>AI Intelligence</b>
            <small>HR assistance & insights</small>
          </div>
          <div>
            <ShieldCheck size={18} />
            <b>Secure RBAC</b>
            <small>Role-aware access control</small>
          </div>
          <div>
            <Activity size={18} />
            <b>Live Operations</b>
            <small>Attendance & payroll flow</small>
          </div>
          <div>
            <Users size={18} />
            <b>People Platform</b>
            <small>Employee lifecycle</small>
          </div>
        </div>
        <div className="dev-note">
          <Zap size={18} />
          <span>
            <b>Smart HRMS engineering stack</b>
            <small>
              People operations • attendance • leave • payroll • AI • audit & governance
            </small>
          </span>
        </div>
      </div>
    </div>
  );
}
function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <Empty text="No records found." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
function Empty({ text }) {
  return (
    <div className="empty">
      <FileText size={19} />
      <span>{text}</span>
    </div>
  );
}
function Modal({ title, close, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={close}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default App;
