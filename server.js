const express = require('express');
const axios = require('axios');
const AnimeHeavenHomeParser = require('./src/getHome');
const AnimeHeavenInfoParser = require('./src/getAnimeInfo');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/home/', async (req, res) => {
  try {
    const response = await axios.get('https://animeheaven.me', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const parser = new AnimeHeavenHomeParser(response.data);
    const data = parser.parse();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch homepage content.' });
  }
});

app.get('/info', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing anime_id in query.' });

  try {
    const url = `https://animeheaven.me/anime.php?${id}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const parser = new AnimeHeavenInfoParser(response.data);
    const animeData = parser.parse(id);
    res.json(animeData);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch anime info.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
