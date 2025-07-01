import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL } from '../utils/constants.js';
import { parseIdFromHref, safeParseInt, getText } from '../utils/helpers.js';

export const scrapeSearchResults = async (query, page = 1) => {
    const searchUrl = new URL(`${BASE_URL}/search`);
    searchUrl.searchParams.append('keyword', query);
    if (page > 1) searchUrl.searchParams.append('page', page);
    
    const { data } = await axios.get(searchUrl.toString());
    const $ = cheerio.load(data);

    const results = [];
    $('.film_list-wrap .flw-item').each((_, el) => {
        const element = $(el);
        if (getText(element, 'h3.film-name a')) {
            results.push({
                anime_id: parseIdFromHref(element.find('a.film-poster-ahref').attr('href')),
                title: getText(element, 'h3.film-name a'),
                image_url: element.find('img.film-poster-img').attr('data-src'),
                showType: getText(element, '.fd-infor .fdi-item:first-child'),
                duration: getText(element, '.fdi-duration'),
                sub: safeParseInt(getText(element, '.tick-item.tick-sub')),
                dub: safeParseInt(getText(element, '.tick-item.tick-dub')),
            });
        }
    });

    const currentPage = parseInt($('.pre-pagination .page-item.active a').text()) || 1;
    const hasNextPage = $('.pre-pagination .page-item a[title="Next"]').length > 0;
    
    return { currentPage, hasNextPage, results };
};
