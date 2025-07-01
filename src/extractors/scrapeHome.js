import axios from "axios";
import * as cheerio from "cheerio";
import { BASE_URL } from "../utils/constants.js";
import { parseIdFromHref, safeParseInt, getText } from "../utils/helpers.js";

export const scrapeHomepage = async () => {
    const { data } = await axios.get(`${BASE_URL}/home`);
    const $ = cheerio.load(data);
    const results = {};

    // Spotlight
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

    // Trending
    const trending = [];
    $('#trending-home .swiper-slide').each((_, el) => {
        const element = $(el);
        if (getText(element, '.film-title')) {
            trending.push({
                anime_id: parseIdFromHref(element.find('a.film-poster').attr('href')),
                title: getText(element, '.film-title'),
                image_url: element.find('img.film-poster-img').attr('data-src'),
            });
        }
    });
    results.trending = trending;
    
    // Featured Blocks (Top Airing, Popular, etc.)
    const scrapeFeaturedBlock = (selector) => {
        const list = [];
        $(selector).find('li').each((_, el) => {
            const element = $(el);
            if(getText(element, 'h3.film-name a')){
                list.push({
                    anime_id: parseIdFromHref(element.find('h3.film-name a').attr('href')),
                    title: getText(element, 'h3.film-name a'),
                    image_url: element.find('img.film-poster-img').attr('data-src'),
                    total_episodes: safeParseInt(getText(element, '.tick-item.tick-eps')),
                    showType: getText(element, '.fdi-item'),
                    sub: safeParseInt(getText(element, '.tick-item.tick-sub')),
                    dub: safeParseInt(getText(element, '.tick-item.tick-dub')),
                });
            }
        });
        return list;
    }
    
    // Grid Blocks (Latest, Upcoming, etc.)
    const scrapeGridBlock = (selector) => {
        const list = [];
        $(selector).find('.flw-item').each((_, el) => {
            const element = $(el);
            if(getText(element, 'h3.film-name a')){
                list.push({
                    anime_id: parseIdFromHref(element.find('a.film-poster-ahref').attr('href')),
                    title: getText(element, 'h3.film-name a'),
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

    results.topAiring = scrapeFeaturedBlock('.anif-block-01');
    results.mostPopular = scrapeFeaturedBlock('.anif-block-03');
    results.mostFavorite = scrapeFeaturedBlock('#anime-featured .anif-block-02:first');
    results.latestCompleted = scrapeFeaturedBlock('#anime-featured .anif-block-02:last');
    results.latestEpisodes = scrapeGridBlock('section:has(h2:contains("Latest Episode"))');

    const topUpcoming = [];
    $('section:has(h2:contains("Top Upcoming")) .flw-item').each((_, el) => {
        const element = $(el);
        if(getText(element, 'h3.film-name a')) {
            topUpcoming.push({
                anime_id: parseIdFromHref(element.find('a.film-poster-ahref').attr('href')),
                title: getText(element, 'h3.film-name a'),
                image_url: element.find('img.film-poster-img').attr('data-src'),
                showType: getText(element, '.fd-infor .fdi-item:first-child'),
                duration: getText(element, '.fdi-item.fdi-duration')
            });
        }
    });
    results.topUpcoming = topUpcoming;

    results.top10 = { today: [], week: [], month: [] };
    $('#top-viewed-day li').each((_, el) => results.top10.today.push({ anime_id: $(el).find('a').attr('href').split('/')[1], title: getText($(el), 'h3.film-name a') }));
    $('#top-viewed-week li').each((_, el) => results.top10.week.push({ anime_id: $(el).find('a').attr('href').split('/')[1], title: getText($(el), 'h3.film-name a') }));
    $('#top-viewed-month li').each((_, el) => results.top10.month.push({ anime_id: $(el).find('a').attr('href').split('/')[1], title: getText($(el), 'h3.film-name a') }));

    return results;
};
