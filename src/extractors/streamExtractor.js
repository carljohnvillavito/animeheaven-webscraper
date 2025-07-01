import axios from "axios";
import * as cheerio from "cheerio";
import { AJAX_URL } from "../utils/constants.js";
import { getText } from "../utils/helpers.js";
import { extractMegacloud } from "./megacloud.js";
import { extractVidSrc } from "./vidsrc.js";

// Fetches the list of servers for an episode
export const fetchServers = async (episodeId) => {
    try {
        const { data } = await axios.get(`${AJAX_URL}/episode/servers?episodeId=${episodeId}`);
        const $ = cheerio.load(data.html);
        
        const servers = { sub: [], dub: [] };
        $('.server-item').each((_, el) => {
            const serverEl = $(el);
            const serverName = getText(serverEl, 'a');
            const type = serverEl.data('type')?.toLowerCase();
            if (serverName && type && servers[type]) {
                servers[type].push(serverName);
            }
        });
        return servers;
    } catch (error) {
        console.error(`Error fetching servers for episode ${episodeId}:`, error);
        throw new Error("Could not fetch server list.");
    }
};

// Fetches the final streaming links and tracks
export const fetchStreamingLinks = async (episodeId, server, type) => {
    try {
        const { data: serverHtml } = await axios.get(`${AJAX_URL}/episode/servers?episodeId=${episodeId}`);
        const $ = cheerio.load(serverHtml.html);

        let targetServerId = null;
        $('.server-item').each((_, el) => {
            const serverEl = $(el);
            if (
                serverEl.data('type') === type &&
                getText(serverEl, 'a').toLowerCase() === server.toLowerCase()
            ) {
                targetServerId = serverEl.data('id');
                return false;
            }
        });

        if (!targetServerId) {
            throw new Error(`Server '${server}' of type '${type}' not found.`);
        }

        const { data: sourceData } = await axios.get(`${AJAX_URL}/episode/sources?id=${targetServerId}`);
        const embedUrl = new URL(sourceData.link);

        // Route to the correct specific extractor
        if (embedUrl.hostname.includes('megacloud')) {
            return await extractMegacloud(embedUrl);
        } else if (embedUrl.hostname.includes('vidsrc')) {
            return await extractVidSrc(embedUrl);
        }
        // Add other extractors here (e.g., for T-Cloud if needed)

        throw new Error(`No extractor available for server: ${server}`);

    } catch (error) {
        console.error("An error occurred during link extraction:", error);
        throw error; // Re-throw the error to be handled by the controller
    }
};
