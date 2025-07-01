import axios from "axios";
import * as cheerio from "cheerio";
import { BASE_URL } from "../utils/constants.js";
import { parseIdFromHref, safeParseInt, getText } from "../utils/helpers.js";

export const scrapeHomepage = async () => {
    const { data } = await axios.get(`${BASE_URL}/home`);
    const $ = cheerio.load(data);
    const results = {};

    // Spotlight
    results.spotlight = [];
    $('#slider .swiper-slide').each((_, el) => {
        const element = $(el);
        const title = getText(element, '.desi-head-title');
        if (title) {
            results.spotlight.push({
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

    // Other sections can be added here following the same pattern...

    return results;
};
