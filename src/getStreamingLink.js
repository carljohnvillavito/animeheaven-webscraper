const axios = require('axios');
const cheerio = require('cheerio');
const { getText } = require('./utils'); // Only need getText now

const BASE_URL = 'https://aniwatchtv.to';
const AJAX_URL = `${BASE_URL}/ajax/v2`;

/**
 * Fetches the streaming link from a specific server for a given episode.
 * @param {string} episodeId - The ID of the episode.
 * @param {string} type - The type of stream ('sub' or 'dub').
 * @param {string} serverName - The name of the server (e.g., 'Vidstreaming', 'MegaCloud').
 * @returns {Promise<{url: string}>} A promise that resolves to an object containing the final streaming URL.
 */
const scrapeStreamingLinks = async (episodeId, type, serverName) => {
    if (!episodeId || !type || !serverName) {
        throw new Error('Episode ID, type (sub/dub), and server name are all required.');
    }

    // Step 1: Get the list of available servers for the episode
    const { data: serverHtmlResponse } = await axios.get(`${AJAX_URL}/episode/servers?episodeId=${episodeId}`);
    const $ = cheerio.load(serverHtmlResponse.html);

    // Step 2: Find the specific server ID that matches the user's request
    let targetServerId = null;
    $('.server-item').each((_, el) => {
        const serverEl = $(el);
        const currentServerType = serverEl.data('type')?.toLowerCase();
        const currentServerName = getText(serverEl, 'a')?.toLowerCase();
        
        // Match both type and name (case-insensitive)
        if (currentServerType === type.toLowerCase() && currentServerName === serverName.toLowerCase()) {
            targetServerId = serverEl.data('id');
            return false; // Break the .each loop
        }
    });

    // Step 3: If we didn't find the server, throw an error
    if (!targetServerId) {
        throw new Error(`Server '${serverName}' of type '${type}' not found for this episode. Please check available servers.`);
    }

    // Step 4: Use the found server ID to get the final streaming source link
    const { data: sourceResponse } = await axios.get(`${AJAX_URL}/episode/sources?id=${targetServerId}`);

    if (sourceResponse && sourceResponse.link) {
        return {
            url: sourceResponse.link
        };
    } else {
        throw new Error('Could not retrieve the streaming link from the selected server.');
    }
};

module.exports = { scrapeStreamingLinks };
