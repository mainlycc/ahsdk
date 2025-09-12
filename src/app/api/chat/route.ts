export async function POST(req: Request) {
  try {
    const { messages, attachments } = await req.json()

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
        const contentParts = [
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

    console.log("[v0] Sending to OpenAI:", JSON.stringify(processedMessages, null, 2))

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
      console.log("[v0] OpenAI API error:", response.status, errorText)
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
