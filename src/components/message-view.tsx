"use client";

import type React from "react";
import { useState } from "react";
import { PdfAnalysis } from "@/lib/schemas";
import { Copy, Download, ChevronDown, ChevronUp, Check, FileText, Eye, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Part =
  | { type: "text"; text: string }
  | {
      type: "file";
      mediaType?: string;    // np. "application/pdf"
      mimeType?: string;     // alternatywna nazwa dla mediaType
      url?: string;          // blob:... albo https://...
      data?: string;         // base64 data
      filename?: string;     // nazwa pliku
      name?: string | null;
    }
  | {
      type: "image";
      image: string;         // data URL
    };

interface MessageViewProps {
  message: { 
    id: string; 
    role: string; 
    content: string;
    parts?: Part[]; // nowy format z parts
    pdfAnalysis?: PdfAnalysis; // wyniki analizy PDF
    error?: string; // błąd w wiadomości
    isLoading?: boolean; // czy wiadomość jest w trakcie ładowania
  };
}

export function MessageView({ message }: MessageViewProps) {
  // Obsługa nowego formatu z parts lub starego z content jako string
  const content = message.parts || [{ type: 'text' as const, text: message.content }];
  
  // Stan dla funkcji pomocniczych
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  
  // Funkcja do kopiowania tekstu
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Błąd kopiowania:', error);
    }
  };
  
  // Funkcja do eksportu analizy PDF
  const exportPdfAnalysis = (analysis: PdfAnalysis) => {
    const exportData = {
      podsumowanie: analysis.summary,
      główne_tematy: analysis.mainTopics,
      kluczowe_punkty: analysis.keyPoints,
      struktura: analysis.structure,
      wnioski: analysis.conclusions,
      metadane: {
        liczba_stron: analysis.pageCount,
        typ_dokumentu: analysis.documentType
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analiza-pdf-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Funkcja do przełączania sekcji
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="rounded border p-3">
      <div className="text-xs uppercase text-gray-500 mb-2">{message.role}</div>

      {/* Obsługa błędów */}
      {message.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <span className="text-red-500">⚠️</span>
            <span className="font-medium">Błąd:</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{message.error}</p>
        </div>
      )}

      {/* Loading state */}
      {message.isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Przetwarzanie...</span>
          </div>
        </div>
      )}

      {/* Obsługa wyników analizy PDF */}
      {message.pdfAnalysis && (
        <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              📄 Analiza PDF
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(message.pdfAnalysis, null, 2), 'analiza')}
                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                title="Kopiuj analizę"
              >
                {copiedText === 'analiza' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => exportPdfAnalysis(message.pdfAnalysis!)}
                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                title="Eksportuj analizę"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Podsumowanie */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <button
                onClick={() => toggleSection('summary')}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="font-medium text-blue-800">Podsumowanie</h4>
                {expandedSections.has('summary') ? (
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-600" />
                )}
              </button>
              {expandedSections.has('summary') && (
                <div className="mt-2">
                  <p className="text-sm text-blue-700 leading-relaxed">{message.pdfAnalysis.summary}</p>
                  <button
                    onClick={() => copyToClipboard(message.pdfAnalysis!.summary, 'podsumowanie')}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {copiedText === 'podsumowanie' ? (
                      <><Check className="w-3 h-3" /> Skopiowano!</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Kopiuj</>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* Główne tematy */}
            {message.pdfAnalysis.mainTopics && message.pdfAnalysis.mainTopics.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <button
                  onClick={() => toggleSection('topics')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="font-medium text-blue-800">Główne tematy ({message.pdfAnalysis.mainTopics.length})</h4>
                  {expandedSections.has('topics') ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                </button>
                {expandedSections.has('topics') && (
                  <div className="mt-2">
                    <ul className="text-sm text-blue-700 space-y-2">
                      {message.pdfAnalysis.mainTopics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold">{i + 1}.</span>
                          <span className="flex-1">{topic}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => copyToClipboard(message.pdfAnalysis!.mainTopics.join('\n'), 'tematy')}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {copiedText === 'tematy' ? (
                        <><Check className="w-3 h-3" /> Skopiowano!</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Kopiuj wszystkie</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Kluczowe punkty */}
            {message.pdfAnalysis.keyPoints && message.pdfAnalysis.keyPoints.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <button
                  onClick={() => toggleSection('keyPoints')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="font-medium text-blue-800">Kluczowe punkty ({message.pdfAnalysis.keyPoints.length})</h4>
                  {expandedSections.has('keyPoints') ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                </button>
                {expandedSections.has('keyPoints') && (
                  <div className="mt-2">
                    <ul className="text-sm text-blue-700 space-y-2">
                      {message.pdfAnalysis.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span className="flex-1">{point}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => copyToClipboard(message.pdfAnalysis!.keyPoints.join('\n'), 'punkty')}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {copiedText === 'punkty' ? (
                        <><Check className="w-3 h-3" /> Skopiowano!</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Kopiuj wszystkie</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Struktura dokumentu */}
            {message.pdfAnalysis.structure && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <button
                  onClick={() => toggleSection('structure')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="font-medium text-blue-800">Struktura dokumentu</h4>
                  {expandedSections.has('structure') ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                </button>
                {expandedSections.has('structure') && (
                  <div className="mt-2">
                    <p className="text-sm text-blue-700 leading-relaxed">{message.pdfAnalysis.structure}</p>
                    <button
                      onClick={() => copyToClipboard(message.pdfAnalysis!.structure!, 'struktura')}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {copiedText === 'struktura' ? (
                        <><Check className="w-3 h-3" /> Skopiowano!</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Kopiuj</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Wnioski */}
            {message.pdfAnalysis.conclusions && message.pdfAnalysis.conclusions.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <button
                  onClick={() => toggleSection('conclusions')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="font-medium text-blue-800">Wnioski ({message.pdfAnalysis.conclusions.length})</h4>
                  {expandedSections.has('conclusions') ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                </button>
                {expandedSections.has('conclusions') && (
                  <div className="mt-2">
                    <ul className="text-sm text-blue-700 space-y-2">
                      {message.pdfAnalysis.conclusions.map((conclusion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold">{i + 1}.</span>
                          <span className="flex-1">{conclusion}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => copyToClipboard(message.pdfAnalysis!.conclusions.join('\n'), 'wnioski')}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {copiedText === 'wnioski' ? (
                        <><Check className="w-3 h-3" /> Skopiowano!</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Kopiuj wszystkie</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Metadane */}
            {(message.pdfAnalysis.pageCount || message.pdfAnalysis.documentType) && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">Metadane</h4>
                <div className="flex flex-wrap gap-4 text-sm text-blue-700">
                  {message.pdfAnalysis.pageCount && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Stron:</span>
                      <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">{message.pdfAnalysis.pageCount}</span>
                    </div>
                  )}
                  {message.pdfAnalysis.documentType && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Typ:</span>
                      <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">{message.pdfAnalysis.documentType}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {content.map((part, i) => {
        if (part.type === "text") {
          return (
            <div key={`${message.id}-t-${i}`} className="group">
              <p className="leading-relaxed whitespace-pre-wrap">
                {part.text}
              </p>
              <button
                onClick={() => copyToClipboard(part.text, `text-${i}`)}
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {copiedText === `text-${i}` ? (
                  <><Check className="w-3 h-3" /> Skopiowano!</>
                ) : (
                  <><Copy className="w-3 h-3" /> Kopiuj</>
                )}
              </button>
            </div>
          );
        }

        if (part.type === "image") {
          return (
            <div key={`${message.id}-img-${i}`} className="group relative">
              <img
                src={part.image}
                alt={`image-${i}`}
                className="max-w-full rounded border hover:shadow-lg transition-shadow"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = part.image;
                    link.download = `image-${Date.now()}.png`;
                    link.click();
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm text-gray-600 hover:text-gray-800"
                  title="Pobierz obraz"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        }

        if (part.type === "file") {
          const mimeType = part.mimeType || part.mediaType;
          const fileName = part.filename || part.name || `file-${i}`;
          const fileUrl = part.url || (part.data ? `data:${mimeType};base64,${part.data}` : null);

          // Obraz
          if (mimeType?.startsWith("image/")) {
            return (
              <img
                key={`${message.id}-img-${i}`}
                src={fileUrl || part.data ? `data:${mimeType};base64,${part.data}` : ''}
                alt={fileName}
                className="max-w-full rounded border"
              />
            );
          }

          // PDF - pokaż informację o pliku zamiast iframe (bezpieczniej)
          if (mimeType === "application/pdf") {
            return (
              <Card
                key={`${message.id}-pdf-${i}`}
                className="group relative overflow-hidden border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Ikona PDF - minimalistyczna */}
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>

                    {/* Zawartość pliku */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate mb-1">{fileName}</h4>
                      <p className="text-sm text-gray-500">
                        Plik PDF został przesłany do analizy
                      </p>
                    </div>

                    {/* Akcje - pokazują się na hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          if (fileUrl) {
                            window.open(fileUrl, '_blank');
                          }
                        }}
                        title="Podgląd PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          if (fileUrl) {
                            const link = document.createElement('a');
                            link.href = fileUrl;
                            link.download = fileName;
                            link.click();
                          }
                        }}
                        title="Pobierz PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(fileName, `pdf-${i}`)}
                        title="Kopiuj nazwę pliku"
                      >
                        {copiedText === `pdf-${i}` ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // inne typy plików
          return (
            <div
              key={`${message.id}-file-${i}`}
              className="group flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-gray-600 text-xl">📎</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{fileName}</div>
                <div className="text-sm text-gray-700">{mimeType}</div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => copyToClipboard(fileName, `file-${i}`)}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md"
                  title="Kopiuj nazwę pliku"
                >
                  {copiedText === `file-${i}` ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                {fileUrl && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = fileUrl;
                      link.download = fileName;
                      link.click();
                    }}
                    className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md"
                    title="Pobierz plik"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
