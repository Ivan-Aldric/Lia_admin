import React, { useState, useEffect, useRef } from 'react'
import { Bot, X, ChevronUp, ChevronDown, RefreshCw, TrendingUp, Calendar, CheckCircle, AlertCircle, DollarSign, Clock, Send, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'

interface AccountSummary {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  totalAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  totalIncome: number
  totalExpenses: number
  netSavings: number
  unreadNotifications: number
  recentActivity: Array<{
    type: 'task' | 'appointment' | 'transaction' | 'notification'
    title: string
    date: string
    status?: string
  }>
  insights: string[]
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  data?: any
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [summary, setSummary] = useState<AccountSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatMode, setChatMode] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [usingTestData, setUsingTestData] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/dashboard/auth-status')
      return response.data.authenticated
    } catch (error) {
      console.log('Auth check failed:', error)
      return false
    }
  }

  const fetchAccountSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated first
      const isAuthenticated = await checkAuthStatus()
      console.log('Authentication status:', isAuthenticated)
      
      let response
      let usingTestData = false
      
      if (isAuthenticated) {
        try {
          // Try the main endpoint with real data
          response = await api.get('/dashboard/ai-summary')
          console.log('✅ Using real user data from main endpoint')
          console.log('Real data response:', response.data)
        } catch (error: any) {
          console.log('Main endpoint failed, falling back to test data:', error.response?.status)
          console.log('Error details:', error.response?.data)
          response = await api.get('/dashboard/test-ai-summary')
          usingTestData = true
        }
      } else {
        // Not authenticated, use test data
        response = await api.get('/dashboard/test-ai-summary')
        usingTestData = true
        console.log('⚠️ Not authenticated - using test data')
      }
      
      setSummary(response.data.data)
      setUsingTestData(usingTestData)
    } catch (err: any) {
      console.error('Failed to fetch account summary:', err)
      
      // Fallback to basic summary if both endpoints fail
      const fallbackSummary = {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalAppointments: 0,
        upcomingAppointments: 0,
        completedAppointments: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        unreadNotifications: 0,
        recentActivity: [],
        insights: ["Unable to load your data. Please check your connection and try again."]
      }
      
      setSummary(fallbackSummary)
      setError(null) // Clear error since we have fallback data
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAccountSummary()
      if (chatMode && messages.length === 0) {
        // Add welcome message when entering chat mode
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'ai',
          content: "Hello! I'm your AI assistant. I can help you analyze your tasks, appointments, finances, and provide insights about your productivity. What would you like to know?",
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
      }
    }
  }, [isOpen, chatMode])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      console.log('Sending message to AI:', userMessage.content)
      
      // Try the main endpoint first
      let response
      try {
        response = await api.post('/dashboard/ai-chat', {
          message: userMessage.content,
          context: summary
        })
      } catch (authError: any) {
        console.log('Main endpoint failed, trying test endpoint:', authError.response?.status)
        
        // If authentication fails, try the test endpoint
        if (authError.response?.status === 401) {
          response = await api.post('/dashboard/test-ai-chat', {
            message: userMessage.content
          })
        } else {
          throw authError
        }
      }

      console.log('AI Response:', response.data)
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.data.response,
        timestamp: new Date(),
        data: response.data.data
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error: any) {
      console.error('Failed to send message:', error)
      console.error('Error details:', error.response?.data || error.message)
      
      let errorContent = "I'm sorry, I encountered an error processing your message. Please try again."
      
      if (error.response?.status === 401) {
        errorContent = "Please log in to use the AI assistant with your real data, or try asking a general question."
      } else if (error.response?.status === 500) {
        errorContent = "There's a server error. Please try again in a moment."
      } else if (error.message?.includes('Network Error')) {
        errorContent = "Unable to connect to the server. Please check your connection."
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: errorContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleChatMode = () => {
    setChatMode(!chatMode)
    if (!chatMode) {
      setIsExpanded(true)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'in_progress': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
      case 'overdue': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      case 'confirmed': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle className="w-4 h-4" />
      case 'appointment': return <Calendar className="w-4 h-4" />
      case 'transaction': return <DollarSign className="w-4 h-4" />
      case 'notification': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* AI Assistant Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot className="w-6 h-6" />
        {summary && summary.unreadNotifications > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {summary.unreadNotifications > 9 ? '9+' : summary.unreadNotifications}
          </div>
        )}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          AI Assistant
        </div>
      </motion.button>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <div className="flex flex-col">
                    <h3 className="font-semibold">
                      {chatMode ? 'AI Chat' : 'AI Assistant'}
                    </h3>
                    {usingTestData && (
                      <span className="text-xs text-yellow-200 opacity-75">
                        Demo Mode
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleChatMode}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title={chatMode ? 'Switch to Summary' : 'Start Chat'}
                  >
                    {chatMode ? <TrendingUp className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                  </button>
                  {!chatMode && (
                    <button
                      onClick={fetchAccountSummary}
                      disabled={loading}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-hidden flex flex-col">
              {chatMode ? (
                /* Chat Interface */
                <div className="flex flex-col h-96">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            message.type === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex space-x-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about your data..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        disabled={isTyping}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Summary Interface */
                <div className="p-4 max-h-96 overflow-y-auto">
                  {usingTestData && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">
                          Showing demo data. <button 
                            onClick={() => window.location.href = '/login'} 
                            className="underline hover:no-underline font-medium"
                          >
                            Log in
                          </button> to see your real data.
                        </span>
                      </div>
                    </div>
                  )}
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Analyzing your account...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                      <button
                        onClick={fetchAccountSummary}
                        className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Try again
                      </button>
                    </div>
                  ) : summary ? (
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Tasks</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        {summary.completedTasks}/{summary.totalTasks}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        {summary.overdueTasks > 0 && `${summary.overdueTasks} overdue`}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">Appointments</span>
                      </div>
                      <div className="text-lg font-bold text-green-900 dark:text-green-100">
                        {summary.completedAppointments}/{summary.totalAppointments}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        {summary.upcomingAppointments} upcoming
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Financial Health</span>
                    </div>
                    <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                      ${summary.netSavings.toLocaleString()}
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300">
                      Income: ${summary.totalIncome.toLocaleString()} | Expenses: ${summary.totalExpenses.toLocaleString()}
                    </div>
                  </div>

                  {/* AI Insights */}
                  {summary.insights && summary.insights.length > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bot className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">AI Insights</span>
                      </div>
                      <div className="space-y-1">
                        {summary.insights.slice(0, isExpanded ? summary.insights.length : 2).map((insight, index) => (
                          <p key={index} className="text-xs text-purple-800 dark:text-purple-200">
                            • {insight}
                          </p>
                        ))}
                        {summary.insights.length > 2 && !isExpanded && (
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            +{summary.insights.length - 2} more insights
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  {isExpanded && summary.recentActivity && summary.recentActivity.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Recent Activity</span>
                      </div>
                      <div className="space-y-2">
                        {summary.recentActivity.slice(0, 5).map((activity, index) => (
                          <div key={index} className="flex items-center space-x-2 text-xs">
                            {getActivityIcon(activity.type)}
                            <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">
                              {activity.title}
                            </span>
                            {activity.status && (
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(activity.status)}`}>
                                {activity.status}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AIAssistant
