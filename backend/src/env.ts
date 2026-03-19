import dotenv from 'dotenv';
import path from 'path';

// Must be the first module imported so env vars are available to all other modules
dotenv.config({ path: path.resolve(__dirname, '../.env') });
