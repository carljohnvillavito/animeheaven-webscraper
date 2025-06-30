const cheerio = require('cheerio');

class AniwatchHomeParser {
  constructor(html) {
    this.$ = cheerio.load(html);
    this.baseUrl = 'https://aniwatchtv.to';
  }

  parse() {
    return {
      'Spotlight Lists': this.parseSpotlight(),
      'Trending Lists': this.parseGroup('.block_area-trending'),
      'Top Airing Lists': this.parseGroup('.block_area-airing'),
      'Most Popular Lists': this.parseGroup('.block_area-realtime'),
      'Most Favorite Lists': this.parseGroup('.block_area-favorite'),
      'Latest Complete Lists': this.parseGroup('.block_area-ongoing'),
      'Latest Episodes Lists': this.parseGroup('.block_area-update'),
      'Top Upcoming Lists': this.parseGroup('.block_area-upcoming'),
      'Top 10 Lists': this.parseGroup('.block_area-top') // Assumes .block_area-top exists
    };
  }

  parseSpotlight() {
    const $ = this.$;
    const list = [];

    $('#slide a').each((_, el) => {
      const element = $(el);
      const href = element.attr('href') || '';
      const idMatch = href.match(/anime\.php\?([a-zA-Z0-9]+)/) || href.match(/-(\d+)$/);
      const anime_id = idMatch ? idMatch[1] : null;
      const image = element.find('img').attr('src') || '';
      const title = element.find('img').attr('alt') || '';

      if (anime_id) {
        list.push({
          anime_id,
          title,
          titlejp: '',
          image: image.startsWith('http') ? image : this.baseUrl + '/' + image,
          total_episodes: 'N/A'
        });
      }
    });

    return list;
  }

  parseGroup(selector) {
    const $ = this.$;
    const list = [];

    $(`${selector} .film-poster`).each((_, el) => {
      const parent = $(el).parent();
      const id = $(el).find('a.item-qtip').attr('data-id');
      const title = parent.find('.film-name a').attr('title')?.trim() || '';
      const titlejp = parent.find('.film-name a').attr('data-jname')?.trim() || '';
      const image = $(el).find('img').attr('data-src') || '';
      const episodes = $(el).find('.tick-eps').text().trim() || '0';

      if (id && title) {
        list.push({
          anime_id: id,
          title,
          titlejp,
          image: image.startsWith('http') ? image : this.baseUrl + '/' + image,
          total_episodes: episodes
        });
      }
    });

    return list;
  }
}

module.exports = AniwatchHomeParser;
