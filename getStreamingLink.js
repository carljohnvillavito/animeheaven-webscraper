const axios = require('axios');
const cheerio = require('cheerio');
const { parseIdFromHref, safeParseInt, getText } = require('./utils');

const BASE_URL = 'https://aniwatchtv.to';
const AJAX_URL = `${BASE_URL}/ajax/v2`;

/**
 * Extracts the numeric anime ID from the watch page.
 * @param {cheerio.Root} $ - The Cheerio instance for the watch page.
 * @returns {string|null} The numeric ID.
 */
const getNumericId = ($) => {
    try {
        const syncData = JSON.parse($('script#syncData').html());
        return syncData.anime_id || null;
    } catch (e) {
        return null;
    }
};

/**
 * Fetches the list of all episodes for a given numeric anime ID.
 * @param {string} numericId - The internal numeric ID of the anime.
 * @returns {Promise<Array<object>>} A list of episode objects.
 */
const fetchEpisodes = async (numericId) => {
    const { data } = await axios.get(`${AJAX_URL}/episode/list/${numericId}`);
    const $$ = cheerio.load(data.html);
    const episodes = [];

    $$('.ss-list a.ssl-item').each((_, el) => {
        const item = $$(el);
        episodes.push({
            episode_id: item.data('id'),
            episode_num: item.data('number'),
            title: item.attr('title'),
            is_dub: item.find('.ssli-lang').text().trim().toLowerCase() === 'dub',
        });
    });
    return episodes;
};

/**
 * Fetches the streaming servers and their final source URLs.
 * @param {string} episodeId - The ID of the specific episode.
 * @returns {Promise<object>} An object containing SUB and DUB server links.
 */
const fetchStreamingServers = async (episodeId) => {
    const { data: serverHtmlResponse } = await axios.get(`${AJAX_URL}/episode/servers?episodeId=${episodeId}`);
    const $$$ = cheerio.load(serverHtmlResponse.html);
    
    const streamingLinks = { sub: [], dub: [] };
    const promises = [];

    $$$('.server-item').each((_, serverEl) => {
        const server = $$$(serverEl);
        const serverId = server.data('id');
        const serverType = server.data('type'); // 'sub' or 'dub'
        const serverName = server.find('a').text().trim();

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
    });
    
    await Promise.all(promises);
    return streamingLinks;
};

/**
 * Main function to scrape all streaming information for a given episode.
 * @param {string} animeId - The string ID of the anime (e.g., 'one-piece-100').
 * @param {string} episodeId - The ID of the episode to stream.
 * @returns {Promise<object>} An object with all the scraped information.
 */
const scrapeStreamingLinks = async (animeId, episodeId) => {
    if (!animeId || !episodeId) {
        throw new Error('Anime ID and Episode ID are required');
    }

    const watchUrl = `${BASE_URL}/watch/${animeId}?ep=${episodeId}`;
    const { data: mainPageHtml } = await axios.get(watchUrl);
    const $ = cheerio.load(mainPageHtml);

    const numericId = getNumericId($);
    if (!numericId) {
        throw new Error('Could not find numeric anime ID on the page.');
    }

    // Fetch all data concurrently
    const [episodes, streamingLinks, animeInfo] = await Promise.all([
        fetchEpisodes(numericId),
        fetchStreamingServers(episodeId),
        { // Scrape basic info from the page itself
            title: getText($('.anisc-detail'), 'h2.film-name a'),
            poster_url: $('.anisc-poster .film-poster-img')?.attr('src'),
            description: getText($('.anisc-detail'), '.film-description .text'),
        }
    ]);
    
    return {
        anime_info: animeInfo,
        episodes: episodes,
        streaming_links: streamingLinks,
    };
};

module.exports = { scrapeStreamingLinks };
