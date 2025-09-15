"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Paperclip, Send, User, Bot, X, Trash2, FileText, Image as ImageIcon, Download, Eye, ExternalLink, Loader2 } from "lucide-react"
import Image from "next/image"
import { 
  Message, 
  MessageContent,
  MessageAvatar
} from "@/components/ai-elements/message"
import { 
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton
} from "@/components/ai-elements/conversation"
import { 
  PromptInput,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSubmit
} from "@/components/ai-elements/prompt-input"

interface FileAttachment {
  file: File
  preview?: string
  type: "image" | "document"
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  attachments?: FileAttachment[]
}

interface ChatPanelProps {
  user: any
}

export function ChatPanel({ user }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll do końca gdy pojawiają się nowe wiadomości
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    files.forEach((file) => {
      const attachment: FileAttachment = {
        file,
        type: file.type.startsWith("image/") ? "image" : "document",
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        attachment.preview = e.target?.result as string
        setAttachments((prev) => [...prev, attachment])
      }

      if (attachment.type === "image") {
        reader.readAsDataURL(file)
      } else {
        reader.readAsDataURL(file)
      }
    })

    // wyczyść tylko ten input, który wywołał zdarzenie
    if (event.target) {
      (event.target as HTMLInputElement).value = ""
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Funkcja do czyszczenia historii czatu
  const clearChatHistory = () => {
    setMessages([])
  }

  // Funkcja do analizy PDF
  const handlePdfAnalysis = async (userMessage: Message) => {
    try {
      const pdfAttachments = userMessage.attachments?.filter(att => att.file.type === 'application/pdf') || []
      
      if (pdfAttachments.length === 0) {
        throw new Error("Brak plików PDF do analizy")
      }

      console.log("[PDF Analysis] Starting PDF analysis for:", pdfAttachments.map(att => att.file.name))

      // Dodaj wiadomość o rozpoczęciu analizy
      const loadingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "🔄 Analizuję plik PDF... To może potrwać kilka chwil.",
      }
      setMessages((prev) => [...prev, loadingMessage])

      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: pdfAttachments.map((att) => ({
            name: att.file.name,
            type: att.file.type,
            size: att.file.size,
            data: att.preview, // base64 data
          })),
          question: userMessage.content || "Przeanalizuj ten dokument PDF i opisz jego zawartość.",
          analysisType: userMessage.content ? "qa" : "detailed",
        }),
      })

      // Usuń wiadomość loading
      setMessages((prev) => prev.filter(msg => msg.id !== loadingMessage.id))

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Nieznany błąd serwera" }))
        throw new Error(errorData.error || `HTTP ${response.status}: Błąd podczas analizy PDF`)
      }

      // PDF response - zwykła odpowiedź tekstowa
      const content = await response.text()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: content,
      }

      setMessages((prev) => [...prev, assistantMessage])

      console.log("[PDF Analysis] Completed successfully")
    } catch (error) {
      console.error("PDF Analysis error:", error)
      
      // Usuń wiadomość loading jeśli istnieje
      setMessages((prev) => prev.filter(msg => !msg.content.includes("🔄 Analizuję plik PDF")))
      
      // Sprawdź czy to błąd z retry logic
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd"
      
      let userFriendlyMessage = "Przepraszam, wystąpił błąd podczas analizy PDF."
      
      if (errorMessage.includes("przeciążony")) {
        userFriendlyMessage = "🔄 Serwer Google AI jest obecnie przeciążony. Spróbuj ponownie za chwilę - system automatycznie ponowi próbę."
      } else if (errorMessage.includes("limit zapytań")) {
        userFriendlyMessage = "⏰ Przekroczono limit zapytań do Google AI. Spróbuj ponownie za kilka minut."
      } else if (errorMessage.includes("autoryzacji")) {
        userFriendlyMessage = "🔑 Błąd autoryzacji Google AI. Sprawdź konfigurację klucza API."
      } else if (errorMessage.includes("nieprawidłowe żądanie")) {
        userFriendlyMessage = "📄 Nieprawidłowy plik PDF. Sprawdź czy plik nie jest uszkodzony i spróbuj ponownie."
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: userFriendlyMessage,
        },
      ])
    }
  }

  // Funkcja do obsługi zwykłych wiadomości (obrazy + tekst)
  const handleRegularChat = async (userMessage: Message) => {
    try {
      console.log("[Regular Chat] Starting chat for:", userMessage.attachments?.map(att => att.file.name) || "text message")

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          attachments: userMessage.attachments?.map((att) => ({
            name: att.file.name,
            type: att.file.type,
            data: att.preview, // This now contains base64 data
          })) || [],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Nieznany błąd serwera")
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Streaming response dla zwykłych wiadomości i obrazów
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Brak odpowiedzi z serwera")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

      const decoder = new TextDecoder()
      let done = false
      let buffer = ""

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()
              if (data === "[DONE]") {
                done = true
                break
              }

              if (data) {
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: msg.content + parsed.choices[0].delta.content }
                          : msg,
                      ),
                    )
                  }
                } catch (e) {
                  console.warn("Failed to parse streaming data:", data)
                }
              }
            }
          }
        }
      }

      console.log("[Regular Chat] Completed successfully")
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości: ${error instanceof Error ? error.message : "Nieznany błąd"}`,
        },
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setAttachments([]) // Wyczyść załączniki po wysłaniu
    setIsLoading(true)

    try {
      // Sprawdź czy są pliki PDF w załącznikach
      const hasPdfFiles = userMessage.attachments?.some(att => att.file.type === 'application/pdf') || false
      
      if (hasPdfFiles) {
        // Użyj dedykowanego endpointu PDF
        await handlePdfAnalysis(userMessage)
      } else {
        // Użyj zwykłego endpointu chat
        await handleRegularChat(userMessage)
      }
    } catch (error) {
      console.error("Submit error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości.",
        },
      ])
    } finally {
      setIsLoading(false)
      setAttachments([])
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Interface */}
      <Card className="flex-1 flex flex-col shadow-lg border-0 bg-card/50 backdrop-blur-sm min-h-0 relative">
        {/* Header with Clear Button - Top Right */}
        {messages.length > 0 && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={clearChatHistory}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-sm h-8 px-2 sm:h-9 sm:px-3"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Wyczyść historię</span>
            </Button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-2 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-6 sm:py-8 px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Witaj w Chat AI!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto text-xs sm:text-sm">
                    Rozpocznij rozmowę, zadaj pytanie lub dodaj pliki PDF/obrazy do analizy
                  </p>
                  <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2">
                    <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary text-xs sm:text-sm rounded-full">📄 Analiza PDF</span>
                    <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary text-xs sm:text-sm rounded-full">🖼️ Opisy obrazów</span>
                    <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary text-xs sm:text-sm rounded-full">💬 Rozmowa z AI</span>
                  </div>
                </div>
              )}

              {messages.map((message, index) => {
                const isUser = message.role === "user";
                
                return (
                  <Message
                    key={message.id}
                    from={isUser ? "user" : "assistant"}
                    className="mb-4"
                  >
                    <MessageContent variant="contained">
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {message.attachments.map((attachment, attIndex) => (
                            <div key={attIndex} className="relative">
                              {attachment.type === "image" && attachment.preview ? (
                                <Image
                                  src={attachment.preview}
                                  alt={attachment.file.name}
                                  width={120}
                                  height={120}
                                  className="rounded-lg object-cover border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                                  onClick={() => {
                                    window.open(attachment.preview, '_blank');
                                  }}
                                />
                              ) : (
                                <div className="group relative">
                                  {attachment.file.type === 'application/pdf' ? (
                                    <div className="w-20 h-20 flex flex-col items-center justify-center p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                         onClick={() => {
                                           if (attachment.preview) {
                                             window.open(attachment.preview, '_blank');
                                           }
                                         }}>
                                      <FileText className="w-8 h-8 text-gray-600 mb-1 flex-shrink-0" />
                                      <p className="text-xs text-gray-600 text-center leading-tight w-full px-1 overflow-hidden" 
                                         style={{
                                           display: '-webkit-box',
                                           WebkitLineClamp: 2,
                                           WebkitBoxOrient: 'vertical',
                                           wordBreak: 'break-word'
                                         }}>
                                        {attachment.file.name}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="w-24 h-24 bg-muted/50 rounded-lg flex items-center justify-center border-2 border-primary/20">
                                      <div className="text-center">
                                        <Paperclip className="w-6 h-6 mx-auto mb-1 text-primary" />
                                        <span className="text-xs text-muted-foreground truncate block px-1">
                                          {attachment.file.name}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Message content */}
                      {message.content && (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                      )}
                    </MessageContent>
                    
                    <MessageAvatar 
                      src={isUser ? (user?.avatar || undefined) : "/bot-avatar.png"}
                      name={isUser ? (user?.name || user?.email || "Użytkownik") : "AI"}
                    />
                  </Message>
                );
              })}

              {isLoading && (
                <div className="flex gap-2 sm:gap-4 justify-start">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2">AI pisze...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="relative px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-1 border-t bg-card/50 backdrop-blur-sm">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Załączone pliki ({attachments.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative bg-muted/50 hover:bg-muted rounded-lg p-2 sm:p-3 flex items-center gap-2 sm:gap-3 border transition-colors max-w-full">
                    {attachment.type === "image" && attachment.preview ? (
                      <Image
                        src={attachment.preview || "/placeholder.svg"}
                        alt={attachment.file.name}
                        width={32}
                        height={32}
                        className="rounded-md object-cover sm:w-10 sm:h-10 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                        {attachment.file.type === 'application/pdf' ? (
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        ) : (
                        <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-medium truncate block">{attachment.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-5 h-5 sm:w-6 sm:h-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0" 
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="relative">
            <div className="flex gap-2 sm:gap-3 items-end">
              {/* Ukryte inputy plików (triggery w toolbarze) */}
              <div className="hidden">
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={pdfInputRef}
                  type="file"
                  multiple
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Prompt Input */}
              <PromptInput
                className="flex-1 min-h-[44px] sm:min-h-[48px] border-2 rounded-2xl focus:border-primary/50 transition-colors"
                onSubmit={(message, event) => {
                  event.preventDefault();
                  // Konwertuj message na format oczekiwany przez handleSubmit
                  const syntheticEvent = {
                    ...event,
                    preventDefault: () => event.preventDefault(),
                    currentTarget: event.currentTarget
                  } as React.FormEvent<HTMLFormElement>;
                  handleSubmit(syntheticEvent);
                }}
                accept="image/*,application/pdf"
                multiple
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={attachments.some(att => att.file.type === 'application/pdf') 
                      ? "Zadaj pytanie o PDF..." 
                      : attachments.some(att => att.file.type.startsWith('image/'))
                      ? "Opisz obrazy..."
                      : "Napisz wiadomość..."}
                    className="min-h-[40px] sm:min-h-[44px] max-h-32 sm:max-h-40 overflow-y-auto resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base"
                  />
                  
                  {attachments.length > 0 && (
                    <PromptInputAttachments>
                      {(attachment) => (
                        <PromptInputAttachment
                          key={attachment.id}
                          data={attachment}
                        />
                      )}
                    </PromptInputAttachments>
                  )}
                </PromptInputBody>
                
                <PromptInputToolbar>
                  <PromptInputTools>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isLoading}
                      aria-label="Dodaj obraz"
                      title="Dodaj obraz"
                    >
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={isLoading}
                      aria-label="Dodaj PDF"
                      title="Dodaj PDF"
                    >
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </PromptInputTools>
                  
                  <PromptInputSubmit 
                    disabled={isLoading || (!input.trim() && attachments.length === 0)}
                    status={isLoading ? "submitted" : undefined}
                  />
                </PromptInputToolbar>
              </PromptInput>
            </div>
            
            {/* Helper Text (overlay - no extra height) */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[9px] sm:text-[10px] text-muted-foreground pointer-events-none select-none text-center px-2">
              {attachments.length > 0 ? (
                <span className="hidden sm:inline">Pliki zostały załączone. Możesz zadać pytanie o ich zawartość.</span>
              ) : (
                <span className="hidden sm:inline">Naciśnij Enter aby wysłać, Shift+Enter dla nowej linii</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
