"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { UserProfile } from "@/components/user-profile"
import { ChatPanel } from "@/components/chat-panel"
import { MobileNavigation } from "@/components/mobile-navigation"

export default function ChatPage() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Main Content Area */}
      <div className="lg:pr-80 flex flex-col flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-semibold truncate">Chat AI</h1>
              <p className="text-xs text-muted-foreground truncate">Asystent z analizą PDF</p>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <MobileNavigation currentPage="/" />
        </div>


        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Desktop Header */}
          <div className="hidden lg:block p-4 pb-2">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Chat AI - Asystent z analizą PDF i obrazów
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Aplikacja chatAI z możliwością analizy plików PDF, opisywania obrazów i zwykłej rozmowy z AI
              </p>
            </div>
          </div>

          {/* Chat Panel - Maximized height */}
          <div className="flex-1 min-h-0 px-2 sm:px-3 lg:px-4 pt-2 lg:pt-4 pb-0">
            <ChatPanel user={user} />
          </div>
        </div>

      {/* Right Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0">
        <div className="flex flex-col flex-grow bg-card border-l pt-5 pb-4 overflow-y-auto">
          {/* Sidebar Header */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Chat AI</h2>
                <p className="text-xs text-muted-foreground">Asystent AI</p>
              </div>
            </div>
          </div>
          
          {/* User Profile in Sidebar */}
          <div className="mt-5 flex-grow flex flex-col px-4">
            <UserProfile user={user} onLogout={logout} />
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}