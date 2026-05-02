const router = require('express').Router();
const supabase = require('../db');
const { auth, adminOnly } = require('../middleware/auth');
const { advanceWinner } = require('../utils/bracketGenerator');

// GET /api/matches?tournament=id&status=pending
router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('matches')
      .select(`
        id, round, match_number, score1, score2, status, created_at,
        tournament_id,
        player1:player1_id (id, username, avatar),
        player2:player2_id (id, username, avatar),
        winner:winner_id (id, username),
        tournament:tournament_id (id, name, type)
      `)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true });

    if (req.query.tournament) query = query.eq('tournament_id', req.query.tournament);
    if (req.query.status) query = query.eq('status', req.query.status);

    const { data: matches, error } = await query;
    if (error) throw error;

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/matches/:id/submit — player submits score
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { score1, score2 } = req.body;

    const { data: match } = await supabase
      .from('matches')
      .select('id, player1_id, player2_id, status')
      .eq('id', req.params.id)
      .single();

    if (!match) return res.status(404).json({ message: 'Match not found.' });

    const isPlayer = [match.player1_id, match.player2_id].includes(req.user.id);
    if (!isPlayer) return res.status(403).json({ message: 'You are not in this match.' });

    const { error } = await supabase
      .from('matches')
      .update({ score1, score2, status: 'in-progress', submitted_by: req.user.id })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Score submitted. Waiting for admin approval.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/matches/:id/result — admin approves result
router.put('/:id/result', auth, adminOnly, async (req, res) => {
  try {
    const { winner, score1, score2 } = req.body;

    const { data: match } = await supabase
      .from('matches')
      .select('*, tournament:tournament_id (type)')
      .eq('id', req.params.id)
      .single();

    if (!match) return res.status(404).json({ message: 'Match not found.' });

    // Update match
    const updates = { winner_id: winner, status: 'completed' };
    if (score1 !== undefined) updates.score1 = score1;
    if (score2 !== undefined) updates.score2 = score2;

    const { error } = await supabase.from('matches').update(updates).eq('id', req.params.id);
    if (error) throw error;

    // Update winner stats (+100 pts, +1 win)
    await supabase.rpc('increment_user_stats', {
      p_user_id: winner,
      p_wins: 1,
      p_losses: 0,
      p_points: 100,
    });

    // Update loser stats (+1 loss)
    const loserId = match.player1_id === winner ? match.player2_id : match.player1_id;
    if (loserId) {
      await supabase.rpc('increment_user_stats', {
        p_user_id: loserId,
        p_wins: 0,
        p_losses: 1,
        p_points: 0,
      });
    }

    // Advance winner in single elimination bracket
    if (match.tournament?.type === 'single-elimination') {
      await advanceWinner(match.tournament_id, match.round, match.match_number, winner);
    }

    res.json({ message: 'Result approved.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
