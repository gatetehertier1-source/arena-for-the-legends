import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Countdown from '../components/Countdown';

// ── Tournament List ────────────────────────────────────────────────────────────
export function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/tournaments').then(r => {
      setTournaments(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tournaments : tournaments.filter(t => t.status === filter);

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 32 }}>Tournaments</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'open', 'live', 'upcoming', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="btn btn-ghost btn-sm"
                style={filter === f ? { borderColor: 'var(--cyan)', color: 'var(--cyan)' } : {}}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="spinner" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(t => <TournamentCard key={t._id} t={t} />)}
            {filtered.length === 0 && (
              <div style={{ color: 'var(--muted)', gridColumn: '1/-1', padding: 40, textAlign: 'center' }}>
                No tournaments found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TournamentCard({ t }) {
  const badgeMap = { live: 'badge-live', open: 'badge-open', upcoming: 'badge-soon', completed: 'badge-cyan' };
  return (
    <Link to={`/tournaments/${t._id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ transition: 'border-color 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ padding: '18px 18px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span className={`badge ${badgeMap[t.status] || 'badge-cyan'}`}>{t.status}</span>
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.game}
            </span>
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>{t.name}</h3>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
            {t.type} · {t.registeredPlayers?.length || 0} / {t.maxPlayers} players
          </div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 18px', borderTop: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Prize Pool</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
              {t.prizePool?.toLocaleString()} RWF
            </div>
          </div>
          <div style={{ color: 'var(--cyan)', fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13 }}>
            View Details →
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Tournament Detail ──────────────────────────────────────────────────────────
export function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get(`/api/tournaments/${id}`).then(r => {
      setTournament(r.data);
      setLoading(false);
    }).catch(() => { navigate('/tournaments'); });
  }, [id]);

  const alreadyJoined = tournament?.registeredPlayers?.some(p =>
    (p._id || p) === user?._id
  );

  const joinTournament = async () => {
    if (!user) { navigate('/login'); return; }
    setJoining(true);
    setMsg('');
    try {
      await axios.post(`/api/tournaments/${id}/join`);
      setMsg('Successfully joined!');
      const r = await axios.get(`/api/tournaments/${id}`);
      setTournament(r.data);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not join tournament.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="spinner" />;
  if (!tournament) return null;

  const isOpen = tournament.status === 'open';
  const isFull = (tournament.registeredPlayers?.length || 0) >= tournament.maxPlayers;

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0d1520, #0a1428)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '32px 32px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <span className={`badge ${tournament.status === 'live' ? 'badge-live' : tournament.status === 'open' ? 'badge-open' : 'badge-soon'}`}>
              {tournament.status}
            </span>
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, color: 'var(--muted)', letterSpacing: 1 }}>
              {tournament.game} · {tournament.type}
            </span>
          </div>
          <h1 style={{ fontSize: 36, marginBottom: 8 }}>{tournament.name}</h1>
          {tournament.description && (
            <p style={{ color: 'var(--muted)', maxWidth: 600, marginBottom: 20 }}>{tournament.description}</p>
          )}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 24 }}>
            <div>
              <div className="stat-label">Prize Pool</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>
                {tournament.prizePool?.toLocaleString()} RWF
              </div>
            </div>
            <div>
              <div className="stat-label">Entry Fee</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: 'var(--cyan)' }}>
                {tournament.entryFee > 0 ? `${tournament.entryFee.toLocaleString()} RWF` : 'Free'}
              </div>
            </div>
            <div>
              <div className="stat-label">Players</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700 }}>
                {tournament.registeredPlayers?.length || 0} / {tournament.maxPlayers}
              </div>
            </div>
          </div>

          {tournament.startDate && (
            <Countdown targetDate={tournament.startDate} label="Tournament starts in" />
          )}

          {msg && (
            <div className={`alert ${msg.includes('Successfully') ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 16 }}>
              {msg}
            </div>
          )}

          {isOpen && !alreadyJoined && (
            <button onClick={joinTournament} disabled={joining || isFull}
              className="btn btn-primary" style={{ marginTop: 20, fontSize: 15, padding: '10px 24px' }}>
              {joining ? 'Joining...' : isFull ? 'Tournament Full' : 'Join Tournament →'}
            </button>
          )}
          {alreadyJoined && (
            <div className="badge badge-open" style={{ marginTop: 20, fontSize: 12, padding: '6px 14px' }}>
              ✓ You are registered
            </div>
          )}
        </div>

        {/* Registered Players */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Registered Players</span>
            <span className="badge badge-cyan">{tournament.registeredPlayers?.length || 0} players</span>
          </div>
          {(tournament.registeredPlayers?.length || 0) === 0 ? (
            <div style={{ padding: 24, color: 'var(--muted)', textAlign: 'center' }}>No players registered yet.</div>
          ) : (
            <table className="arena-table">
              <thead>
                <tr><th>#</th><th>Player</th><th>Wins</th><th>Losses</th></tr>
              </thead>
              <tbody>
                {tournament.registeredPlayers.map((p, i) => (
                  <tr key={p._id || i}>
                    <td style={{ color: 'var(--muted)', fontFamily: 'var(--font-head)' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)', fontSize: 11, width: 28, height: 28 }}>
                          {p.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>{p.username}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--green)' }}>{p.stats?.wins || 0}</td>
                    <td style={{ color: 'var(--muted)' }}>{p.stats?.losses || 0}</td>
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
