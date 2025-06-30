const axios = require('axios');
const cheerio = require('cheerio');
const { getText } = require('./utils');
// Import our new extractor
const { getMegacloudSources } = require('./extractors');

const BASE_URL = 'https://aniwatchtv.to';
const AJAX_URL = `${BASE_URL}/ajax/v2`;

const scrapeStreamingLinks = async (episodeId, type, serverName) => {
    if (!episodeId || !type || !serverName) {
        throw new Error('Episode ID, type (sub/dub), and server name are all required.');
    }

    // Step 1: Get the list of available servers for the episode
    const { data: serverHtmlResponse } = await axios.get(`${AJAX_URL}/episode/servers?episodeId=${episodeId}`);
    const $ = cheerio.load(serverHtmlResponse.html);

    // Step 2: Find the specific server ID
    let targetServerId = null;
    $('.server-item').each((_, el) => {
        const serverEl = $(el);
        const currentServerType = serverEl.data('type')?.toLowerCase();
        const currentServerName = getText(serverEl, 'a')?.toLowerCase();
        
        if (currentServerType === type.toLowerCase() && currentServerName.includes(serverName.toLowerCase())) {
            targetServerId = serverEl.data('id');
            return false;
        }
    });

    if (!targetServerId) {
        throw new Error(`Server '${serverName}' of type '${type}' not found for this episode.`);
    }

    // Step 3: Get the iframe/embed URL
    const { data: sourceResponse } = await axios.get(`${AJAX_URL}/episode/sources?id=${targetServerId}`);

    if (!sourceResponse || !sourceResponse.link) {
        throw new Error('Could not retrieve the embed link from Aniwatch.');
    }
    
    const embedUrl = new URL(sourceResponse.link);

    // Step 4: Use the correct extractor based on the embed URL domain
    if (embedUrl.hostname.includes('megacloud')) {
        return await getMegacloudSources(embedUrl);
    } 
    // You would add other extractors here, e.g., for Vidstreaming
    // else if (embedUrl.hostname.includes('vidstreaming')) {
    //     return await getVidstreamingSources(embedUrl);
    // } 
    else {
        // As a fallback, return the embed URL if we don't have a dedicated extractor
        console.warn(`No extractor found for ${embedUrl.hostname}. Returning embed URL.`);
        return {
            unsupported_embed_url: embedUrl.href,
            message: "This video host is not fully supported yet. Direct video links could not be extracted."
        };
    }
};

module.exports = { scrapeStreamingLinks };
