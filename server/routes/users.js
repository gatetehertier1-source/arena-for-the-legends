const router = require('express').Router();
const supabase = require('../db');
const { auth } = require('../middleware/auth');

// GET /api/users/me/tournaments
router.get('/me/tournaments', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('tournaments(id, name, game, type, status, prize_pool, start_date)')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json((data || []).map(r => r.tournaments));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me
router.put('/me', auth, async (req, res) => {
  try {
    const allowed = ['bio', 'favorite_game'];
    const updates = {};
    // Accept camelCase from frontend too
    if (req.body.favoriteGame !== undefined) updates.favorite_game = req.body.favoriteGame;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    Object.keys(req.body).forEach(k => { if (allowed.includes(k)) updates[k] = req.body[k]; });

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, username, email, role, avatar, bio, favorite_game, wins, losses, points')
      .single();

    if (error) throw error;
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/me/avatar — upload to Supabase Storage
router.post('/me/avatar', auth, async (req, res) => {
  try {
    // Expect base64 body: { base64: "...", mimeType: "image/jpeg" }
    const { base64, mimeType } = req.body;
    if (!base64) return res.status(400).json({ message: 'No image data.' });

    const buffer = Buffer.from(base64, 'base64');
    const ext = mimeType?.split('/')[1] || 'jpg';
    const fileName = `avatar-${req.user.id}.${ext}`;
    const bucket = process.env.SUPABASE_AVATAR_BUCKET || 'avatars';

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const avatarUrl = urlData.publicUrl;

    await supabase.from('users').update({ avatar: avatarUrl }).eq('id', req.user.id);

    res.json({ avatar: avatarUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Leaderboard ───────────────────────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar, favorite_game, wins, losses, points')
      .eq('role', 'player')
      .order('points', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Platform stats ────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [
      { count: players },
      { data: tournaments },
      { count: matches },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'player'),
      supabase.from('tournaments').select('prize_pool'),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
    ]);

    const prize = (tournaments || []).reduce((s, t) => s + (t.prize_pool || 0), 0);

    res.json({
      players: players || 0,
      tournaments: (tournaments || []).length,
      prize,
      matches: matches || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
