const axios = require('axios');
const cheerio = require('cheerio');
const { parseIdFromHref, safeParseInt, getText } = require('./utils');

const BASE_URL = 'https://aniwatchtv.to';

/**
 * Scrapes detailed information for a specific anime.
 * @param {string} animeId - The ID of the anime (e.g., 'komi-cant-communicate-17906').
 * @returns {Promise<object>} A promise that resolves to an object with the anime's details.
 */
const scrapeAnimeInfo = async (animeId) => {
    if (!animeId) {
        throw new Error('Anime ID is required');
    }

    const url = `${BASE_URL}/${animeId}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const animeInfo = {};

    const detailContainer = $('.anisc-detail');
    const infoContainer = $('.anisc-info');

    // --- Scrape Main Details ---
    animeInfo.title = getText(detailContainer, 'h2.film-name');
    animeInfo.poster_url = $('.anisc-poster .film-poster-img')?.attr('src');
    animeInfo.description = $('.film-description .text')?.text()?.trim();

    // Helper to find specific info items by their label
    const getInfoByLabel = (label) => {
        return infoContainer.find(`.item-title:contains("${label}")`)?.find('.name')?.text()?.trim() ?? null;
    };

    animeInfo.japanese = getInfoByLabel('Japanese:');
    animeInfo.synonyms = getInfoByLabel('Synonyms:');
    animeInfo.status = getInfoByLabel('Status:');
    animeInfo.aired = getInfoByLabel('Aired:');
    animeInfo.duration = getInfoByLabel('Duration:');
    animeInfo.premiered = getInfoByLabel('Premiered:');

    // Scrape list-based info items
    animeInfo.genres = infoContainer.find('.item-list:contains("Genres:") a').map((_, el) => $(el).text().trim()).get();
    animeInfo.studios = infoContainer.find('.item-title:contains("Studios:") a').map((_, el) => $(el).text().trim()).get().join(', ');
    animeInfo.producers = infoContainer.find('.item-title:contains("Producers:") a').map((_, el) => $(el).text().trim()).get().join(', ');

    // --- Scrape More Seasons ---
    animeInfo.more_seasons = [];
    $('.block_area-seasons .os-item').each((_, el) => {
        const seasonEl = $(el);
        animeInfo.more_seasons.push({
            anime_id: parseIdFromHref(seasonEl.attr('href')),
            title: seasonEl.attr('title'),
        });
    });

    // --- Scrape Recommended For You ---
    animeInfo.recommended_for_you = [];
    $('section:has(h2:contains("Recommended for you")) .film_list-wrap .flw-item').each((_, el) => {
        const element = $(el);
        const title = getText(element, 'h3.film-name a');
        if (title) {
            animeInfo.recommended_for_you.push({
                anime_id: parseIdFromHref(element.find('a.film-poster-ahref').attr('href')),
                title: title,
                image_url: element.find('img.film-poster-img').attr('data-src'),
                total_episodes: safeParseInt(getText(element, '.tick-item.tick-eps')),
                showType: getText(element, '.fd-infor .fdi-item:first-child'),
                sub: safeParseInt(getText(element, '.tick-item.tick-sub')),
                dub: safeParseInt(getText(element, '.tick-item.tick-dub')),
                duration: getText(element, '.fdi-duration'),
            });
        }
    });

    return animeInfo;
};

module.exports = { scrapeAnimeInfo };
