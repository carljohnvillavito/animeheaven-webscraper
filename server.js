const express = require('express');
const cors = require('cors');
const { scrapeHomepage } = require('./src/getHome');
const { scrapeSearchResults } = require('./src/search');
const { scrapeAnimeInfo } = require('./src/getAnimeInfo');
const { scrapeStreamingLinks } = require('./src/getStreamingLink'); // Import the new function

const app = express();
const PORT = process.env.PORT || 8080;

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
            anime_info: '/info?id={anime_id}',
            stream: '/stream/{anime_id}?episodeId={episode_id}', // Add new route to docs
        },
    });
});

// ... (home, search, info routes remain the same) ...
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

app.get('/info', async (req, res) => {
    try {
        const animeId = req.query.id;
        if (!animeId) {
            return res.status(400).json({ error: 'Anime ID (id) is required.' });
        }
        
        const results = await scrapeAnimeInfo(animeId);
        res.status(200).json(results);
    } catch (error) {
        console.error(`Error in /info route for id "${req.query.id}":`, error);
        res.status(500).json({
            error: 'Failed to fetch anime info from the source.',
            details: error.message,
        });
    }
});

// Add the new /stream route
app.get('/stream/:anime_id', async (req, res) => {
    try {
        const animeId = req.params.anime_id;
        const episodeId = req.query.episodeId;

        if (!animeId || !episodeId) {
            return res.status(400).json({ error: 'Anime ID (as a route parameter) and episodeId (as a query parameter) are required.' });
        }

        const results = await scrapeStreamingLinks(animeId, episodeId);
        res.status(200).json(results);

    } catch (error) {
        console.error(`Error in /stream route for anime "${req.params.anime_id}" and episode "${req.query.episodeId}":`, error);
        res.status(500).json({
            error: 'Failed to fetch streaming links from the source.',
            details: error.message,
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
