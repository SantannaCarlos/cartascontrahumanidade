class CardParser {
  constructor() {
    this.pdf = import('pdf-parse');
  }

  async parse(pdfBuffer) {
    const pdf = await this.pdf;
    const parser = new pdf.PDFParse({ data: pdfBuffer });
    const data = await parser.getText();
    return data.text;
  }
}

export default CardParser;