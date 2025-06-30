const express = require('express');
const cors = require('cors');
const { scrapeHomepage } = require('./src/getHome');
const { scrapeSearchResults } = require('./src/search');
const { scrapeAnimeInfo } = require('./src/getAnimeInfo');
const { scrapeStreamingLinks } = require('./src/getStreamingLink');

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
            // Updated stream route documentation
            stream: '/stream?episodeId={episode_id}&type={sub|dub}&server={server_name}',
        },
    });
});

// home, search, and info routes remain the same
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


// Updated /stream route
app.get('/stream', async (req, res) => {
    try {
        const { episodeId, type, server } = req.query;

        if (!episodeId || !type || !server) {
            return res.status(400).json({ 
                error: 'episodeId, type, and server query parameters are all required.' 
            });
        }

        const results = await scrapeStreamingLinks(episodeId, type, server);
        res.status(200).json(results);

    } catch (error) {
        console.error(`Error in /stream route:`, error);
        // Provide more specific error feedback to the client
        if (error.message.includes('not found')) {
            res.status(404).json({
                error: error.message
            });
        } else {
            res.status(500).json({
                error: 'Failed to fetch streaming link from the source.',
                details: error.message,
            });
        }
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
