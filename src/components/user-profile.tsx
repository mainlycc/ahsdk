"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Settings, Mail, LogOut } from "lucide-react"
import Link from "next/link"

interface UserProfileProps {
  user?: any;
  onLogout?: () => void;
}

export function UserProfile({ user, onLogout }: UserProfileProps) {
  if (!user) return null

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar} alt={user.name || user.email} />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-lg">
              {user.name || "Użytkownik"}
            </h3>
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span className="text-xs truncate max-w-[200px]">{user.email}</span>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Online
          </Badge>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Członek od</span>
            <span className="font-medium">Dzisiaj</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Link href="/profile">
            <Button variant="outline" className="w-full" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Edytuj profil
            </Button>
          </Link>
          
          {onLogout && (
            <Button 
              variant="outline" 
              className="w-full mt-2" 
              size="sm"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj się
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
