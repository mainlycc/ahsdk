"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  Bot, 
  MessageSquare, 
  FileText, 
  Image as ImageIcon,
  Home
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileNavigationProps {
  currentPage?: string
}

export function MobileNavigation({ currentPage }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  const navigationItems = [
    {
      name: "Chat",
      href: "/",
      icon: MessageSquare,
      description: "Główny czat z AI"
    },
    {
      name: "Profil",
      href: "/profile",
      icon: User,
      description: "Edytuj swój profil"
    }
  ]

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  if (!isMobile || !user) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0"
        >
          <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg">Chat AI</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg mb-6">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar} alt={user.name || user.email} />
              <AvatarFallback className="text-sm font-semibold">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {user.name || "Użytkownik"}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs mt-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                Online
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start h-12 text-left"
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Features Info */}
          <div className="mt-6 p-4 bg-primary/5 rounded-lg">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Funkcje AI
            </h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3" />
                <span>Analiza dokumentów PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                <span>Opisywanie obrazów</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                <span>Rozmowa z AI</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full h-11 text-sm" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj się
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
