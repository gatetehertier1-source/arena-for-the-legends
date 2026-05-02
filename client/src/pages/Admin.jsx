import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('tournaments');
  const [tournaments, setTournaments] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [form, setForm] = useState({
    name: '', game: 'eFootball', type: 'single-elimination',
    maxPlayers: 16, entryFee: 0, prizePool: 0,
    startDate: '', description: '',
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    fetchData();
  }, [user]);

  const fetchData = () => {
    axios.get('/api/tournaments').then(r => setTournaments(r.data)).catch(() => {});
    axios.get('/api/matches?status=pending').then(r => setPendingMatches(r.data)).catch(() => {});
  };

  const createTournament = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await axios.post('/api/tournaments', form);
      setMsg('Tournament created!');
      fetchData();
      setForm({ name: '', game: 'eFootball', type: 'single-elimination', maxPlayers: 16, entryFee: 0, prizePool: 0, startDate: '', description: '' });
    } catch (err) { setMsg(err.response?.data?.message || 'Failed.'); }
  };

  const generateBracket = async (id) => {
    try {
      await axios.post(`/api/tournaments/${id}/generate-bracket`);
      setMsg('Bracket generated!');
      fetchData();
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to generate bracket.'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/tournaments/${id}`, { status });
      fetchData();
    } catch { setMsg('Status update failed.'); }
  };

  const approveMatch = async (matchId, winnerId) => {
    try {
      await axios.put(`/api/matches/${matchId}/result`, { winner: winnerId });
      fetchData();
    } catch { setMsg('Failed to approve match.'); }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 32 }}>Admin Panel</h1>
          <span className="badge badge-purple" style={{ fontSize: 12 }}>Administrator</span>
        </div>

        {msg && (
          <div className={`alert ${msg.includes('!') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {['tournaments', 'create', 'matches'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn btn-ghost btn-sm"
              style={tab === t ? { borderColor: 'var(--cyan)', color: 'var(--cyan)', borderBottom: '2px solid var(--cyan)' } : {}}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'matches' && pendingMatches.length > 0 && (
                <span className="badge badge-live" style={{ marginLeft: 6 }}>{pendingMatches.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tournaments Tab */}
        {tab === 'tournaments' && (
          <div className="card">
            <div className="card-head"><span className="card-title">All Tournaments</span></div>
            <table className="arena-table">
              <thead>
                <tr>
                  <th>Name</th><th>Game</th><th>Players</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map(t => (
                  <tr key={t._id}>
                    <td style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>{t.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{t.game}</td>
                    <td>{t.registeredPlayers?.length || 0} / {t.maxPlayers}</td>
                    <td><span className={`badge ${t.status === 'live' ? 'badge-live' : t.status === 'open' ? 'badge-open' : 'badge-soon'}`}>{t.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {t.status === 'upcoming' && (
                          <button onClick={() => updateStatus(t._id, 'open')} className="btn btn-ghost btn-sm">Open</button>
                        )}
                        {t.status === 'open' && (
                          <>
                            <button onClick={() => generateBracket(t._id)} className="btn btn-primary btn-sm">Generate Bracket</button>
                            <button onClick={() => updateStatus(t._id, 'live')} className="btn btn-ghost btn-sm">Go Live</button>
                          </>
                        )}
                        {t.status === 'live' && (
                          <button onClick={() => updateStatus(t._id, 'completed')} className="btn btn-ghost btn-sm">Complete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Tab */}
        {tab === 'create' && (
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-head"><span className="card-title">Create Tournament</span></div>
            <div className="card-body">
              <form onSubmit={createTournament}>
                <div className="form-group">
                  <label className="form-label">Tournament Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kigali eFootball Cup" required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Game</label>
                    <select className="form-select" value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))}>
                      <option value="eFootball">eFootball</option>
                      <option value="CODM">Call of Duty Mobile</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tournament Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="single-elimination">Single Elimination</option>
                      <option value="double-elimination">Double Elimination</option>
                      <option value="round-robin">Round Robin</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Max Players</label>
                    <input className="form-input" type="number" value={form.maxPlayers} min={4} step={4}
                      onChange={e => setForm(f => ({ ...f, maxPlayers: Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Entry Fee (RWF)</label>
                    <input className="form-input" type="number" value={form.entryFee} min={0}
                      onChange={e => setForm(f => ({ ...f, entryFee: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Prize Pool (RWF)</label>
                  <input className="form-input" type="number" value={form.prizePool} min={0}
                    onChange={e => setForm(f => ({ ...f, prizePool: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="datetime-local" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Tournament details, rules, etc." />
                </div>
                <button className="btn btn-primary" style={{ fontSize: 15, padding: '10px 24px' }}>
                  Create Tournament
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Pending Matches Tab */}
        {tab === 'matches' && (
          <div className="card">
            <div className="card-head">
              <span className="card-title">Pending Match Approvals</span>
              <span className="badge badge-live">{pendingMatches.length} pending</span>
            </div>
            {pendingMatches.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                No pending match results.
              </div>
            ) : (
              <table className="arena-table">
                <thead><tr><th>Tournament</th><th>Player 1</th><th>Score</th><th>Player 2</th><th>Approve</th></tr></thead>
                <tbody>
                  {pendingMatches.map(m => (
                    <tr key={m._id}>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>{m.tournament?.name}</td>
                      <td style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>{m.player1?.username}</td>
                      <td style={{ fontFamily: 'var(--font-head)', color: 'var(--cyan)', fontSize: 16, fontWeight: 700 }}>
                        {m.score1 ?? '?'} — {m.score2 ?? '?'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>{m.player2?.username}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => approveMatch(m._id, m.player1?._id)} className="btn btn-ghost btn-sm">
                            {m.player1?.username} Wins
                          </button>
                          <button onClick={() => approveMatch(m._id, m.player2?._id)} className="btn btn-ghost btn-sm">
                            {m.player2?.username} Wins
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
