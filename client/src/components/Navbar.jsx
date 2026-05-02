import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: 'rgba(10,12,16,0.97)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 0, height: 60 }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', marginRight: 32 }}>
          <span style={{
            fontFamily: 'var(--font-head)',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 1,
            color: 'var(--text)',
          }}>
            LEAGUE FOR <span style={{ color: 'var(--cyan)' }}>LEGENDS</span> ARENA
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {[
            { path: '/', label: 'Home' },
            { path: '/tournaments', label: 'Tournaments' },
            { path: '/leaderboard', label: 'Leaderboard' },
            { path: '/bracket', label: 'Bracket' },
          ].map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              style={{
                fontFamily: 'var(--font-cond)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: isActive(path) ? 'var(--cyan)' : 'var(--muted)',
                background: isActive(path) ? 'rgba(0,229,255,0.07)' : 'transparent',
                padding: '6px 14px',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-ghost btn-sm">
                  Admin
                </Link>
              )}
              <Link to="/profile" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                textDecoration: 'none', color: 'var(--text)',
              }}>
                <div className="avatar" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)', fontSize: 12 }}>
                  {user.username?.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14 }}>
                  {user.username}
                </span>
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
