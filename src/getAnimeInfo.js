const cheerio = require('cheerio');

class AnimeHeavenInfoParser {
  constructor(html) {
    this.$ = cheerio.load(html);
    this.baseUrl = 'https://animeheaven.me/';
  }

  parse(animeId) {
    const $ = this.$;
    const title = $('.infotitle').text().trim();
    const poster_url = $('.posterimg').attr('src') || '';
    const description = $('.infodes').text().trim();
    const tags = [];

    $('.infotags a .boxitem').each((_, el) => {
      const tag = $(el).text().trim();
      if (tag) tags.push(tag);
    });

    const infoStats = $('.infoyear').text();
    const totalEpisodes = this.extractStat(infoStats, /Episodes:\s*(\d+\+?)/);
    const releaseYear = this.extractStat(infoStats, /Year:\s*([\d\-?]+)/);
    const score = this.extractStat(infoStats, /Score:\s*([\d\.\/]+)/);

    // Episodes List
    const episodes = {};
    $('.trackep0').each((_, el) => {
      const epNum = $(el).find('.watch2').first().text().trim();
      const epId = $(el).attr('id') || '';
      episodes[epNum] = {
        episode_number: epNum,
        id: epId
      };
    });

    // Related Shows – placeholder since this isn’t present in the file you sent
    const related = []; // fill this when structure is found in future

    return {
      title,
      poster_url,
      description,
      tags,
      total_episodes: totalEpisodes,
      release_year: releaseYear,
      score_rate: score,
      episodes,
      related_shows: related
    };
  }

  extractStat(text, regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
}

module.exports = AnimeHeavenInfoParser;
