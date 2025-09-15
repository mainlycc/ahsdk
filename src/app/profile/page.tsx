"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Save, ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"

interface ProfileData {
  name: string
  email: string
  avatar: string
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    avatar: ""
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email,
        avatar: user.avatar || ""
      })
      setAvatarPreview(user.avatar || "")
      setIsLoading(false)
    }
  }, [user])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setAvatarFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setAvatarPreview(result)
        }
        reader.readAsDataURL(file)
      } else {
        alert("Proszę wybrać plik obrazu")
      }
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview("")
    handleInputChange("avatar", "")
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      let avatarUrl = profileData.avatar
      
      // Jeśli wybrano nowy plik, konwertuj na base64
      if (avatarFile) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          avatarUrl = result
          
          // Zaktualizuj profil z nowym avatar
          updateProfile({
            name: profileData.name,
            avatar: avatarUrl
          })
          
          setIsSaving(false)
          alert("Profil został zaktualizowany!")
        }
        reader.readAsDataURL(avatarFile)
      } else {
        // Zaktualizuj profil bez zmiany avatara
        updateProfile({
          name: profileData.name,
          avatar: avatarUrl
        })
        
        setIsSaving(false)
        alert("Profil został zaktualizowany!")
      }
    } catch (error) {
      console.error("Błąd podczas zapisywania profilu:", error)
      setIsSaving(false)
      alert("Wystąpił błąd podczas zapisywania profilu")
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Ładowanie...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do chatu
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Mój profil</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informacje o profilu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Zdjęcie profilowe</Label>
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarPreview} alt={profileData.name || profileData.email} />
                  <AvatarFallback className="text-lg">
                    {getInitials(profileData.name, profileData.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Zmień zdjęcie
                      </span>
                    </Button>
                  </Label>
                  {avatarPreview && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={removeAvatar}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Usuń zdjęcie
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Imię i nazwisko</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Wprowadź swoje imię i nazwisko"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Adres email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Adres email nie może być zmieniony
                </p>
              </div>
            </div>

            <Separator />

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Zapisz zmiany
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Informacje o danych:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Wszystkie dane profilu są przechowywane lokalnie na Twoim urządzeniu</li>
                <li>Twoje dane nie są wysyłane na żaden zewnętrzny serwer</li>
                <li>Dane są automatycznie synchronizowane między sesjami</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
