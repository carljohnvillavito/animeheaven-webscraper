import axios from "axios";

export const extractMegacloud = async (url) => {
    try {
        const pathParts = url.pathname.split('/');
        const mediaIdWithQuery = pathParts.pop() || pathParts.pop();
        const mediaId = mediaIdWithQuery.split('?')[0];

        if (!mediaId) throw new Error('Could not extract media ID from MegaCloud URL.');

        const { data } = await axios.get(`https://megacloud.tv/ajax/embed-1/getSources?id=${mediaId}`, {
            headers: {
                'Referer': url.href,
                'X-Requested-With': 'XMLHttpRequest',
            }
        });

        if (!data.sources) throw new Error('No video sources found from MegaCloud API.');

        return {
            sources: data.sources.map(s => ({ url: s.file, quality: s.label, isM3U8: s.file.includes('.m3u8') })),
            subtitles: data.tracks.filter(t => t.kind === 'captions').map(t => ({ url: t.file, lang: t.label }))
        };
    } catch (error) {
        console.error(`Error extracting MegaCloud sources from URL ${url.href}:`, error.message);
        throw new Error("Failed to extract sources from MegaCloud.");
    }
};
