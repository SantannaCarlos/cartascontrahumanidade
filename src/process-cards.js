const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfDirectory = 'C:\\Users\\chsan\\Downloads\\Nova pasta\\';

async function processPdfs() {
    const files = fs.readdirSync(pdfDirectory).filter(file => file.endsWith('.pdf'));
    let whiteCards = [];
    let blackCards = [];

    for (const file of files) {
        const pdfPath = path.join(pdfDirectory, file);
        const dataBuffer = fs.readFileSync(pdfPath);
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        await parser.destroy();

        let text = result.text;
        // Remove page numbers and other noise
        text = text.replace(/-- \d+ of \d+ --/g, '');
        text = text.replace(/Created by the awesome site http:\/\/customcardsagainsthumanity.com/g, '');
        text = text.replace(/vitorlegolas `s pack/g, '');

        // Normalize whitespace
        text = text.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();

        // Split into sentences (cards)
        const cards = text.match(/[^.!?]+[.!?]+/g) || [];

        cards.forEach(card => {
            const cleanedCard = card.trim();
            if (cleanedCard) {
                if (cleanedCard.includes('________')) {
                    blackCards.push(cleanedCard);
                } else {
                    whiteCards.push(cleanedCard);
                }
            }
        });
    }

    // Remove duplicates
    whiteCards = [...new Set(whiteCards)];
    blackCards = [...new Set(blackCards)];

    fs.writeFileSync('cards.json', JSON.stringify({ whiteCards, blackCards }, null, 2));
    console.log('Cards processed and saved to cards.json');
}

processPdfs();
