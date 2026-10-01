import snapshot from '../data/lineup.json' with { type: 'json' };
import { handle } from './handler.js';

// Stateless by design: no storage, no logging of query strings, nothing about visitors is kept.
export default {
  async fetch(request, env) {
    try {
      return await handle(request, { snapshot, base: env?.FESTIVAL_BASE ?? 'https://ohny.org' });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Something went wrong on our side.' }), {
        status: 500, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      });
    }
  },
};
