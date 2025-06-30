const express = require('express');
const axios = require('axios');
const AniwatchHomeParser = require('./src/getHome');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/home', async (req, res) => {
  try {
    const response = await axios.get('https://aniwatchtv.to', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const parser = new AniwatchHomeParser(response.data);
    const data = parser.parse();

    res.json(data);
  } catch (error) {
    console.error('Failed to fetch homepage:', error.message);
    res.status(500).json({ error: 'Failed to scrape homepage.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
