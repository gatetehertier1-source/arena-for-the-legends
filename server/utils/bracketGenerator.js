const supabase = require('../db');

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Round up to next power of 2
function nextPow2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Single elimination bracket
 * Returns array of inserted match rows
 */
async function generateSingleElimination(tournamentId, players) {
  const seeded = shuffle(players);
  const slots = nextPow2(seeded.length);
  const rounds = Math.log2(slots);

  // Pad with byes (null)
  while (seeded.length < slots) seeded.push(null);

  const matchRows = [];

  // Round 1 — pair players
  for (let i = 0; i < slots; i += 2) {
    const p1 = seeded[i];
    const p2 = seeded[i + 1];
    const row = {
      tournament_id: tournamentId,
      round: 1,
      match_number: i / 2 + 1,
      player1_id: p1?.id || null,
      player2_id: p2?.id || null,
      status: 'pending',
      winner_id: null,
    };
    // Auto-advance bye
    if (!p1 && p2) { row.winner_id = p2.id; row.status = 'completed'; }
    else if (p1 && !p2) { row.winner_id = p1.id; row.status = 'completed'; }
    matchRows.push(row);
  }

  // Subsequent rounds — empty placeholders
  for (let r = 2; r <= rounds; r++) {
    const count = slots / Math.pow(2, r);
    for (let i = 0; i < count; i++) {
      matchRows.push({
        tournament_id: tournamentId,
        round: r,
        match_number: i + 1,
        player1_id: null,
        player2_id: null,
        status: 'pending',
        winner_id: null,
      });
    }
  }

  const { data, error } = await supabase.from('matches').insert(matchRows).select();
  if (error) throw error;
  return data;
}

/**
 * Round robin — every player vs every other player
 */
async function generateRoundRobin(tournamentId, players) {
  const seeded = shuffle(players);
  const matchRows = [];
  let matchNum = 1;

  for (let i = 0; i < seeded.length; i++) {
    for (let j = i + 1; j < seeded.length; j++) {
      matchRows.push({
        tournament_id: tournamentId,
        round: 1,
        match_number: matchNum++,
        player1_id: seeded[i].id,
        player2_id: seeded[j].id,
        status: 'pending',
        winner_id: null,
      });
    }
  }

  const { data, error } = await supabase.from('matches').insert(matchRows).select();
  if (error) throw error;
  return data;
}

/**
 * After admin approves a single-elimination match result,
 * advance the winner into the correct slot of the next round match.
 */
async function advanceWinner(tournamentId, round, matchNumber, winnerId) {
  const nextRound = round + 1;
  const nextMatchNumber = Math.ceil(matchNumber / 2);

  const { data: nextMatch } = await supabase
    .from('matches')
    .select('id, player1_id, player2_id')
    .eq('tournament_id', tournamentId)
    .eq('round', nextRound)
    .eq('match_number', nextMatchNumber)
    .single();

  if (!nextMatch) return; // was the final match

  // Odd match number → player1 slot, even → player2 slot
  const slot = matchNumber % 2 === 1 ? 'player1_id' : 'player2_id';
  await supabase.from('matches').update({ [slot]: winnerId }).eq('id', nextMatch.id);
}

module.exports = { generateSingleElimination, generateRoundRobin, advanceWinner };
