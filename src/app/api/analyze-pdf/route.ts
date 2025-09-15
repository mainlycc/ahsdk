import { pdfFileSchema } from "@/lib/schemas";

export const maxDuration = 60;

// Funkcja retry z exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Jeśli to błąd 503 (Service Unavailable), spróbuj ponownie
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1} failed with error:`, error.message);
      if (error instanceof Error && error.message.includes('503')) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          console.log(`Próba ${attempt + 1}/${maxRetries + 1} nieudana, ponawiam za ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          console.log("Wyczerpano wszystkie próby retry dla błędu 503");
        }
      } else {
        console.log("Błąd nie jest 503, nie ponawiam prób");
      }
      
      // Dla innych błędów lub po wyczerpaniu prób, rzuć błąd
      throw error;
    }
  }
  
  throw lastError!;
}

// Funkcja do tłumaczenia błędów Google API na user-friendly komunikaty
function translateGoogleError(error: any): string {
  if (error.message?.includes('503')) {
    return "Serwer Google AI jest obecnie przeciążony. Spróbuj ponownie za chwilę.";
  }
  if (error.message?.includes('429')) {
    return "Przekroczono limit zapytań do Google AI. Spróbuj ponownie za kilka minut.";
  }
  if (error.message?.includes('400')) {
    return "Nieprawidłowe żądanie do Google AI. Sprawdź czy plik PDF jest poprawny.";
  }
  if (error.message?.includes('401')) {
    return "Błąd autoryzacji Google AI. Sprawdź klucz API.";
  }
  if (error.message?.includes('403')) {
    return "Brak uprawnień do Google AI. Sprawdź konfigurację API.";
  }
  return "Wystąpił błąd podczas analizy PDF. Spróbuj ponownie.";
}

export async function POST(req: Request) {
  try {
    const { files, question, analysisType = "detailed" } = await req.json();
    
    // Walidacja danych wejściowych
    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Brak plików PDF do analizy" 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Walidacja pierwszego pliku PDF
    const firstFile = files[0];
    const fileValidation = pdfFileSchema.safeParse(firstFile);
    
    if (!fileValidation.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Nieprawidłowy plik PDF: ${fileValidation.error.errors.map(e => e.message).join(", ")}` 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sprawdzenie klucza API
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
                        process.env.GOOGLE_API_KEY || 
                        process.env.GEMINI_API_KEY;

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Brak klucza Google AI API. Sprawdź czy masz ustawioną zmienną GOOGLE_GENERATIVE_AI_API_KEY w pliku .env.local" 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Przygotowanie promptu w zależności od typu analizy
    const systemPrompt = analysisType === "qa" 
      ? "Jesteś ekspertem w analizie dokumentów PDF. Twoim zadaniem jest odpowiadać na pytania użytkownika na podstawie zawartości załączonego dokumentu PDF. Odpowiadaj precyzyjnie i konkretnie, odwołując się do konkretnych fragmentów dokumentu. Odpowiadaj po polsku."
      : "Jesteś ekspertem w analizie dokumentów. Twoim zadaniem jest przeanalizować dokument PDF i przedstawić jego zawartość w sposób zrozumiały. Opisz główne tematy, kluczowe informacje, strukturę dokumentu i najważniejsze wnioski. Odpowiadaj po polsku.";

    const userPrompt = analysisType === "qa" 
      ? question || "Przeanalizuj ten dokument PDF i odpowiedz na pytania użytkownika."
      : "Przeanalizuj ten dokument PDF i opisz jego zawartość.";

    // Przygotowanie danych PDF - usuń prefix data:application/pdf;base64, jeśli istnieje
    let pdfData = firstFile.data;
    if (pdfData.includes(',')) {
      pdfData = pdfData.split(',')[1];
    }

    console.log("PDF Analysis - File name:", firstFile.name);
    console.log("PDF Analysis - File size:", firstFile.size);
    console.log("PDF Analysis - Data length:", pdfData.length);
    console.log("PDF Analysis - Analysis type:", analysisType);
    console.log("PDF Analysis - Data preview:", pdfData.substring(0, 100));

    // Użyj bezpośrednio Google Gemini API zamiast AI SDK
    const requestBody = {
      contents: [{
        role: "user",
        parts: [
          { 
            text: `${systemPrompt}\n\n${userPrompt}` 
          },
          {
            inline_data: {
              mime_type: "application/pdf",
              data: pdfData
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    };
    
    console.log("Sending request to Google Gemini API...");
    
    // Użyj retry logic dla wywołania Google API
    const result = await retryWithBackoff(async () => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google API error:", response.status, errorText);
        const error = new Error(`Google API error: ${response.status} - ${errorText}`);
        console.log("Throwing error for retry logic:", error.message);
        throw error;
      }

      return response;
    });

    const data = await result.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nie udało się wygenerować odpowiedzi";

    console.log("PDF Analysis completed successfully");
    
    return new Response(content, {
      headers: {
        "Content-Type": "text/plain",
      },
    });

  } catch (error) {
    console.error("PDF Analysis API error:", error);
    
    // Użyj user-friendly komunikatu błędu
    const userFriendlyError = translateGoogleError(error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: userFriendlyError,
        originalError: error instanceof Error ? error.message : "Nieznany błąd"
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
