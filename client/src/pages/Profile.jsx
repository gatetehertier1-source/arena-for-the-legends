import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [form, setForm] = useState({ favoriteGame: '', bio: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setForm({ favoriteGame: user.favoriteGame || '', bio: user.bio || '' });
    axios.get('/api/users/me/tournaments').then(r => setTournaments(r.data)).catch(() => {});
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/users/me', form);
      setMsg('Profile updated!');
    } catch { setMsg('Failed to update.'); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await axios.post('/api/users/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg('Avatar updated!');
    } catch { setMsg('Avatar upload failed.'); }
  };

  if (!user) return null;

  const wr = (user.stats?.wins + user.stats?.losses) > 0
    ? Math.round((user.stats.wins / (user.stats.wins + user.stats.losses)) * 100)
    : 0;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: 32, marginBottom: 24 }}>My Profile</h1>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Profile Card */}
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <label style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
                  background: 'var(--cyan-dim)', border: '2px solid var(--cyan)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: 'var(--cyan)',
                  overflow: 'hidden',
                }}>
                  {user.avatar
                    ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user.username?.slice(0, 2).toUpperCase()
                  }
                </div>
                <div style={{ fontSize: 12, color: 'var(--cyan)', fontFamily: 'var(--font-cond)', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Click to change photo
                </div>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
              </label>

              <h2 style={{ fontSize: 22, margin: '12px 0 4px' }}>{user.username}</h2>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>{user.email}</div>
              {user.role === 'admin' && (
                <span className="badge badge-purple" style={{ fontSize: 11 }}>Admin</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="stat-card cyan">
              <div className="stat-label">Points</div>
              <div className="stat-value">{(user.stats?.points || 0).toLocaleString()}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Win Rate</div>
              <div className="stat-value">{wr}%</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-label">Wins</div>
              <div className="stat-value">{user.stats?.wins || 0}</div>
            </div>
            <div className="stat-card" style={{ borderTop: '2px solid var(--muted)' }}>
              <div className="stat-label">Losses</div>
              <div className="stat-value" style={{ color: 'var(--muted)' }}>{user.stats?.losses || 0}</div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-head"><span className="card-title">Edit Profile</span></div>
          <div className="card-body">
            {msg && <div className={`alert ${msg.includes('!') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label className="form-label">Favorite Game</label>
                <select className="form-select" value={form.favoriteGame}
                  onChange={e => setForm(f => ({ ...f, favoriteGame: e.target.value }))}>
                  <option value="">Select game</option>
                  <option value="eFootball">eFootball</option>
                  <option value="CODM">Call of Duty Mobile</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-textarea" value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell the arena about yourself..." />
              </div>
              <button className="btn btn-primary">Save Changes</button>
            </form>
          </div>
        </div>

        {/* My Tournaments */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">My Tournaments</span>
            <span className="badge badge-cyan">{tournaments.length}</span>
          </div>
          {tournaments.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--muted)', textAlign: 'center' }}>
              You haven't joined any tournaments yet.
            </div>
          ) : (
            <table className="arena-table">
              <thead><tr><th>Tournament</th><th>Game</th><th>Status</th><th>Prize</th></tr></thead>
              <tbody>
                {tournaments.map(t => (
                  <tr key={t._id}>
                    <td style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>{t.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{t.game}</td>
                    <td><span className={`badge ${t.status === 'live' ? 'badge-live' : t.status === 'open' ? 'badge-open' : 'badge-soon'}`}>{t.status}</span></td>
                    <td style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontWeight: 700 }}>{t.prizePool?.toLocaleString()} RWF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
