"use client"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-foreground">
            Witaj z powrotem
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Zaloguj się, aby kontynuować
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}