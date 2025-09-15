"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bot, X, Menu } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { UserProfile } from "@/components/user-profile"
import { ChatPanel } from "@/components/chat-panel"

export default function ChatPage() {
  const [showMobileProfile, setShowMobileProfile] = useState(false)
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
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="lg:pr-80 flex flex-col flex-1">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Chat AI</h1>
              <p className="text-xs text-muted-foreground">Asystent z analizą PDF</p>
            </div>
          </div>
          
          {/* Mobile Profile Button */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowMobileProfile(!showMobileProfile)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Profile Overlay */}
        {showMobileProfile && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileProfile(false)}>
            <div className="fixed right-0 top-0 h-full w-80 bg-card border-l p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Profil użytkownika</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowMobileProfile(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <UserProfile user={user} onLogout={logout} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col h-screen">
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
          <div className="flex-1 min-h-0 px-2 lg:px-4 pt-2 lg:pt-4 pb-0">
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