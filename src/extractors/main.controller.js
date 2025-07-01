import { scrapeHomepage } from "../extractors/scrapeHome.js";
import { scrapeSearchResults } from "../extractors/scrapeSearch.js";
import { scrapeAnimeInfo } from "../extractors/scrapeAnimeInfo.js";

export const getHomepage = async (req, res) => {
    try {
        const data = await scrapeHomepage();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSearchResults = async (req, res) => {
    try {
        const { s: query, page } = req.query;
        if (!query) return res.status(400).json({ error: 'Search query (s) is required.' });
        
        const data = await scrapeSearchResults(query, page);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAnimeInfo = async (req, res) => {
    try {
        const { id: animeId } = req.query;
        if (!animeId) return res.status(400).json({ error: 'Anime ID (id) is required.' });

        const data = await scrapeAnimeInfo(animeId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
