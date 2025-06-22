import { createContext, useContext, ReactNode } from 'react'

interface AppContextType {
  ragAvailable: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
  ragAvailable: boolean
}

export function AppProvider({ children, ragAvailable }: AppProviderProps) {
  return (
    <AppContext.Provider value={{ ragAvailable }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export function useAppContextSafe() {
  const context = useContext(AppContext)
  return context ?? { ragAvailable: false }
}
