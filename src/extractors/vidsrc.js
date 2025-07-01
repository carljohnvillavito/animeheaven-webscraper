
import axios from "axios";

export const extractVidSrc = async (url) => {
    try {
        const { data: vidsrcHomepage } = await axios.get(url.href);
        const sourcesUrlMatch = vidsrcHomepage.match(/sources:.*?"([^"]+)"/);
        const sourcesUrl = sourcesUrlMatch ? sourcesUrlMatch[1] : null;

        if (!sourcesUrl) throw new Error("Could not find sources API URL on VidSrc page.");
        
        const { data: sourcesData } = await axios.get(sourcesUrl, { headers: { 'Referer': url.href } });
        
        const finalSourceApiUrl = sourcesData.result?.[0]?.file;
        if (!finalSourceApiUrl) throw new Error("Could not extract final source API URL from VidSrc.");

        const finalResponse = await axios.get(finalSourceApiUrl, {
             maxRedirects: 0,
             validateStatus: status => status === 302 || status === 200,
        });
        
        const m3u8Url = finalResponse.headers.location || finalSourceApiUrl;
        
        return {
            sources: [{ url: m3u8Url, quality: 'auto', isM3U8: true }],
            subtitles: []
        };
    } catch (error) {
        console.error("Error extracting VidSrc sources:", error.message);
        throw new Error("Failed to extract sources from VidSrc.");
    }
};
