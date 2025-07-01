import { fetchServers, fetchStreamingLinks } from '../extractors/streamExtractor.js';

// Controller to get available servers
export const getServers = async (req, res) => {
    try {
        const { episodeId } = req.query;
        if (!episodeId) {
            return res.status(400).json({ error: 'episodeId query parameter is required.' });
        }
        const servers = await fetchServers(episodeId);
        res.status(200).json(servers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Controller to get the final streaming links
export const getStream = async (req, res) => {
    try {
        const { episodeId, type, server } = req.query;
        if (!episodeId || !type || !server) {
            return res.status(400).json({ error: 'episodeId, type, and server query parameters are all required.' });
        }
        const streamingLinks = await fetchStreamingLinks(episodeId, server, type);
        res.status(200).json(streamingLinks);
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
};
