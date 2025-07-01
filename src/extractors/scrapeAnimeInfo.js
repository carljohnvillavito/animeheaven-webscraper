import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, AJAX_URL } from '../utils/constants.js';
import { parseIdFromHref, getText } from '../utils/helpers.js';

export const scrapeAnimeInfo = async (animeId) => {
    const url = `${BASE_URL}/${animeId}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const animeInfo = {};
    const detailContainer = $('.anisc-detail');
    const infoContainer = $('.anisc-info');

    animeInfo.title = getText(detailContainer, 'h2.film-name');
    animeInfo.poster_url = $('.anisc-poster .film-poster-img')?.attr('src');
    animeInfo.description = $('.film-description .text')?.text()?.trim();
    
    const getInfoByLabel = (label) => infoContainer.find(`.item-title:contains("${label}")`)?.find('.name')?.text()?.trim() ?? null;
    
    animeInfo.japanese = getInfoByLabel('Japanese:');
    animeInfo.synonyms = getInfoByLabel('Synonyms:');
    animeInfo.aired = getInfoByLabel('Aired:');
    animeInfo.premiered = getInfoByLabel('Premiered:');
    animeInfo.duration = getInfoByLabel('Duration:');
    animeInfo.status = getInfoByLabel('Status:');

    animeInfo.genres = infoContainer.find('.item-list:contains("Genres:") a').map((_, el) => $(el).text().trim()).get();
    animeInfo.studios = infoContainer.find('.item-title:contains("Studios:") a').map((_, el) => $(el).text().trim()).get().join(', ');
    animeInfo.producers = infoContainer.find('.item-title:contains("Producers:") a').map((_, el) => $(el).text().trim()).get().join(', ');

    let numericId = null;
    try {
        numericId = JSON.parse($('script#syncData').html())?.anime_id;
    } catch (e) {
        console.warn("Could not parse syncData to get numeric ID for episodes.");
    }

    if (numericId) {
        try {
            const { data: episodeData } = await axios.get(`${AJAX_URL}/episode/list/${numericId}`);
            const $$ = cheerio.load(episodeData.html);
            animeInfo.episodes = [];
            $$('.ss-list a.ssl-item').each((_, el) => {
                const item = $$(el);
                animeInfo.episodes.push({
                    episode_id: item.data('id'),
                    episode_num: item.data('number'),
                    title: item.attr('title'),
                    is_dub: item.find('.ssli-lang').text().trim().toLowerCase() === 'dub',
                });
            });
        } catch (err) {
            console.warn(`Failed to fetch episode list for animeId ${animeId}: ${err.message}`);
        }
    }

    return animeInfo;
};
