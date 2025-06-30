const axios = require('axios');
const cheerio = require('cheerio');
const { getText } = require('./utils');

const BASE_URL = 'https://aniwatchtv.to';
const AJAX_URL = `${BASE_URL}/ajax/v2`;

/**
 * Scrapes the available streaming servers for a given episode.
 * @param {string} episodeId - The ID of the episode.
 * @returns {Promise<{sub: Array<{server_name: string}>, dub: Array<{server_name: string}>}>}
 */
const scrapeAvailableServers = async (episodeId) => {
    if (!episodeId) {
        throw new Error('Episode ID is required.');
    }

    const { data } = await axios.get(`${AJAX_URL}/episode/servers?episodeId=${episodeId}`);
    const $ = cheerio.load(data.html);

    const servers = {
        sub: [],
        dub: []
    };

    $('.server-item').each((_, el) => {
        const serverEl = $(el);
        const serverName = getText(serverEl, 'a');
        const type = serverEl.data('type')?.toLowerCase();

        if (serverName && type && (type === 'sub' || type === 'dub')) {
            // Avoid adding duplicates
            if (!servers[type].some(s => s.server_name === serverName)) {
                servers[type].push({ server_name: serverName });
            }
        }
    });

    return servers;
};

module.exports = { scrapeAvailableServers };
