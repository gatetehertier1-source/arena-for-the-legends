const router = require('express').Router();
const supabase = require('../db');
const { auth, adminOnly } = require('../middleware/auth');
const { generateSingleElimination, generateRoundRobin } = require('../utils/bracketGenerator');

// Helper: get registered players for a tournament
async function getRegisteredPlayers(tournamentId) {
  const { data } = await supabase
    .from('tournament_registrations')
    .select('user_id, users(id, username, wins, losses, points, avatar)')
    .eq('tournament_id', tournamentId);
  return (data || []).map(r => r.users);
}

// GET /api/tournaments
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Attach player count for each tournament
    const enriched = await Promise.all(tournaments.map(async (t) => {
      const { count } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', t.id);
      return { ...t, registeredPlayers: [], playerCount: count || 0 };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tournaments/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !tournament) return res.status(404).json({ message: 'Tournament not found.' });

    const players = await getRegisteredPlayers(tournament.id);
    res.json({ ...tournament, registeredPlayers: players });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tournaments — admin only
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, game, type, maxPlayers, entryFee, prizePool, startDate, description } = req.body;
    if (!name || !game || !type)
      return res.status(400).json({ message: 'name, game, type required.' });

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        name,
        game,
        type,
        max_players: maxPlayers || 16,
        entry_fee: entryFee || 0,
        prize_pool: prizePool || 0,
        start_date: startDate || null,
        description: description || '',
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tournaments/:id — admin only
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const allowed = ['name', 'status', 'start_date', 'description', 'prize_pool', 'entry_fee'];
    const updates = {};
    // Accept both camelCase and snake_case from frontend
    const map = { startDate: 'start_date', prizePool: 'prize_pool', entryFee: 'entry_fee' };
    Object.entries(req.body).forEach(([k, v]) => {
      const key = map[k] || k;
      if (allowed.includes(key)) updates[key] = v;
    });

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tournaments/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id, status, max_players')
      .eq('id', req.params.id)
      .single();

    if (!tournament) return res.status(404).json({ message: 'Tournament not found.' });
    if (tournament.status !== 'open')
      return res.status(400).json({ message: 'Tournament is not open for registration.' });

    // Check player count
    const { count } = await supabase
      .from('tournament_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id);

    if (count >= tournament.max_players)
      return res.status(400).json({ message: 'Tournament is full.' });

    const { error } = await supabase
      .from('tournament_registrations')
      .insert({ tournament_id: tournament.id, user_id: req.user.id });

    if (error) {
      if (error.code === '23505') return res.status(409).json({ message: 'You are already registered.' });
      throw error;
    }

    res.json({ message: 'Joined successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tournaments/:id/generate-bracket — admin only
router.post('/:id/generate-bracket', auth, adminOnly, async (req, res) => {
  try {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!tournament) return res.status(404).json({ message: 'Tournament not found.' });

    const players = await getRegisteredPlayers(tournament.id);
    if (players.length < 2)
      return res.status(400).json({ message: 'Need at least 2 players.' });

    // Delete existing matches if regenerating
    await supabase.from('matches').delete().eq('tournament_id', tournament.id);

    let matches;
    if (tournament.type === 'round-robin') {
      matches = await generateRoundRobin(tournament.id, players);
    } else {
      matches = await generateSingleElimination(tournament.id, players);
    }

    // Set tournament to live
    await supabase.from('tournaments').update({ status: 'live' }).eq('id', tournament.id);

    res.json({ message: 'Bracket generated.', matchCount: matches.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
