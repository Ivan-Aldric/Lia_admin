import { useEffect, useState } from 'react'
import { 
  Bell, 
  Check, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  Mail,
  Smartphone,
  MessageCircle
} from 'lucide-react'
import { notificationsAPI } from '../services/api'

export default function Notifications() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'deleteAll'
    id?: string
    title?: string
  } | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await notificationsAPI.getNotifications()
      setItems(res.data?.data || [])
    } catch (_) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markAllAsRead = async () => {
    try {
      setBulkActionLoading('mark-all-read')
      await notificationsAPI.markAllAsRead()
      // Update local state immediately for better UX
      setItems(items.map(item => ({ ...item, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      load() // Reload to get accurate state
    } finally {
      setBulkActionLoading(null)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      setActionLoading(id)
      await notificationsAPI.markAsRead(id)
      // Update local state immediately for better UX
      setItems(items.map(item => 
        item.id === id ? { ...item, isRead: true } : item
      ))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // Reload to get accurate state
      load()
    } finally {
      setActionLoading(null)
    }
  }

  const deleteNotification = async (id: string) => {
    const notification = items.find(item => item.id === id)
    setConfirmAction({
      type: 'delete',
      id: id,
      title: notification?.title || 'this notification'
    })
    setShowConfirmModal(true)
  }

  const confirmDeleteNotification = async () => {
    if (!confirmAction || !confirmAction.id) return
    
    try {
      setActionLoading(confirmAction.id)
      await notificationsAPI.deleteNotification(confirmAction.id)
      // Remove from local state after successful deletion
      setItems(items.filter(item => item.id !== confirmAction.id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
      // You could add a toast notification here to show the error
    } finally {
      setActionLoading(null)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  const deleteAllNotifications = async () => {
    setConfirmAction({
      type: 'deleteAll'
    })
    setShowConfirmModal(true)
  }

  const confirmDeleteAllNotifications = async () => {
    if (!confirmAction || confirmAction.type !== 'deleteAll') return
    
    try {
      setBulkActionLoading('delete-all')
      await notificationsAPI.deleteAllNotifications()
      setItems([])
    } catch (error) {
      console.error('Failed to delete all notifications:', error)
      load() // Reload to get accurate state
    } finally {
      setBulkActionLoading(null)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />
      case 'sms':
        return <Smartphone className="h-5 w-5 text-green-500" />
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5 text-green-500" />
      case 'task':
        return <CheckCircle className="h-5 w-5 text-primary-500" />
      case 'appointment':
        return <Calendar className="h-5 w-5 text-purple-500" />
      case 'finance':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationType = (notification: any) => {
    if (notification.type) return notification.type
    if (notification.title?.toLowerCase().includes('task')) return 'task'
    if (notification.title?.toLowerCase().includes('appointment')) return 'appointment'
    if (notification.title?.toLowerCase().includes('finance')) return 'finance'
    return 'general'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return date.toLocaleDateString()
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.body?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'UNREAD' && !item.isRead) ||
      (filterStatus === 'READ' && item.isRead)
    
    const matchesType = filterType === 'ALL' || 
      getNotificationType(item).toLowerCase() === filterType.toLowerCase()
    
    return matchesSearch && matchesStatus && matchesType
  })

  const unreadCount = items.filter(item => !item.isRead).length

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Stay updated with the latest alerts and updates
            </p>
        </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={load}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Refresh
            </button>
            <button 
              onClick={markAllAsRead} 
              disabled={bulkActionLoading === 'mark-all-read'}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkActionLoading === 'mark-all-read' ? (
                <RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 inline mr-2" />
              )}
              {bulkActionLoading === 'mark-all-read' ? 'Processing...' : 'Mark all as read'}
            </button>
            <button 
              onClick={deleteAllNotifications} 
              disabled={bulkActionLoading === 'delete-all'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkActionLoading === 'delete-all' ? (
                <RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 inline mr-2" />
              )}
              {bulkActionLoading === 'delete-all' ? 'Deleting...' : 'Delete all'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</p>
            </div>
            <Bell className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Unread</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{unreadCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Read</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{items.length - unreadCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Today</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {items.filter(item => {
                  const today = new Date()
                  const itemDate = new Date(item.createdAt)
                  return itemDate.toDateString() === today.toDateString()
                }).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value="ALL">All Status</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="lg:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value="ALL">All Types</option>
              <option value="TASK">Tasks</option>
              <option value="APPOINTMENT">Appointments</option>
              <option value="FINANCE">Finance</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || filterStatus !== 'ALL' || filterType !== 'ALL' 
                ? 'No notifications found' 
                : 'No notifications'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterStatus !== 'ALL' || filterType !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'You\'re all caught up! New notifications will appear here.'}
            </p>
          </div>
        ) : (
          filteredItems.map((notification) => {
            const notificationType = getNotificationType(notification)
            const isUnread = !notification.isRead
            
            return (
              <div 
                key={notification.id} 
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md ${
                  isUnread ? 'border-l-4 border-l-primary-500 bg-primary-50/30 dark:bg-primary-900/10' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notificationType)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {notification.title || 'Notification'}
                          </h3>
                          {isUnread && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                              New
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {notification.message || notification.body || 'No message content'}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="capitalize">{notificationType}</span>
                          </div>
                        </div>
                </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {isUnread && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            disabled={actionLoading === notification.id}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/20 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === notification.id ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            {actionLoading === notification.id ? 'Processing...' : 'Mark Read'}
                          </button>
                        )}
                        
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          disabled={actionLoading === notification.id}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === notification.id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" />
                          )}
                          {actionLoading === notification.id ? 'Deleting...' : 'Delete'}
                        </button>
                </div>
              </div>
            </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Professional Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => {
                setShowConfirmModal(false)
                setConfirmAction(null)
              }}
            ></div>

            {/* Modal panel */}
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {confirmAction.type === 'deleteAll' ? 'Delete All Notifications' : 'Delete Notification'}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {confirmAction.type === 'deleteAll' 
                    ? 'Are you sure you want to delete all notifications? This action cannot be undone and will permanently remove all your notifications.'
                    : `Are you sure you want to delete "${confirmAction.title}"? This action cannot be undone.`
                  }
                </p>

                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false)
                      setConfirmAction(null)
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={confirmAction.type === 'deleteAll' ? confirmDeleteAllNotifications : confirmDeleteNotification}
                    disabled={bulkActionLoading === 'delete-all' || (confirmAction.id ? actionLoading === confirmAction.id : false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {bulkActionLoading === 'delete-all' || (confirmAction.id && actionLoading === confirmAction.id) ? (
                      <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </div>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


