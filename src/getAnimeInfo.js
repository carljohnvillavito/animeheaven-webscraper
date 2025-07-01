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

    // ... you can add more sections like 'more_seasons' or 'recommended' here if needed.

    return animeInfo;
};
