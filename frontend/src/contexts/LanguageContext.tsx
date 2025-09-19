import React, { createContext, useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string, options?: any) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: React.ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n, t } = useTranslation()
  const [language, setLanguageState] = useState(i18n.language || 'en')

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage && savedLanguage !== language) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    // Update language state when i18n language changes
    setLanguageState(i18n.language)
  }, [i18n.language])

  const value = {
    language,
    setLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
