const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/home/', async (req, res) => {
  try {
    const response = await axios.get('https://animeheaven.me', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      },
    });

    // Respond with raw HTML source content
    res.set('Content-Type', 'text/plain');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching source:', error.message);
    res.status(500).json({ error: 'Failed to fetch source HTML content.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/home/`);
});
