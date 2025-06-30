const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://aniwatchtv.to';
const AJAX_URL = `${BASE_URL}/ajax/v2`;

/**
 * Fetches the streaming servers and their final source URLs for a single episode.
 * @param {string} episodeId - The ID of the specific episode.
 * @returns {Promise<object>} An object containing SUB and DUB server links.
 */
const scrapeStreamingLinks = async (episodeId) => {
    if (!episodeId) {
        throw new Error('Episode ID is required');
    }

    const { data: serverHtmlResponse } = await axios.get(`${AJAX_URL}/episode/servers?episodeId=${episodeId}`);
    const $ = cheerio.load(serverHtmlResponse.html);
    
    const streamingLinks = { sub: [], dub: [] };
    const promises = [];

    $('.server-item').each((_, serverEl) => {
        const server = $(serverEl);
        const serverId = server.data('id');
        const serverType = server.data('type'); // 'sub' or 'dub'
        const serverName = server.find('a').text().trim();

        if (serverId && serverType) {
            const promise = axios.get(`${AJAX_URL}/episode/sources?id=${serverId}`)
                .then(({ data: sourceResponse }) => {
                    if (sourceResponse.link && streamingLinks[serverType]) {
                        streamingLinks[serverType].push({
                            server: serverName,
                            url: sourceResponse.link
                        });
                    }
                })
                .catch(err => {
                    console.error(`Failed to get source for server ID ${serverId}:`, err.message);
                });
                
            promises.push(promise);
        }
    });
    
    await Promise.all(promises);
    return { streaming_links: streamingLinks };
};

module.exports = { scrapeStreamingLinks };
