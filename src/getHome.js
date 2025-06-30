const cheerio = require('cheerio');

class AnimeHeavenHomeParser {
  constructor(html) {
    this.$ = cheerio.load(html);
    this.baseUrl = 'https://animeheaven.me/';
  }

  parse() {
    return {
      'Subbed Anime Schedule': this.parseCharts('Subbed Anime Schedule'),
      'See More Releases': this.parseSeeMore(),
      'Popular': this.parsePopular()
    };
  }

  parseCharts(sectionName) {
    const $ = this.$;
    const result = [];

    $('.chart').each((i, elem) => {
      const anchor = $(elem).find('a').first();
      const animeHref = anchor.attr('href');
      const animeId = this.extractAnimeId(animeHref);

      const imageSrc = $(elem).find('img.coverimg').attr('src');
      const fullImage = imageSrc?.startsWith('http') ? imageSrc : this.baseUrl + imageSrc;

      const title = $(elem).find('.charttitle a').text().trim();
      const titlejp = $(elem).find('.charttitlejp').text().trim();
      const totalEpisodes = parseInt($(elem).find('.chartepm').text().trim()) || 0;

      result.push({
        anime_id: animeId,
        title,
        titlejp,
        image: fullImage,
        total_episodes: totalEpisodes
      });
    });

    return result;
  }

  parseSeeMore() {
    // Same structure as Subbed Anime Schedule – relies on position
    return this.parseCharts('See More Releases');
  }

  parsePopular() {
    const $ = this.$;
    const result = [];

    $('.popularbox2').each((i, elem) => {
      const anchor = $(elem).find('a');
      const href = anchor.attr('href');
      const animeId = this.extractAnimeId(href);

      const img = anchor.find('img');
      const title = img.attr('alt')?.trim();
      const image = img.attr('src');
      const fullImage = image?.startsWith('http') ? image : this.baseUrl + image;

      result.push({
        anime_id: animeId,
        title: title || '',
        titlejp: '',
        image: fullImage,
        total_episodes: 0 // not available in the popular section
      });
    });

    return result;
  }

  extractAnimeId(href) {
    if (!href) return null;
    const match = href.match(/anime\.php\?([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }
}

module.exports = AnimeHeavenHomeParser;
