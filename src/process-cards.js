import fs from 'fs/promises';
import path from 'path';
import CardParser from './card-parser.js';

function extractCards(text, cardType) {
  const cards = text
    .split('\n\n')
    .map(block => block.replace(/[\n\t]/g, ' ').trim())
    .filter(card => card.length > 0 && !card.startsWith('--'));

  const result = [];
  for (const card of cards) {
    const sentences = card.split(/(?<=[.?!])\s+/);
    for (const sentence of sentences) {
      const trimmedSentence = sentence.replace(/-- \d+ of \d+ --/, '').trim();
      if (trimmedSentence.length > 0 && !/^\d+$/.test(trimmedSentence)) {
        if (cardType === 'black' && !trimmedSentence.includes('_')) {
          continue;
        }
        result.push(trimmedSentence);
      }
    }
  }

  const uniqueCards = [...new Set(result)];

  if (cardType === 'white') {
    return uniqueCards.map(text => ({ text }));
  } else {
    return uniqueCards.map(text => ({ text, pick: 1 }));
  }
}

async function processCards(directory) {
  const files = await fs.readdir(directory);
  const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');

  let whiteCards = [];
  let blackCards = [];

  const cardParser = new CardParser();

  for (const file of pdfFiles) {
    const pdfPath = path.join(directory, file);
    const pdfBuffer = await fs.readFile(pdfPath);
    const text = await cardParser.parse(pdfBuffer);

    if (file.includes('Brancas')) {
      whiteCards = whiteCards.concat(extractCards(text, 'white'));
    } else if (file.includes('Pretas')) {
      blackCards = blackCards.concat(extractCards(text, 'black'));
    }
  }

  return { white: whiteCards, black: blackCards };
}

(async () => {
  const cards = await processCards('./');
  await fs.writeFile('cards.json', JSON.stringify(cards, null, 2));
  console.log('cards.json created successfully');
})();