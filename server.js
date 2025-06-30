const express = require('express');
const axios = require('axios');
const AnimeHeavenHomeParser = require('./src/getHome');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/home/', async (req, res) => {
  try {
    // Fetch raw HTML source from animeheaven
    const response = await axios.get('https://animeheaven.me', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
      }
    });

    const html = response.data;

    // Parse metadata using your Cheerio-powered class
    const parser = new AnimeHeavenHomeParser(html);
    const data = parser.parse();

    // Return structured metadata JSON
    res.json(data);

  } catch (error) {
    console.error('[ERROR] Failed to fetch or parse:', error.message);
    res.status(500).json({ error: 'Failed to fetch or parse AnimeHeaven homepage.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}/home/`);
});
