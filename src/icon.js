import { OHNY_LOGO_SVG } from './brand.js';

// Connector / favicon artwork: the OHNY logo on a light rounded square. The mark is taken from brand.js.
// TODO: replace with the official OHNY icon file once permission to use it is confirmed.
const inner = OHNY_LOGO_SVG
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>$/, '')
  .replace(/currentColor/g, '#14141a');

export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#fafaf7"/><g transform="translate(14.5 14) scale(0.99)">${inner}</g></svg>`;

// Wide share image (1200x630, the size link-preview cards use) so LinkedIn and others don't crop the square icon.
export const OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#fafaf7"/><g transform="translate(110 115) scale(3.4)">${inner}</g><text x="520" y="285" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="76" font-weight="700" fill="#14141a">Ask OHNY</text><text x="520" y="350" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34" fill="#585b64">Your pocket guide to Open House</text><text x="520" y="396" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34" fill="#585b64">New York Weekend, Oct 16-18</text><text x="520" y="460" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="26" fill="#585b64">Unofficial. Not affiliated with OHNY.</text></svg>`;
