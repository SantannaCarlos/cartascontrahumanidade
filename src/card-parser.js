const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const pdfPath = 'C:\\Users\\chsan\\Downloads\\Nova pasta\\cards_against_humani_cards_against_humanity_traduzi_263162.pdf';

const dataBuffer = fs.readFileSync(pdfPath);

const parser = new PDFParse({ data: dataBuffer });

parser.getText().then((result)=>{
    console.log(result.text)
}).finally(async ()=>{
    await parser.destroy();
});

