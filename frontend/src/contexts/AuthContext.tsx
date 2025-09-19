import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('lia-token')
    if (token) {
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Fetch user data
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      // Clear invalid token
      localStorage.removeItem('lia-token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data
      
      // Store token
      localStorage.setItem('lia-token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Set user
      setUser(user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/auth/register', userData)
      const { token, user } = response.data
      
      // Store token
      localStorage.setItem('lia-token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Set user
      setUser(user)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = () => {
    // Clear token and user
    localStorage.removeItem('lia-token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await api.put('/auth/profile', userData)
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
