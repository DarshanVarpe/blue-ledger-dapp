"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// This component is a wrapper around the provider from the next-themes library.
// We get the props type directly from the component itself for stability.
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

