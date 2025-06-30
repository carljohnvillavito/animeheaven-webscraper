/**
 * Extracts the anime ID from a URL path.
 * e.g., "/one-piece-100?ref=search" -> "one-piece-100"
 * @param {string | undefined} href - The URL path.
 * @returns {string | null} The extracted ID.
 */
const parseIdFromHref = (href) => {
    if (!href) return null;
    try {
        // Use a more robust regex to capture the ID before any query parameters
        const match = href.match(/\/([a-zA-Z0-9-]+)(?:\?|$)/);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
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

module.exports = {
    parseIdFromHref,
    safeParseInt,
    getText,
};
