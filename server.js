import express from 'express';
import cors from 'cors';

// Import all controllers
import { getHomepage, getSearchResults, getAnimeInfo } from './src/controllers/main.controller.js';
import { getServers, getStream } from './src/controllers/stream.controller.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// --- API Documentation Route ---
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to the Unofficial AniWatch Scraper API!",
        routes: {
            homepage: "/home",
            search: "/search?s={query}&page={page_number}",
            anime_info: "/info?id={anime_id}",
            available_servers: "/servers?episodeId={episode_id}",
            streaming_links: "/stream?episodeId={episode_id}&type={sub|dub}&server={server_name}"
        }
    });
});

// --- Main Application Routes ---
app.get('/home', getHomepage);
app.get('/search', getSearchResults);
app.get('/info', getAnimeInfo);
app.get('/servers', getServers);
app.get('/stream', getStream);

// --- Server Initialization ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
