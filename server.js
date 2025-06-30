const express = require('express');
const cors = require('cors');
const { scrapeHomepage } = require('./src/getHome');
const { scrapeSearchResults } = require('./src/search'); // Import the search function

const app = express();
const PORT = process.env.PORT || 8080; // Changed port to avoid conflicts with common dev ports

// Middleware
app.use(cors());
app.use(express.json());

// --- Routes ---

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the AniWatch Scraper API!',
        routes: {
            homepage: '/home',
            search: '/search?s={query}&page={page_number}',
        },
    });
});

app.get('/home', async (req, res) => {
    try {
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

// Add the new search route
app.get('/search', async (req, res) => {
    try {
        const query = req.query.s;
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;

        if (!query) {
            return res.status(400).json({ error: 'Search query (s) is required.' });
        }

        const results = await scrapeSearchResults(query, page);
        res.status(200).json(results);
    } catch (error) {
        console.error(`Error in /search route for query "${req.query.s}":`, error);
        res.status(500).json({
            error: 'Failed to fetch search results from the source.',
            details: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
