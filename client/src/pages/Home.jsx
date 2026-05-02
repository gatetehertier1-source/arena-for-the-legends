import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Countdown from '../components/Countdown';

function StatCard({ label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function TourneyRow({ t }) {
  const statusBadge = {
    live: 'badge-live',
    open: 'badge-open',
    upcoming: 'badge-soon',
    completed: 'badge badge-cyan',
  }[t.status] || 'badge-cyan';

  return (
    <tr>
      <td>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>{t.name}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.game} · {t.type}</div>
      </td>
      <td><span className={`badge ${statusBadge}`}>{t.status}</span></td>
      <td style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontWeight: 700 }}>
        {t.prizePool?.toLocaleString()} RWF
      </td>
      <td>
        <Link to={`/tournaments/${t._id}`} className="btn btn-ghost btn-sm">View →</Link>
      </td>
    </tr>
  );
}

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({ players: 0, tournaments: 0, prize: 0, matches: 0 });

  useEffect(() => {
    axios.get('/api/tournaments?limit=5').then(r => setTournaments(r.data)).catch(() => {});
    axios.get('/api/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const nextTourney = tournaments.find(t => t.status === 'upcoming' || t.status === 'open');

  return (
    <div className="page">
      <div className="container">

        {/* HERO */}
        <div style={{
          background: 'linear-gradient(135deg, #0d1520 0%, #0a1428 50%, #0d0a1a 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 40px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 600,
            letterSpacing: 2, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 10,
          }}>
            ● Rwanda's Premier Esports Platform
          </div>
          <h1 style={{ fontSize: 42, lineHeight: 1.05, marginBottom: 12 }}>
            Compete. <span style={{ color: 'var(--cyan)' }}>Dominate.</span> Rise.
          </h1>
          <p style={{ color: 'var(--muted)', maxWidth: 480, marginBottom: 24, fontSize: 15 }}>
            eFootball & CODM tournaments in Kigali and beyond. Enter, battle your way through the bracket, and claim the prize.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Link to="/tournaments" className="btn btn-primary" style={{ fontSize: 15 }}>
              Browse Tournaments →
            </Link>
            <Link to="/register" className="btn btn-ghost" style={{ fontSize: 15 }}>
              Create Account
            </Link>
            {nextTourney && (
              <div style={{ marginLeft: 24 }}>
                <Countdown targetDate={nextTourney.startDate} label={`Next: ${nextTourney.name}`} />
              </div>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <StatCard label="Active Players" value={stats.players?.toLocaleString() || '0'} color="cyan" />
          <StatCard label="Tournaments Run" value={stats.tournaments?.toLocaleString() || '0'} color="purple" />
          <StatCard label="Prize Pool (RWF)" value={(stats.prize / 1000).toFixed(0) + 'K'} color="gold" />
          <StatCard label="Matches Played" value={stats.matches?.toLocaleString() || '0'} color="green" />
        </div>

        {/* TOURNAMENTS TABLE */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Active Tournaments</span>
            <Link to="/tournaments" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {tournaments.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
              No tournaments yet. Check back soon.
            </div>
          ) : (
            <table className="arena-table">
              <thead>
                <tr>
                  <th>Tournament</th>
                  <th>Status</th>
                  <th>Prize Pool</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map(t => <TourneyRow key={t._id} t={t} />)}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
