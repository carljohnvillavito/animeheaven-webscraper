const axios = require('axios');

/**
 * Extracts video sources and subtitles from a MegaCloud embed URL.
 * @param {URL} url - The URL object of the MegaCloud embed page.
 * @returns {Promise<{sources: Array<{url: string, quality: string}>, subtitles: Array<{url: string, lang: string}>}>}
 */
const getMegacloudSources = async (url) => {
    try {
        const mediaId = url.pathname.split('/').pop();
        if (!mediaId) {
            throw new Error('Could not extract media ID from MegaCloud URL.');
        }

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
        console.error("Error extracting MegaCloud sources:", error.message);
        throw new Error("Failed to extract sources from MegaCloud.");
    }
};

/**
 * NEW: Extracts video sources and subtitles from a VidSrc embed URL.
 * VidSrc is an aggregator and requires multiple steps.
 * @param {URL} url - The URL object of the VidSrc embed page.
 * @returns {Promise<{sources: Array<{url: string, quality: string}>, subtitles: Array<{url: string, lang: string}>}>}
 */
const getVidSrcSources = async (url) => {
    try {
        // Step 1: Get the main VidSrc page to find its internal API endpoint
        const { data: vidsrcHomepage } = await axios.get(url.href);
        
        // Find the API URL for sources, it's usually inside a script tag
        const sourcesUrlMatch = vidsrcHomepage.match(/sources:.*?"([^"]+)"/);
        const sourcesUrl = sourcesUrlMatch ? sourcesUrlMatch[1] : null;

        if (!sourcesUrl) {
            throw new Error("Could not find the sources API URL on VidSrc page.");
        }
        
        // Step 2: Call the sources API
        const { data: sourcesData } = await axios.get(sourcesUrl, {
            headers: {
                'Referer': url.href,
            }
        });

        // Step 3: Find the actual video link from the response
        // VidSrc often provides a link to yet another API (e.g., from vidsrc.stream)
        const finalSourceApiUrl = sourcesData.result ? (sourcesData.result.find(r => r.label === "1080p") || sourcesData.result[0])?.file : null;
        
        if (!finalSourceApiUrl) {
            throw new Error("Could not extract final source API URL from VidSrc.");
        }
        
        // VidSrc's final response is usually just a redirect to the .m3u8 file
        // We can get this by making a request and checking the 'location' header of the response
        const finalResponse = await axios.get(finalSourceApiUrl, {
             maxRedirects: 0, // We want the redirect URL, not to follow it
             validateStatus: status => status === 302 || status === 200, // Accept redirects as valid
        });
        
        const m3u8Url = finalResponse.headers.location || finalSourceApiUrl;
        
        return {
            sources: [{ url: m3u8Url, quality: 'auto' }], // VidSrc often doesn't provide multiple qualities directly
            subtitles: [] // VidSrc subtitles are typically embedded in the stream
        };

    } catch (error) {
        console.error("Error extracting VidSrc sources:", error.message);
        throw new Error("Failed to extract sources from VidSrc.");
    }
}


module.exports = { getMegacloudSources, getVidSrcSources };
