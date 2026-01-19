declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    text: string;
    version: string;
  }

  interface PDFOptions {
    max?: number;
    version?: string;
    pagerender?: (pageData: unknown) => Promise<string>;
  }

  function pdfParse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;

  export = pdfParse;
}
