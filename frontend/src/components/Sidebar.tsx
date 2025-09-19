import { NavLink } from 'react-router-dom'
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  Settings, 
  Bell,
  Menu,
  X,
  FileText,
  Shield,
  HelpCircle,
  LogOut
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { notificationsAPI } from '../services/api'

const getNavigation = (t: (key: string) => string) => [
  { 
    name: t('navigation.dashboard'), 
    href: '/app', 
    icon: Home, 
    description: t('dashboard.overview'),
    hasBadge: false
  },
  { 
    name: t('navigation.tasks'), 
    href: '/app/tasks', 
    icon: CheckSquare, 
    description: t('tasks.title'),
    hasBadge: false
  },
  { 
    name: t('navigation.appointments'), 
    href: '/app/appointments', 
    icon: Calendar, 
    description: t('appointments.title'),
    hasBadge: false
  },
  { 
    name: t('navigation.finance'), 
    href: '/app/finance', 
    icon: DollarSign, 
    description: t('finance.title'),
    hasBadge: false
  },
  { 
    name: t('navigation.notifications'), 
    href: '/app/notifications', 
    icon: Bell, 
    description: t('notifications.title'),
    hasBadge: true
  },
  { 
    name: t('navigation.settings'), 
    href: '/app/settings', 
    icon: Settings, 
    description: t('settings.title'),
    hasBadge: false
  },
]

const getSecondaryNavigation = (t: (key: string) => string) => [
  { name: t('help.title'), href: '/app/help', icon: HelpCircle },
  { name: t('docs.title'), href: '/app/docs', icon: FileText },
  { name: t('privacy.title'), href: '/app/privacy', icon: Shield },
]

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  
  const navigation = getNavigation(t)
  const secondaryNavigation = getSecondaryNavigation(t)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      setNotificationsLoading(true)
      const response = await notificationsAPI.getNotifications({ limit: 1 })
      const notificationData = response.data.data
      setUnreadCount(notificationData.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
      setUnreadCount(0)
    } finally {
      setNotificationsLoading(false)
    }
  }

  // Fetch notifications on component mount and set up polling
  useEffect(() => {
    if (user) {
      fetchNotificationCount()
      
      // Set up polling every 30 seconds to check for new notifications
      const interval = setInterval(fetchNotificationCount, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  // Listen for focus events to refresh notifications when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchNotificationCount()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  // Handle navigation click to refresh notifications
  const handleNavigationClick = (href: string) => {
    setIsMobileMenuOpen(false)
    if (href === '/app/notifications') {
      // Refresh notification count when navigating to notifications page
      fetchNotificationCount()
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:w-72
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
            <div className="flex items-center space-x-3">
              <div className="relative">
              <img
                src="/Logo.png"
                alt="LIA Admin Logo"
                  className="w-10 h-10 rounded-xl object-cover shadow-md"
              />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                LIA Admin
              </span>
                <p className="text-xs text-gray-600 dark:text-gray-400">Management System</p>
              </div>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.firstName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                  onClick={() => handleNavigationClick(item.href)}
                className={({ isActive }) =>
                    `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200 shadow-sm border border-primary-200 dark:border-primary-700'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:shadow-sm'
                    }`
                  }
                >
                  <div className="relative">
                    <item.icon className={`mr-4 h-5 w-5 transition-colors duration-200 ${
                      'group-hover:scale-110'
                    }`} />
                    {item.hasBadge && unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {item.hasBadge && notificationsLoading && (
                      <div className="absolute -top-2 -right-2 h-5 w-5 bg-gray-400 text-white text-xs rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Secondary Navigation */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              {secondaryNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
            </div>
          </div>

          {/* Logout Section */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>© 2025 LIA Admin Assistant</p>
              <p className="mt-1">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
