import { z } from "zod";

// Główny schemat analizy PDF - szczegółowa analiza
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

// Schemat dla prostszej analizy PDF - tylko podstawowe informacje
export const simplePdfAnalysisSchema = z.object({
  content: z.string().describe("Główna zawartość dokumentu w formie tekstu"),
  summary: z.string().describe("Krótkie podsumowanie"),
});

export type SimplePdfAnalysis = z.infer<typeof simplePdfAnalysisSchema>;

// Schemat dla odpowiedzi na pytania o PDF
export const pdfQASchema = z.object({
  answer: z.string().describe("Odpowiedź na pytanie użytkownika na podstawie zawartości PDF"),
  relevantSections: z.array(z.string()).optional().describe("Relevantne sekcje z dokumentu"),
  confidence: z.enum(["high", "medium", "low"]).optional().describe("Poziom pewności odpowiedzi"),
});

export type PdfQA = z.infer<typeof pdfQASchema>;

// Schemat dla streamingu odpowiedzi PDF (używany w streamObject)
export const pdfStreamSchema = z.object({
  content: z.string().describe("Treść odpowiedzi o PDF"),
  isComplete: z.boolean().describe("Czy odpowiedź jest kompletna"),
  metadata: z.object({
    documentType: z.string().optional(),
    pageCount: z.number().optional(),
    processingTime: z.number().optional(),
  }).optional(),
});

export type PdfStream = z.infer<typeof pdfStreamSchema>;

// Schemat dla walidacji plików PDF
export const pdfFileSchema = z.object({
  name: z.string().min(1, "Nazwa pliku jest wymagana"),
  type: z.literal("application/pdf", { errorMap: () => ({ message: "Plik musi być w formacie PDF" }) }),
  size: z.number().max(5 * 1024 * 1024, "Plik PDF nie może być większy niż 5MB"),
  data: z.string().min(1, "Dane pliku są wymagane"),
});

export type PdfFile = z.infer<typeof pdfFileSchema>;

// Schemat dla odpowiedzi API PDF
export const pdfApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.union([pdfAnalysisSchema, simplePdfAnalysisSchema, pdfQASchema]).optional(),
  error: z.string().optional(),
  metadata: z.object({
    processingTime: z.number().optional(),
    model: z.string().optional(),
    timestamp: z.string().optional(),
  }).optional(),
});

export type PdfApiResponse = z.infer<typeof pdfApiResponseSchema>;
