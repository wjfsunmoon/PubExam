import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', label: '数据看板', end: true },
  { to: '/entry', label: '录入题目' },
  { to: '/bank', label: '题库浏览' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-brand-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold tracking-tight">📚 考公题目梳理 Agent</h1>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-800 text-white'
                      : 'text-brand-100 hover:bg-brand-600'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-brand-100">👤 {user?.username}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded text-sm bg-brand-600 hover:bg-brand-500 transition-colors"
          >
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
