export async function POST(req: Request) {
  try {
    const { messages, attachments } = await req.json()

    console.log("[Chat API] Received messages:", JSON.stringify(messages, null, 2));
    console.log("[Chat API] Received attachments:", JSON.stringify(attachments, null, 2));

    // Sprawdź czy są pliki PDF w załącznikach
    const hasPdfFiles = attachments?.some((att: any) => att.type === 'application/pdf') || false;

    // Sprawdź dostępność kluczy API
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
                        process.env.GOOGLE_API_KEY || 
                        process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    console.log("DEBUG - GOOGLE_GENERATIVE_AI_API_KEY:", googleApiKey ? "USTAWIONY" : "BRAK");
    console.log("DEBUG - OPENAI_API_KEY:", openaiApiKey ? "USTAWIONY" : "BRAK");
    console.log("DEBUG - hasPdfFiles:", hasPdfFiles);

    // Jeśli są pliki PDF, użyj Google Gemini API
    if (hasPdfFiles) {
      if (!googleApiKey) {
        return new Response(
          JSON.stringify({ 
            error: "Brak klucza Google AI API. Sprawdź czy masz ustawioną zmienną GOOGLE_GENERATIVE_AI_API_KEY w pliku .env.local" 
          }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Dla PDF używaj Google Gemini API z prawidłowym formatem inline_data
      const pdfAttachments = attachments?.filter((att: any) => att.type === 'application/pdf') || [];
      
      console.log("DEBUG - PDF Attachments:", pdfAttachments.length);
      console.log("DEBUG - PDF Data preview:", pdfAttachments[0]?.data?.substring(0, 100) + "...");
      
      const requestBody = {
        contents: [{
          role: "user",
          parts: [
            { 
              type: "text", 
              text: messages[messages.length - 1]?.content || "Przeanalizuj załączone pliki PDF i odpowiedz na pytania użytkownika na ich podstawie." 
            },
            ...pdfAttachments.map((att: any) => {
              const base64Data = att.data.includes(',') ? att.data.split(',')[1] : att.data;
              console.log("DEBUG - Base64 data length:", base64Data.length);
              return {
                type: "inline_data",
                inline_data: {
                  mime_type: att.type,
                  data: base64Data
                }
              };
            })
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      };
      
      console.log("DEBUG - Request body parts count:", requestBody.contents[0].parts.length);
      
      // Użyj stabilnego wariantu modelu zamiast eksperymentalnego, który mógł zostać wyłączony
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Google API error:", response.status, errorText);
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nie udało się wygenerować odpowiedzi";

      return new Response(content, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // Dla zwykłych wiadomości i obrazów używaj OpenAI
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Brak klucza OpenAI API. Sprawdź czy masz ustawioną zmienną OPENAI_API_KEY w pliku .env.local" 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const processedMessages = messages.map((msg: any) => {
      // Ensure all messages have proper format
      return {
        role: msg.role,
        content: typeof msg.content === "string" ? msg.content : msg.content,
      }
    })

    if (attachments && attachments.length > 0) {
      const lastUserMessage = processedMessages[processedMessages.length - 1]
      if (lastUserMessage && lastUserMessage.role === "user") {
        const contentParts: any[] = [
          {
            type: "text",
            text: typeof lastUserMessage.content === "string" ? lastUserMessage.content : lastUserMessage.content,
          },
        ]

        // Add images to content parts
        for (const attachment of attachments) {
          if (attachment.type.startsWith("image/") && attachment.data) {
            contentParts.push({
              type: "image_url",
              image_url: {
                url: attachment.data,
                detail: "high",
              },
            })
          } else if (attachment.type === "application/pdf") {
            contentParts[0].text += `\n\nZałączono plik PDF: ${attachment.name}. Proszę przeanalizuj jego zawartość jeśli to możliwe.`
          }
        }

        // Only set content as array if we have images
        if (contentParts.length > 1) {
          lastUserMessage.content = contentParts
        }
      }
    }

    console.log("[Chat API] Sending to OpenAI:", JSON.stringify(processedMessages, null, 2))

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: processedMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[Chat API] OpenAI API error:", response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Wystąpił błąd podczas przetwarzania żądania", {
      status: 500,
    })
  }
}
