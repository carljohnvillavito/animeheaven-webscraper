const axios = require('axios');
const cheerio = require('cheerio');
// Import helpers from the new utils file
const { parseIdFromHref, safeParseInt, getText } = require('./utils');

const BASE_URL = 'https://aniwatchtv.to';

const scrapeHomepage = async () => {
    const { data } = await axios.get(`${BASE_URL}/home`);
    const $ = cheerio.load(data);

    const results = {};

    // 1. Spotlight Lists
    const spotlight = [];
    $('#slider .swiper-slide').each((_, el) => {
        const element = $(el);
        const title = getText(element, '.desi-head-title');
        if (title) {
            spotlight.push({
                anime_id: parseIdFromHref(element.find('.desi-buttons a:first-child').attr('href')),
                title: title,
                image_url: element.find('img.film-poster-img').attr('data-src'),
                total_episodes: safeParseInt(getText(element, '.tick-item.tick-eps')),
                showType: element.find('.scd-item').eq(0).text().replace(/\s+/g, ' ').trim(),
                sub: safeParseInt(getText(element, '.tick-item.tick-sub')),
                dub: safeParseInt(getText(element, '.tick-item.tick-dub')),
                duration: element.find('.scd-item').eq(1).text().trim(),
            });
        }
    });
    results.spotlight = spotlight;

    // 2. Trending Lists
    const trending = [];
    $('#trending-home .swiper-slide').each((_, el) => {
        const element = $(el);
        const title = getText(element, '.film-title');
        if(title) {
            trending.push({
                anime_id: parseIdFromHref(element.find('a.film-poster').attr('href')),
                title: title,
                image_url: element.find('img.film-poster-img').attr('data-src'),
                total_episodes: null,
                showType: null,
                sub: null,
                dub: null,
                duration: null
            });
        }
    });
    results.trending = trending;
    
    // Helper function for the "featured" blocks (Top Airing, Popular, etc.)
    const scrapeFeaturedBlock = (selector) => {
        const list = [];
        $(selector).find('li').each((_, el) => {
            const element = $(el);
            const title = getText(element, 'h3.film-name a');
            if(title){
                list.push({
                    anime_id: parseIdFromHref(element.find('h3.film-name a').attr('href')),
                    title: title,
                    image_url: element.find('img.film-poster-img').attr('data-src'),
                    total_episodes: safeParseInt(getText(element, '.tick-item.tick-eps')),
                    showType: getText(element, '.fdi-item'),
                    sub: safeParseInt(getText(element, '.tick-item.tick-sub')),
                    dub: safeParseInt(getText(element, '.tick-item.tick-dub')),
                    duration: null
                });
            }
        });
        return list;
    }

    // 3. Top Airing Lists
    results.topAiring = scrapeFeaturedBlock('.anif-block-01');

    // 4. Most Popular Lists
    results.mostPopular = scrapeFeaturedBlock('.anif-block-03');

    // 5. Most Favorite Lists
    results.mostFavorite = scrapeFeaturedBlock('#anime-featured .anif-block-02:first');

    // 6. Latest Completed Lists
    results.latestCompleted = scrapeFeaturedBlock('#anime-featured .anif-block-02:last');
    
    // Helper function for the grid-style blocks (Latest, Upcoming, etc.)
    const scrapeGridBlock = (selector) => {
        const list = [];
        $(selector).find('.flw-item').each((_, el) => {
            const element = $(el);
            const title = getText(element, 'h3.film-name a');
            if(title){
                list.push({
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
        return list;
    }

    // 7. Latest Episodes Lists
    results.latestEpisodes = scrapeGridBlock('section:has(h2:contains("Latest Episode"))');

    // 8. Top Upcoming Lists
    const topUpcoming = [];
     $('section:has(h2:contains("Top Upcoming")) .flw-item').each((_, el) => {
        const element = $(el);
         const title = getText(element, 'h3.film-name a');
         if(title) {
             topUpcoming.push({
                anime_id: parseIdFromHref(element.find('a.film-poster-ahref').attr('href')),
                title: title,
                image_url: element.find('img.film-poster-img').attr('data-src'),
                total_episodes: null,
                showType: getText(element, '.fd-infor .fdi-item:first-child'),
                sub: null,
                dub: null,
                duration: getText(element, '.fdi-item.fdi-duration') // This contains the release date
             });
         }
    });
    results.topUpcoming = topUpcoming;

    // 9. Top 10 Lists (Today)
    const top10 = [];
    $('#top-viewed-day li').each((_, el) => {
        const element = $(el);
        const title = getText(element, 'h3.film-name a');
        if(title) {
             top10.push({
                anime_id: parseIdFromHref(element.find('h3.film-name a').attr('href')),
                title: title,
                image_url: element.find('img.film-poster-img').attr('data-src'),
                total_episodes: safeParseInt(getText(element, '.tick-item.tick-eps')),
                showType: null, // Not available in this section's HTML
                sub: safeParseInt(getText(element, '.tick-item.tick-sub')),
                dub: safeParseInt(getText(element, '.tick-item.tick-dub')),
                duration: null
            });
        }
    });
    results.top10 = top10;

    return results;
};


module.exports = { scrapeHomepage };
