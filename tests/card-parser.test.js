import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CardParser from '../src/card-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CardParser', () => {
  it('should parse a PDF file and extract the text', async () => {
    const pdfPath = path.join(__dirname, '../CAH_Portuguese_BR_ByNeto.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const cardParser = new CardParser();
    const text = await cardParser.parse(pdfBuffer);
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
  });
});