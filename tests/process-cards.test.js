import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import processCards from '../src/process-cards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('processCards', () => {
  it('should process all PDF files in a directory and return the cards', async () => {
    const pdfDirectory = path.join(__dirname, '../');
    const cards = await processCards(pdfDirectory);
    expect(cards.white).toBeDefined();
    expect(cards.black).toBeDefined();
    expect(cards.white.length).toBeGreaterThan(0);
    expect(cards.black.length).toBeGreaterThan(0);
  }, 30000);
});