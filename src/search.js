const axios = require('axios');
const cheerio = require('cheerio');
const { parseIdFromHref, safeParseInt, getText } = require('./utils');

const BASE_URL = 'https://aniwatchtv.to';

const scrapeSearchResults = async (query, page = 1) => {
    // Construct the search URL with the query and page number
    const searchUrl = new URL(`${BASE_URL}/search`);
    searchUrl.searchParams.append('keyword', query);
    if (page > 1) {
        searchUrl.searchParams.append('page', page);
    }
    
    const { data } = await axios.get(searchUrl.toString());
    const $ = cheerio.load(data);

    const results = [];
    
    $('.film_list-wrap .flw-item').each((_, el) => {
        const element = $(el);
        const title = getText(element, 'h3.film-name a');
        if (title) {
            results.push({
                anime_id: parseIdFromHref(element.find('a.film-poster-ahref').attr('href')),
                title: title,
                image_url: element.find('img.film-poster-img').attr('data-src'),
                total_episodes: safeParseInt(getText(element, '.tick-item.tick-eps')),
                showType: getText(element, '.fd-infor .fdi-item:first-child'),
                sub: safeParseInt(getText(element, '.tick-item.tick-sub')),
                dub: safeParseInt(getText(element, '.tick-item.tick-dub')),
                duration: getText(element, '.fdi-duration')
            });
        }
    });

    // Pagination info
    const currentPage = parseInt($('.pre-pagination .page-item.active a').text()) || 1;
    const hasNextPage = $('.pre-pagination .page-item a[title="Next"]').length > 0;
    
    const lastPageLink = $('.pre-pagination .page-item a').not('[title="Next"]').last().text();
    const totalPages = parseInt(lastPageLink) || currentPage;

    return {
        currentPage,
        hasNextPage,
        totalPages,
        results
    };
};

module.exports = { scrapeSearchResults };
