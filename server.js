const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const BASE_URL = 'https://aniwatchtv.to';

// --- Helper Functions ---

/**
 * Extracts the anime ID from a URL path.
 * e.g., "/one-piece-100?ref=search" -> "one-piece-100"
 * @param {string | undefined} href - The URL path.
 * @returns {string | null} The extracted ID.
 */
const parseIdFromHref = (href) => {
    return href?.split('/')?.pop()?.split('?')[0] ?? null;
};

/**
 * Safely parses an integer from a string, removing non-digit characters.
 * @param {string | undefined} text - The text to parse.
 * @returns {number | null} The parsed number or null.
 */
const safeParseInt = (text) => {
    if (!text) return null;
    const number = parseInt(text.replace(/\D/g, ''), 10);
    return isNaN(number) ? null : number;
};

/**
 * Gets and trims the text content of an element found by a selector.
 * @param {cheerio.Cheerio<any>} element - The parent Cheerio element.
 * @param {string} selector - The selector to find the child element.
 * @returns {string | null} The trimmed text or null.
 */
const getText = (element, selector) => {
    return element.find(selector)?.text()?.trim() ?? null;
};


// --- Routes ---

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the AniWatch Scraper API!',
        routes: {
            homepage: '/home',
        },
    });
});

app.get('/home', async (req, res) => {
    try {
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

        res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching homepage:', error);
        res.status(500).json({
            error: 'Failed to fetch data from the source.',
            details: error.message,
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
