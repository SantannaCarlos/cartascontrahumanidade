const PDFParser = require('pdf2json');
const pdfParser = new PDFParser();

pdfParser.on('pdfParser_dataReady', (pdfData) => {
    console.log('=== Primeira página do PDF ===\n');
    
    if (pdfData.Pages && pdfData.Pages[0]) {
        const page = pdfData.Pages[0];
        console.log(`Total de elementos de texto: ${page.Texts ? page.Texts.length : 0}\n`);
        
        if (page.Texts) {
            // Mostra os primeiros 30 elementos
            page.Texts.slice(0, 30).forEach((textItem, index) => {
                if (textItem.R && textItem.R[0] && textItem.R[0].T) {
                    try {
                        const decoded = decodeURIComponent(textItem.R[0].T);
                        console.log(`${index + 1}. [Y:${textItem.y.toFixed(2)}] ${decoded}`);
                    } catch (e) {
                        console.log(`${index + 1}. [Y:${textItem.y.toFixed(2)}] [ERRO ao decodificar]`);
                    }
                }
            });
        }
    }
});

pdfParser.on('pdfParser_dataError', (errData) => {
    console.error('Erro:', errData.parserError);
});

pdfParser.loadPDF('CAH_Portuguese_BR_ByNeto.pdf');
