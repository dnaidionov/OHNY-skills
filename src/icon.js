import { OHNY_LOGO_SVG } from './brand.js';

// Connector / favicon artwork: the OHNY logo on a light rounded square. The mark is taken from brand.js.
// TODO: replace with the official OHNY icon file once permission to use it is confirmed.
const inner = OHNY_LOGO_SVG
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>$/, '')
  .replace(/currentColor/g, '#14141a');

export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#fafaf7"/><g transform="translate(14.5 14) scale(0.99)">${inner}</g></svg>`;
