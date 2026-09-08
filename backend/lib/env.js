import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

console.log(`[ENV] Loading from: ${envPath}`);

const result = config({ path: envPath });

if (result.error) {
    if (result.error.code === 'ENOENT') {
        console.log('[ENV] No local .env file found. Using environment variables provided by the host.');
    } else {
        console.error('[ENV] Error loading .env:', result.error);
    }
} else {
    console.log(
        `[ENV] Loaded keys: ${Object.keys(result.parsed || {}).join(', ')}`
    );
}