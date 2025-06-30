const axios = require('axios');

/**
 * Extracts video sources and subtitles from a MegaCloud embed URL.
 * @param {URL} url - The URL object of the MegaCloud embed page.
 * @returns {Promise<{sources: Array<{url: string, quality: string}>, subtitles: Array<{url: string, lang: string}>}>}
 */
const getMegacloudSources = async (url) => {
    try {
        // Step 1: Extract the media ID from the URL path and clean it
        const pathParts = url.pathname.split('/');
        const mediaIdWithQuery = pathParts.pop() || pathParts.pop(); // Handle trailing slashes
        
        // --- THIS IS THE FIX ---
        // Remove any query parameters from the extracted ID
        const mediaId = mediaIdWithQuery.split('?')[0];

        if (!mediaId) {
            throw new Error('Could not extract media ID from MegaCloud URL.');
        }

        // Step 2: Make a request to MegaCloud's internal API to get the sources
        // We MUST include the Referer header to mimic a browser request
        const { data } = await axios.get(`https://megacloud.tv/ajax/embed-1/getSources?id=${mediaId}`, {
            headers: {
                'Referer': url.href,
                'X-Requested-With': 'XMLHttpRequest',
            }
        });

        if (!data.sources || data.sources.length === 0) {
            throw new Error('No video sources found from MegaCloud API.');
        }

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
        // Improved error logging
        console.error(`Error extracting MegaCloud sources from URL ${url.href}:`, error.message);
        throw new Error("Failed to extract sources from MegaCloud.");
    }
};

/**
 * Extracts video sources and subtitles from a VidSrc embed URL.
 * VidSrc is an aggregator and requires multiple steps.
 * @param {URL} url - The URL object of the VidSrc embed page.
 * @returns {Promise<{sources: Array<{url: string, quality: string}>, subtitles: Array<{url: string, lang: string}>}>}
 */
const getVidSrcSources = async (url) => {
    // This function remains the same as before, but is ready for when needed.
    try {
        const { data: vidsrcHomepage } = await axios.get(url.href);
        const sourcesUrlMatch = vidsrcHomepage.match(/sources:.*?"([^"]+)"/);
        const sourcesUrl = sourcesUrlMatch ? sourcesUrlMatch[1] : null;

        if (!sourcesUrl) {
            throw new Error("Could not find the sources API URL on VidSrc page.");
        }
        
        const { data: sourcesData } = await axios.get(sourcesUrl, {
            headers: { 'Referer': url.href }
        });

        const finalSourceApiUrl = sourcesData.result ? (sourcesData.result.find(r => r.label === "1080p") || sourcesData.result[0])?.file : null;
        
        if (!finalSourceApiUrl) {
            throw new Error("Could not extract final source API URL from VidSrc.");
        }
        
        const finalResponse = await axios.get(finalSourceApiUrl, {
             maxRedirects: 0,
             validateStatus: status => status === 302 || status === 200,
        });
        
        const m3u8Url = finalResponse.headers.location || finalSourceApiUrl;
        
        return {
            sources: [{ url: m3u8Url, quality: 'auto' }],
            subtitles: []
        };

    } catch (error) {
        console.error("Error extracting VidSrc sources:", error.message);
        throw new Error("Failed to extract sources from VidSrc.");
    }
}


module.exports = { getMegacloudSources, getVidSrcSources };
