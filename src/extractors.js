const axios = require('axios');

/**
 * Extracts video sources and subtitles from a MegaCloud embed URL.
 * @param {URL} url - The URL object of the MegaCloud embed page.
 * @returns {Promise<{sources: Array<{url: string, quality: string}>, subtitles: Array<{url: string, lang: string}>}>}
 */
const getMegacloudSources = async (url) => {
    try {
        // Step 1: Extract the media ID from the URL path
        const mediaId = url.pathname.split('/').pop();
        if (!mediaId) {
            throw new Error('Could not extract media ID from MegaCloud URL.');
        }

        // Step 2: Make a request to MegaCloud's internal API to get the sources
        // We MUST include the Referer header to mimic a browser request
        const { data } = await axios.get(`https://megacloud.tv/ajax/embed-1/getSources?id=${mediaId}`, {
            headers: {
                'Referer': url.href, // The Referer is the embed URL itself
                'X-Requested-With': 'XMLHttpRequest',
            }
        });

        if (!data.sources || data.sources.length === 0) {
            throw new Error('No video sources found from MegaCloud API.');
        }
        
        // The sources are encrypted, but for many sites, the 'file' property is the direct link.
        // If it were more complex, we'd need a decryption step here.
        const sources = data.sources.map(s => ({
            url: s.file,
            quality: s.label,
        }));

        const subtitles = data.tracks.map(t => ({
            url: t.file,
            lang: t.label,
        })).filter(s => s.lang !== 'Thumbnails');

        return {
            sources,
            subtitles
        };

    } catch (error) {
        console.error("Error extracting MegaCloud sources:", error.message);
        throw new Error("Failed to extract sources from MegaCloud.");
    }
};

module.exports = { getMegacloudSources };
