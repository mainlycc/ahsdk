"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { useRouter } from "next/navigation"

interface User {
  email: string
  name?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (profileData: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Sprawdź czy użytkownik jest zalogowany przy ładowaniu strony
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Zakodowane dane logowania
    if (email === "test@example.com" && password === "password123") {
      // Sprawdź czy istnieją zapisane dane profilu
      const savedProfile = localStorage.getItem(`profile_${email}`)
      let userData: User = { email }
      
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          userData = { ...userData, ...profile }
        } catch (error) {
          console.error('Błąd podczas ładowania profilu:', error)
        }
      }
      
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      return true
    }
    return false
  }

  const updateProfile = (profileData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...profileData }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      localStorage.setItem(`profile_${user.email}`, JSON.stringify(profileData))
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  return { user, login, logout, updateProfile, isLoading }
}
