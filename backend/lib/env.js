import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// This file is imported FIRST so env is populated before any other module loads.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
console.log(`[ENV] Loading from: ${envPath}`);
const result = config({ path: envPath });

if (result.error) {
    console.error(`[ENV] Error loading .env:`, result.error);
} else {
    console.log(`[ENV] Loaded keys: ${Object.keys(result.parsed || {}).join(', ')}`);
}
