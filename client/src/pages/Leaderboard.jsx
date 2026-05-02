import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BracketViewer from '../components/BracketViewer';

// ── Leaderboard ────────────────────────────────────────────────────────────────
export function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState('all');

  useEffect(() => {
    axios.get('/api/leaderboard').then(r => {
      setPlayers(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = game === 'all' ? players : players.filter(p => p.favoriteGame === game);

  const medals = ['🥇', '🥈', '🥉'];
  const rankColors = ['var(--gold)', '#aab0c0', '#cd7f32'];
  const avatarColors = [
    { bg: 'rgba(255,180,0,0.15)', col: 'var(--gold)' },
    { bg: 'rgba(0,229,255,0.12)', col: 'var(--cyan)' },
    { bg: 'rgba(180,75,255,0.12)', col: 'var(--purple)' },
  ];

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 32 }}>Leaderboard</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'eFootball', 'CODM'].map(g => (
              <button key={g} onClick={() => setGame(g)} className="btn btn-ghost btn-sm"
                style={game === g ? { borderColor: 'var(--cyan)', color: 'var(--cyan)' } : {}}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="card">
            <div className="card-head">
              <span className="card-title">Season Rankings</span>
              <span className="badge badge-cyan">{filtered.length} players</span>
            </div>
            {filtered.map((player, i) => {
              const av = avatarColors[i] || { bg: 'rgba(255,255,255,0.06)', col: 'var(--muted)' };
              return (
                <div key={player._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 18px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  {/* Rank */}
                  <div style={{
                    fontFamily: 'var(--font-head)', fontWeight: 700, width: 32, textAlign: 'center',
                    color: rankColors[i] || 'var(--muted)', fontSize: 16,
                  }}>
                    {medals[i] || i + 1}
                  </div>

                  {/* Avatar */}
                  <div className="avatar" style={{ background: av.bg, color: av.col }}>
                    {player.username?.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 15 }}>
                      {player.username}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {player.favoriteGame || 'All games'} · {player.stats?.wins || 0}W / {player.stats?.losses || 0}L
                    </div>
                  </div>

                  {/* WR bar */}
                  <div style={{ width: 80 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textAlign: 'right' }}>
                      {player.stats?.wins + player.stats?.losses > 0
                        ? Math.round((player.stats.wins / (player.stats.wins + player.stats.losses)) * 100)
                        : 0}% WR
                    </div>
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        background: 'var(--cyan)',
                        width: `${player.stats?.wins + player.stats?.losses > 0
                          ? (player.stats.wins / (player.stats.wins + player.stats.losses)) * 100
                          : 0}%`,
                      }} />
                    </div>
                  </div>

                  {/* Points */}
                  <div style={{ textAlign: 'right', minWidth: 70 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--cyan)' }}>
                      {player.stats?.points?.toLocaleString() || 0}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>pts</div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>No players yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bracket Page ───────────────────────────────────────────────────────────────
export function BracketPage() {
  const [tournaments, setTournaments] = useState([]);
  const [selected, setSelected] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/tournaments').then(r => {
      const active = r.data.filter(t => t.status === 'live' || t.status === 'completed');
      setTournaments(active);
      if (active.length > 0) setSelected(active[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    axios.get(`/api/matches?tournament=${selected}`).then(r => {
      setMatches(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selected]);

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <h1 style={{ fontSize: 32 }}>Live Bracket</h1>
          {tournaments.length > 0 && (
            <select
              className="form-select"
              value={selected}
              onChange={e => setSelected(e.target.value)}
              style={{ width: 'auto', flex: 'none' }}
            >
              {tournaments.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <span className="card-title">{tournaments.find(t => t._id === selected)?.name || 'Bracket'}</span>
            <span className="badge badge-live">● Live</span>
          </div>
          <div style={{ padding: 16 }}>
            {loading ? <div className="spinner" /> : <BracketViewer matches={matches} />}
          </div>
        </div>
      </div>
    </div>
  );
}
