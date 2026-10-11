import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

export type Language = "en-US" | "pt-BR"

const LanguageContext = createContext<{
  language: Language
  setLanguage: (language: Language) => void
}>({ language: "en-US", setLanguage: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem("ai-intro-language") === "pt-BR" ? "pt-BR" : "en-US"
    } catch {
      return "en-US"
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("ai-intro-language", language)
    } catch {
      // The selection remains usable when browser storage is unavailable.
    }
  }, [language])
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
