export const parseIdFromHref = (href) => {
    if (!href) return null;
    try {
        const match = href.match(/\/([a-zA-Z0-9-]+)(?:\?|$)/);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
};

export const safeParseInt = (text) => {
    if (!text) return null;
    const number = parseInt(text.replace(/\D/g, ''), 10);
    return isNaN(number) ? null : number;
};

export const getText = (element, selector) => {
    return element.find(selector)?.text()?.trim() ?? null;
};
