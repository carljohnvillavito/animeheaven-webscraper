const express = require('express');
const cors = require('cors');
const { scrapeHomepage } = require('./src/getHome'); // Import the function

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Routes ---

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the AniWatch Scraper API!',
        routes: {
            homepage: '/home',
        },
    });
});

app.get('/home', async (req, res) => {
    try {
        // Call the imported scraping function
        const results = await scrapeHomepage();
        res.status(200).json(results);
    } catch (error) {
        console.error('Error in /home route:', error);
        res.status(500).json({
            error: 'Failed to fetch data from the source.',
            details: error.message,
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
