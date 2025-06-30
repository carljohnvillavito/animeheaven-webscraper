const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/home/', async (req, res) => {
  try {
    const response = await axios.get('https://animeheaven.me');
    const html = response.data;

    // Optional: Load with cheerio for future parsing
    const $ = cheerio.load(html);

    // Send full HTML content as plain text
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error fetching AnimeHeaven:', error.message);
    res.status(500).json({ error: 'Failed to fetch AnimeHeaven content.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
