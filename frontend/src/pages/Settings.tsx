import { useState, useEffect } from 'react'
import {
  User,
  Bell,
  Palette,
  Shield,
  Camera,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Settings as SettingsIcon,
  Mail,
  Smartphone,
  MessageCircle,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { authAPI } from '../services/api'
import { settingsAPI } from '../services/api'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: false,
  })

  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const [notificationError, setNotificationError] = useState<string | null>(null)

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    language: 'en',
    timezone: 'UTC',
  })

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsAPI.getSettings()
        const settings = response.data.data

        if (settings) {
          setNotificationSettings({
            emailNotifications: settings.emailNotifications ?? true,
            smsNotifications: settings.smsNotifications ?? false,
            whatsappNotifications: settings.whatsappNotifications ?? false,
          })

          setPrivacySettings({
            profileVisibility: settings.profileVisibility ?? 'private',
            language: settings.language ?? 'en',
            timezone: settings.timezone ?? 'UTC',
          })
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    loadSettings()
  }, [])

  const handleNotificationSave = async () => {
    setNotificationLoading(true)
    setNotificationMessage(null)
    setNotificationError(null)

    try {
      await settingsAPI.updateSettings(notificationSettings)
      setNotificationMessage('Notification preferences updated successfully!')
      setTimeout(() => setNotificationMessage(null), 3000)
    } catch (error: any) {
      setNotificationError(error.response?.data?.error || 'Failed to update notification preferences')
      setTimeout(() => setNotificationError(null), 5000)
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      setProfileMessage(null)
      setProfileError(null)
      await updateUser({
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        // Email updates are not handled on this endpoint; kept for display only
      })
      setProfileMessage('Profile saved successfully.')
    } catch (error: any) {
      setProfileError('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords don't match")
      return
    }
    setLoading(true)
    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage('Password updated successfully.')
    } catch (err: any) {
      setPasswordError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', name: t('settings.profile'), icon: User },
    { id: 'notifications', name: t('settings.notifications'), icon: Bell },
    { id: 'appearance', name: t('settings.appearance'), icon: Palette },
    { id: 'privacy', name: t('settings.privacy'), icon: Shield },
  ]

  const handleResetAccount = async () => {
    const confirmed = window.confirm('This will permanently delete all your tasks, appointments, transactions, notifications and settings. This cannot be undone. Continue?')
    if (!confirmed) return
    try {
      setResetting(true)
      setResetMessage(null)
      const res = await settingsAPI.resetAccountData()
      setResetMessage(res.data?.message || 'Your account data has been reset.')
    } catch (err: any) {
      setResetMessage(err?.response?.data?.message || err?.response?.data?.error || 'Failed to reset account data.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('settings.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Download className="h-4 w-4 inline mr-2" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Enhanced Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <SettingsIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200 border border-primary-200 dark:border-primary-800'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Information Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Update your personal information and profile picture
                  </p>
                </div>
                <div className="p-6">
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Enhanced Profile Picture Section */}
                    <div className="flex items-center space-x-6">
                      <div className="relative group">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                            <User className="h-12 w-12 text-white" />
                          </div>
                        )}
                        <button
                          type="button"
                          className="absolute -bottom-2 -right-2 h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center hover:bg-primary-700 transition-all duration-200 shadow-lg group-hover:scale-110"
                        >
                          <Camera className="h-4 w-4 text-white" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {user?.firstName} {user?.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {user?.email}
                        </p>
                        <label className="inline-flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors duration-200">
                          <Upload className="h-4 w-4 mr-2" />
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              try {
                                setLoading(true)
                                const reader = new FileReader()
                                reader.onloadend = async () => {
                                  try {
                                    await updateUser({ avatar: String(reader.result) })
                                  } catch (_) { }
                                  setLoading(false)
                                }
                                reader.readAsDataURL(file)
                              } catch (_) {
                                setLoading(false)
                              }
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          JPG, PNG or GIF. Max size 2MB.
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>

                    {/* Status Messages */}
                    {profileMessage && (
                      <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-sm text-green-700 dark:text-green-300">{profileMessage}</span>
                      </div>
                    )}
                    {profileError && (
                      <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                        <span className="text-sm text-red-700 dark:text-red-300">{profileError}</span>
                      </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Change Password Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Update your password to keep your account secure
                  </p>
                </div>
                <div className="p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          id="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                          placeholder="Enter your current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                          placeholder="Enter new password"
                          required
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                          placeholder="Confirm new password"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Password Requirements:</h4>
                      <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• At least 6 characters long</li>
                        <li>• Mix of letters and numbers recommended</li>
                        <li>• Avoid common passwords</li>
                      </ul>
                    </div>

                    {/* Status Messages */}
                    {passwordMessage && (
                      <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-sm text-green-700 dark:text-green-300">{passwordMessage}</span>
                      </div>
                    )}
                    {passwordError && (
                      <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                        <span className="text-sm text-red-700 dark:text-red-300">{passwordError}</span>
                      </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose how you want to be notified about updates and reminders
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">
                          Email Notifications
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive notifications via email for tasks, appointments, and updates
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Smartphone className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">
                          SMS Notifications
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive urgent notifications via SMS text messages
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          smsNotifications: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* WhatsApp Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">
                          WhatsApp Notifications
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive notifications via WhatsApp for instant updates
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.whatsappNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          whatsappNotifications: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleNotificationSave}
                      disabled={notificationLoading}
                      className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {notificationLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </button>
                  </div>

                  {/* Status Messages */}
                  {notificationMessage && (
                    <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-sm text-green-700 dark:text-green-300">{notificationMessage}</span>
                    </div>
                  )}

                  {notificationError && (
                    <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      <span className="text-sm text-red-700 dark:text-red-300">{notificationError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Palette className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Customize the look and feel of your interface
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                      Theme Selection
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          id: 'light',
                          name: 'Light',
                          description: 'Clean and bright interface',
                          icon: '☀️',
                          preview: 'bg-white border-gray-200'
                        },
                        {
                          id: 'dark',
                          name: 'Dark',
                          description: 'Easy on the eyes for low light',
                          icon: '🌙',
                          preview: 'bg-gray-800 border-gray-700'
                        },
                        {
                          id: 'system',
                          name: 'System',
                          description: 'Follows your device settings',
                          icon: '⚙️',
                          preview: 'bg-gradient-to-br from-white to-gray-800 border-gray-300'
                        },
                      ].map((themeOption) => (
                        <button
                          key={themeOption.id}
                          onClick={() => setTheme(themeOption.id as 'light' | 'dark' | 'system')}
                          className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${theme === themeOption.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl mb-3">{themeOption.icon}</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {themeOption.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              {themeOption.description}
                            </div>
                            <div className={`w-full h-16 rounded-lg border ${themeOption.preview}`}></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Appearance Options */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                      Additional Options
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Font Size</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Adjust text size for better readability</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">A</span>
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                            <div className="h-2 bg-primary-600 rounded-full w-3/4"></div>
                          </div>
                          <span className="text-lg text-gray-500">A</span>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Compact Mode</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Reduce spacing for more content</p>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              {/* Privacy Settings Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Security</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage your privacy settings and data preferences
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Profile Visibility
                        </label>
                        <select
                          id="profileVisibility"
                          value={privacySettings.profileVisibility}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        >
                          <option value="private">Private</option>
                          <option value="public">Public</option>
                          <option value="friends">Friends Only</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.language')}
                        </label>
                        <select
                          id="language"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        >
                          <option value="en">English</option>
                          <option value="fr">Français</option>
                          <option value="es">Español</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        id="timezone"
                        value={privacySettings.timezone}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, timezone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800">
                <div className="p-6 border-b border-red-200 dark:border-red-800">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Irreversible actions that will permanently affect your account
                  </p>
                </div>
                <div className="p-6">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 className="text-base font-medium text-red-900 dark:text-red-200 mb-2">
                      Reset Account Data
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      This will permanently delete all your tasks, appointments, transactions, notifications and settings.
                      This action cannot be undone and will require you to set up your account again.
                    </p>

                    {resetMessage && (
                      <div className={`mb-4 p-3 rounded-lg ${resetMessage.includes('Failed')
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        }`}>
                        <div className="flex items-center">
                          {resetMessage.includes('Failed') ? (
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          )}
                          <span className={`text-sm ${resetMessage.includes('Failed')
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-green-700 dark:text-green-300'
                            }`}>
                            {resetMessage}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleResetAccount}
                      disabled={resetting}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {resetting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Reset Account Data
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
