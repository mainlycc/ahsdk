import { z } from "zod";

export const pdfAnalysisSchema = z.object({
  summary: z.string().describe("Krótkie podsumowanie dokumentu PDF"),
  mainTopics: z.array(z.string()).describe("Główne tematy poruszone w dokumencie"),
  keyPoints: z.array(z.string()).describe("Kluczowe punkty i informacje z dokumentu"),
  structure: z.string().describe("Struktura i organizacja dokumentu"),
  conclusions: z.array(z.string()).describe("Główne wnioski i rekomendacje z dokumentu"),
  pageCount: z.number().optional().describe("Liczba stron w dokumencie"),
  documentType: z.string().optional().describe("Typ dokumentu (np. raport, instrukcja, artykuł)"),
});

export type PdfAnalysis = z.infer<typeof pdfAnalysisSchema>;

// Dodatkowy schemat dla prostszej analizy (opcjonalny)
export const simplePdfAnalysisSchema = z.object({
  content: z.string().describe("Główna zawartość dokumentu w formie tekstu"),
  summary: z.string().describe("Krótkie podsumowanie"),
});

export type SimplePdfAnalysis = z.infer<typeof simplePdfAnalysisSchema>;
