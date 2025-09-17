"use client"

import { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthSessionProvider } from "@/components/auth/session-provider"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthSessionProvider>
      <ThemeProvider
        defaultTheme="light"
        storageKey="naly-ui-theme"
      >
        {children}
      </ThemeProvider>
    </AuthSessionProvider>
  )
}