// server-only!

const DEFAULT_SERVER_URL = "http://localhost:3000"; // dev
const mode = process.env.NODE_ENV;
const production = mode === 'production';

export const EXTERNAL_SERVER_URL = (production && process.env['EXTERNAL_SERVER_URL']) || DEFAULT_SERVER_URL;

console.log(`EXTERNAL_SERVER_URL = ${EXTERNAL_SERVER_URL} (NODE_ENV ${mode})`);
