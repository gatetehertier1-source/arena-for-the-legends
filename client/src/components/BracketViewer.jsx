// BracketViewer.jsx
// Renders a single-elimination bracket as SVG.
// Props: matches — array of match objects from the API

const MATCH_W = 190;
const MATCH_H = 58;  // two player rows
const ROW_H = 28;
const COL_GAP = 60;
const V_GAP = 20;

function getRounds(matches) {
  // Group matches by round number
  const rounds = {};
  matches.forEach(m => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });
  return Object.entries(rounds)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([round, ms]) => ({ round: Number(round), matches: ms }));
}

function PlayerRow({ name, score, winner, y }) {
  const bg = winner ? '#0f1c14' : '#161a22';
  const stroke = winner ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.07)';
  const nameColor = name ? (winner ? '#e8eaf0' : '#aab0c0') : '#3a3e4a';
  const scoreColor = winner ? '#00e676' : '#00e5ff';

  return (
    <g>
      <rect x={0} y={y} width={MATCH_W} height={ROW_H} rx={0} fill={bg} stroke={stroke} strokeWidth={1} />
      <text x={10} y={y + 18} fontFamily="Rajdhani, sans-serif" fontSize={12} fontWeight={600} fill={nameColor}>
        {name || 'TBD'}
      </text>
      {score !== null && score !== undefined && (
        <text x={MATCH_W - 10} y={y + 18} fontFamily="Rajdhani, sans-serif" fontSize={12} fontWeight={700}
          fill={scoreColor} textAnchor="end">
          {score}
        </text>
      )}
    </g>
  );
}

function MatchBox({ match, x, y }) {
  const p1Win = match.winner && match.player1 && match.winner.toString() === match.player1._id?.toString();
  const p2Win = match.winner && match.player2 && match.winner.toString() === match.player2._id?.toString();

  return (
    <g transform={`translate(${x},${y})`}>
      <PlayerRow
        name={match.player1?.username}
        score={match.score1}
        winner={p1Win}
        y={0}
      />
      <PlayerRow
        name={match.player2?.username}
        score={match.score2}
        winner={p2Win}
        y={ROW_H}
      />
    </g>
  );
}

export default function BracketViewer({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
        Bracket not yet generated.
      </div>
    );
  }

  const rounds = getRounds(matches);
  const maxMatchesInRound = Math.max(...rounds.map(r => r.matches.length));
  const totalH = maxMatchesInRound * (MATCH_H + V_GAP) + 40;
  const totalW = rounds.length * (MATCH_W + COL_GAP) + 40;

  // Compute y positions for each round
  const roundPositions = rounds.map((round, ri) => {
    const count = round.matches.length;
    const spacing = totalH / count;
    return round.matches.map((m, mi) => ({
      match: m,
      x: 20 + ri * (MATCH_W + COL_GAP),
      y: spacing * mi + spacing / 2 - MATCH_H / 2 + 30,
    }));
  });

  // Draw connector lines between rounds
  const connectors = [];
  for (let ri = 0; ri < roundPositions.length - 1; ri++) {
    const curr = roundPositions[ri];
    const next = roundPositions[ri + 1];
    for (let mi = 0; mi < next.length; mi++) {
      const from1 = curr[mi * 2];
      const from2 = curr[mi * 2 + 1];
      const to = next[mi];
      if (from1 && from2 && to) {
        const x1 = from1.x + MATCH_W;
        const y1 = from1.y + MATCH_H / 2;
        const x2 = from2.x + MATCH_W;
        const y2 = from2.y + MATCH_H / 2;
        const xm = to.x;
        const ym = to.y + MATCH_H / 2;
        const mx = x1 + (xm - x1) / 2;
        connectors.push(
          <g key={`c-${ri}-${mi}`}>
            <path d={`M${x1},${y1} H${mx} V${ym} H${xm}`}
              stroke="rgba(0,229,255,0.18)" strokeWidth={1.5} fill="none" />
            <path d={`M${x2},${y2} H${mx} V${ym}`}
              stroke="rgba(0,229,255,0.18)" strokeWidth={1.5} fill="none" />
          </g>
        );
      }
    }
  }

  const roundLabels = ['Quarterfinals', 'Semifinals', 'Final', 'Champion'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width={totalW}
        height={totalH}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', minWidth: totalW }}
      >
        {/* Round labels */}
        {roundPositions.map((positions, ri) => (
          <text key={ri}
            x={positions[0].x + MATCH_W / 2}
            y={18}
            fontFamily="Rajdhani, sans-serif"
            fontSize={11}
            fontWeight={600}
            letterSpacing={1.5}
            fill="#7a8296"
            textAnchor="middle"
            style={{ textTransform: 'uppercase' }}
          >
            {roundLabels[ri] || `Round ${ri + 1}`}
          </text>
        ))}

        {/* Connectors */}
        {connectors}

        {/* Match boxes */}
        {roundPositions.map((positions) =>
          positions.map(({ match, x, y }) => (
            <MatchBox key={match._id} match={match} x={x} y={y} />
          ))
        )}
      </svg>
    </div>
  );
}
