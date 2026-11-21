import mammoth from 'mammoth';
import path from 'path';

/**
 * Extracts plain text from an uploaded resume buffer (PDF, DOCX, or text/markdown).
 */
export async function extractResumeText(
  buffer: Buffer,
  mimetype: string,
  originalname: string
): Promise<string> {
  const ext = path.extname(originalname).toLowerCase();

  // 1. DOCX via mammoth
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.docx'
  ) {
    try {
      const docResult = await mammoth.extractRawText({ buffer });
      return docResult.value || '';
    } catch (err) {
      console.warn('[resumeParserService] Mammoth extraction failed:', err);
    }
  }

  // 2. PDF via pdf-parse
  if (mimetype === 'application/pdf' || ext === '.pdf') {
    try {
      const pdfModule = await import('pdf-parse');
      const PDFParseClass = (pdfModule as any).PDFParse || (pdfModule as any).default?.PDFParse;

      if (PDFParseClass) {
        const parser = new PDFParseClass({ data: buffer });
        await parser.load();
        const text = await parser.getText();
        if (text && text.trim().length > 20) {
          return text;
        }
      }
    } catch (err) {
      console.warn('[resumeParserService] pdf-parse primary extraction failed, trying stream fallback:', err);
    }

    // Fallback printable stream extraction
    const raw = buffer.toString('utf-8');
    const cleaned = raw.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s{2,}/g, ' ');
    if (cleaned && cleaned.trim().length > 30) {
      return cleaned;
    }
  }

  // 3. Fallback UTF-8 text
  return buffer.toString('utf-8');
}
