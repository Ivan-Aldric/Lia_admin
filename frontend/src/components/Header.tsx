import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Settings, 
  ChevronDown,
  Clock,
  X,
  CheckSquare,
  Calendar,
  DollarSign,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { notificationsAPI, tasksAPI, appointmentsAPI, financeAPI } from '../services/api'

export default function Header() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
    navigate('/login')
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex] as 'light' | 'dark' | 'system')
  }

  const goToNotifications = () => {
    setIsNotificationsOpen(false)
    navigate('/app/notifications')
  }

  const goToProfileSettings = () => {
    setIsProfileOpen(false)
    navigate('/app/settings')
  }

  const goToAccountSettings = () => {
    setIsProfileOpen(false)
    navigate('/app/settings')
  }

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearchOpen(false)
      return
    }

    setSearchLoading(true)
    try {
      const [tasksRes, appointmentsRes, transactionsRes] = await Promise.all([
        tasksAPI.getTasks({ search: query, limit: 5 }).catch(() => ({ data: { data: [] } })),
        appointmentsAPI.getAppointments({ search: query, limit: 5 }).catch(() => ({ data: { data: [] } })),
        financeAPI.getTransactions({ search: query, limit: 5 }).catch(() => ({ data: { data: [] } }))
      ])

      const results = [
        ...(tasksRes.data?.data || []).map((item: any) => ({
          ...item,
          type: 'task',
          icon: CheckSquare,
          title: item.title,
          subtitle: item.description || `${t('tasks.status')}: ${item.status}`,
          href: '/app/tasks'
        })),
        ...(appointmentsRes.data?.data || []).map((item: any) => ({
          ...item,
          type: 'appointment',
          icon: Calendar,
          title: item.title,
          subtitle: item.location || `${t('appointments.status')}: ${item.status}`,
          href: '/app/appointments'
        })),
        ...(transactionsRes.data?.data || []).map((item: any) => ({
          ...item,
          type: 'transaction',
          icon: DollarSign,
          title: item.title,
          subtitle: `${item.type} - ${item.amount} FCFA`,
          href: '/app/finance'
        }))
      ]

      setSearchResults(results)
      setIsSearchOpen(true)
      setSelectedResultIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedResultIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
          handleResultClick(searchResults[selectedResultIndex])
        }
        break
      case 'Escape':
        setIsSearchOpen(false)
        setSearchQuery('')
        inputRef.current?.blur()
        break
    }
  }

  const handleResultClick = (result: any) => {
    navigate(result.href)
    setIsSearchOpen(false)
    setSearchQuery('')
    inputRef.current?.blur()
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    setNotificationsLoading(true)
    try {
      const response = await notificationsAPI.getNotifications({ limit: 5 })
      const notificationData = response.data.data
      setNotifications(notificationData.notifications || [])
      setUnreadCount(notificationData.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      // Set fallback data
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setNotificationsLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId)
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  // Load notifications when component mounts and when dropdown opens
  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications()
    }
  }, [isNotificationsOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notification-dropdown') && 
          !target.closest('.profile-dropdown') && 
          !target.closest('.search-dropdown')) {
        setIsNotificationsOpen(false)
        setIsProfileOpen(false)
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Search - Enhanced */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full search-dropdown">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t('common.search') + ' tasks, appointments, transactions...'}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchQuery && setIsSearchOpen(true)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {searchLoading && (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                )}
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">⌘K</kbd>
              </div>

              {/* Search Results Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result, index) => {
                        const IconComponent = result.icon
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-3 ${
                              index === selectedResultIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                            }`}
                          >
                            <IconComponent className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {highlightText(result.title, searchQuery)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {result.subtitle}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </button>
                        )
                      })}
                    </div>
                  ) : searchQuery && !searchLoading ? (
                    <div className="px-4 py-8 text-center">
                      <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('common.noResults')} "{searchQuery}"
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Empty space to push buttons to right */}
          <div className="md:hidden flex-1"></div>

          {/* Right side - Enhanced */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle - Enhanced */}
            <button
              onClick={cycleTheme}
              className="group p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md"
              title={`Current theme: ${theme}`}
            >
              <div className="relative">
              {getThemeIcon()}
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
              </div>
            </button>

            {/* Notifications - Enhanced */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="group p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md relative"
              >
                <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                {/* Notification badge - Enhanced */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
                )}
                {notificationsLoading && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-gray-400 text-white text-xs rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  </div>
                )}
              </button>

              {/* Notifications dropdown - Enhanced */}
              {isNotificationsOpen && (
                <div className="notification-dropdown absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 backdrop-blur-sm">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                          <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200"
                            title="Mark all as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setIsNotificationsOpen(false)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Bell className="h-8 w-8 text-gray-400" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No notifications</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.map((notification: any) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
                            !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              !notification.isRead 
                                ? 'bg-blue-100 dark:bg-blue-900/30' 
                                : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              <Bell className={`h-4 w-4 ${
                                !notification.isRead 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    {notification.title}
                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                    {notification.message}
                      </div>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      markAsRead(notification.id)
                                    }}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
                                  >
                                    <Check className="h-3 w-3 text-gray-400" />
                                  </button>
                                </div>
                      </div>
                      </div>
                    </div>
                  </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <button 
                      onClick={goToNotifications} 
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200"
                    >
                      <Bell className="h-4 w-4" />
                      <span>View all notifications</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile - Enhanced */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="group flex items-center space-x-3 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md"
              >
                <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.firstName}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                  />
                ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                      <span className="text-white font-semibold text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                  </div>
                )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" />
              </button>

              {/* Profile dropdown - Enhanced */}
              {isProfileOpen && (
                <div className="profile-dropdown absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 backdrop-blur-sm">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.firstName}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-primary-200 dark:ring-primary-800"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center ring-2 ring-primary-200 dark:ring-primary-800">
                            <span className="text-white font-semibold text-lg">
                              {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                          Online
                        </div>
                      </div>
                      <button
                        onClick={() => setIsProfileOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="py-2">
                    <button 
                      onClick={goToProfileSettings} 
                      className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button 
                      onClick={goToAccountSettings} 
                      className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Account Settings</span>
                    </button>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
