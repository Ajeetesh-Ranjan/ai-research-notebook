declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    info: {
      Title?: string;
      Author?: string;
      Keywords?: string;
      Producer?: string;
      CreationDate?: string;
      [key: string]: unknown;
    };
    metadata: Record<string, unknown>;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer): Promise<PDFParseResult>;
  export = pdfParse;
}
