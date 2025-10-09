import axios from 'axios'

// Create axios instance with base configuration
const getApiBaseURL = () => {
  // Check if we have an environment variable
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL
  }
  
  // Auto-detect the API URL based on current host
  const currentHost = window.location.hostname
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:5000/api'
  } else {
    // For network access, use the same host but port 5000
    return `http://${currentHost}:5000/api`
  }
}

const apiBaseURL = getApiBaseURL()
console.log('🔗 API Base URL:', apiBaseURL)

export const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lia-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.log('API Error:', error.response?.status, error.config?.url, error.config?.headers)
    if (error.response?.status === 401) {
      // Allow callers to opt out of automatic redirect on 401
      const skipAuthRedirect = !!(
        error.config?.headers?.['X-Skip-Auth-Redirect'] ||
        error.config?.headers?.['x-skip-auth-redirect']
      )
      console.log('401 error, skip redirect:', skipAuthRedirect)
      if (skipAuthRedirect) {
        return Promise.reject(error)
      }
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('lia-token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    
    // Handle rate limiting (429 errors)
    if (error.response?.status === 429) {
      console.warn('Rate limited - retrying request in 2 seconds...')
      // Retry the request after a delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(api.request(error.config))
        }, 2000)
      })
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.'
    }
    
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  getProfile: () =>
    api.get('/auth/me'),
  
  updateProfile: (userData: any) =>
    api.put('/auth/profile', userData),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
}

export const tasksAPI = {
  getTasks: (params?: any) =>
    api.get('/tasks', { params }),
  
  getTask: (id: string) =>
    api.get(`/tasks/${id}`),
  
  createTask: (taskData: any) =>
    api.post('/tasks', taskData),
  
  updateTask: (id: string, taskData: any) =>
    api.put(`/tasks/${id}`, taskData),
  
  deleteTask: (id: string) =>
    api.delete(`/tasks/${id}`),
  
  completeTask: (id: string) =>
    api.patch(`/tasks/${id}/complete`),
}

export const appointmentsAPI = {
  getAppointments: (params?: any) =>
    api.get('/appointments', { params }),
  
  getAppointment: (id: string) =>
    api.get(`/appointments/${id}`),
  
  createAppointment: (appointmentData: any) =>
    api.post('/appointments', appointmentData),
  
  updateAppointment: (id: string, appointmentData: any) =>
    api.put(`/appointments/${id}`, appointmentData),
  
  deleteAppointment: (id: string) =>
    api.delete(`/appointments/${id}`),
}

export const financeAPI = {
  getTransactions: (params?: any) =>
    api.get('/finance/transactions', { params }),
  
  getTransaction: (id: string) =>
    api.get(`/finance/transactions/${id}`),
  
  createTransaction: (transactionData: any) =>
    api.post('/finance/transactions', transactionData),
  
  updateTransaction: (id: string, transactionData: any) =>
    api.put(`/finance/transactions/${id}`, transactionData),
  
  deleteTransaction: (id: string) =>
    api.delete(`/finance/transactions/${id}`),
  
  getCategories: () =>
    api.get('/finance/categories'),
  
  getStats: (period?: string) =>
    api.get('/finance/stats', { params: { period } }),
}

export const notificationsAPI = {
  getNotifications: (params?: any) =>
    api.get('/notifications', { params }),
  
  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
  
  deleteNotification: (id: string) =>
    api.delete(`/notifications/${id}`),
  
  deleteAllNotifications: () =>
    api.delete('/notifications'),
  
  updatePreferences: (preferences: any) =>
    api.put('/notifications/preferences', preferences),
}

export const settingsAPI = {
  getSettings: () =>
    api.get('/settings'),
  
  updateSettings: (settings: any) =>
    api.put('/settings', settings),
  
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/settings/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  resetAccountData: () =>
    api.post('/settings/reset'),
}
