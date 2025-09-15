import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const success = await login(email, password)
      if (success) {
        router.push("/")
      } else {
        setError("Nieprawidłowy email lub hasło")
      }
    } catch (error) {
      setError("Wystąpił błąd podczas logowania")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6", className)} {...props}>
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Zaloguj się do swojego konta</CardTitle>
          <CardDescription className="text-sm">
            Wprowadź swój email poniżej, aby się zalogować
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 sm:gap-6">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="grid gap-2 sm:gap-3">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 sm:h-10 text-base sm:text-sm"
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2 sm:gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-sm font-medium">Hasło</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-xs sm:text-sm underline-offset-4 hover:underline text-muted-foreground"
                  >
                    Zapomniałeś hasła?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={isLoading}
                  className="h-11 sm:h-10 text-base sm:text-sm"
                  autoComplete="current-password"
                />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Logowanie...
                    </>
                  ) : (
                    "Zaloguj się"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
