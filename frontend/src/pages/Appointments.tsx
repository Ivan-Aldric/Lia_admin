import { useEffect, useState } from 'react'
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Search,
  Filter,
  Edit3,
  Eye,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { appointmentsAPI } from '../services/api'

export default function Appointments() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [viewMode, setViewMode] = useState('list') // list or calendar
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newAppt, setNewAppt] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    isAllDay: false,
  })

  // Statistics and chart data
  const [stats, setStats] = useState({
    totalAppointments: 0,
    confirmedAppointments: 0,
    scheduledAppointments: 0,
    cancelledAppointments: 0
  })

  const [chartData, setChartData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])

  // Chart colors
  const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#8B5CF6',
    secondary: '#6B7280'
  }

  const PIE_COLORS = [COLORS.success, COLORS.warning, COLORS.error, COLORS.secondary]

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        const params: any = {}
        if (filterStatus !== 'ALL') params.status = filterStatus
        const res = await appointmentsAPI.getAppointments(params)
        const appointmentsData = res.data?.data || []
        setAppointments(appointmentsData)

        // Calculate statistics
        const totalAppointments = appointmentsData.length
        const confirmedAppointments = appointmentsData.filter((a: any) => a.status === 'CONFIRMED').length
        const scheduledAppointments = appointmentsData.filter((a: any) => a.status === 'SCHEDULED').length
        const cancelledAppointments = appointmentsData.filter((a: any) => a.status === 'CANCELLED').length

        setStats({
          totalAppointments,
          confirmedAppointments,
          scheduledAppointments,
          cancelledAppointments
        })

        // Generate status distribution data for pie chart
        setStatusData([
          { name: 'Confirmed', value: confirmedAppointments, color: COLORS.success },
          { name: 'Scheduled', value: scheduledAppointments, color: COLORS.warning },
          { name: 'Cancelled', value: cancelledAppointments, color: COLORS.error },
          { name: 'Completed', value: appointmentsData.filter((a: any) => a.status === 'COMPLETED').length, color: COLORS.secondary }
        ])

        // Generate monthly appointment trend data
        const now = new Date()
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date(now)
          date.setMonth(date.getMonth() - (5 - i))
          const monthAppointments = appointmentsData.filter((appt: any) => {
            const appointmentDate = new Date(appt.startTime)
            return appointmentDate.getMonth() === date.getMonth() && 
                   appointmentDate.getFullYear() === date.getFullYear()
          })
          
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            appointments: monthAppointments.length,
            confirmed: monthAppointments.filter((a: any) => a.status === 'CONFIRMED').length,
            scheduled: monthAppointments.filter((a: any) => a.status === 'SCHEDULED').length
          }
        })
        setChartData(last6Months)

      } catch (_) {
        setAppointments([])
        setStats({ totalAppointments: 0, confirmedAppointments: 0, scheduledAppointments: 0, cancelledAppointments: 0 })
        setChartData([])
        setStatusData([])
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [filterStatus, COLORS.success, COLORS.warning, COLORS.error, COLORS.secondary])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }


  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || appointment.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const refresh = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterStatus !== 'ALL') params.status = filterStatus
      const res = await appointmentsAPI.getAppointments(params)
      setAppointments(res.data?.data || [])
    } catch (_) {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAppt.title.trim()) return
    // Build ISO strings
    const startISO = new Date(`${newAppt.startDate}T${newAppt.startTime || '09:00'}:00`).toISOString()
    const endISO = new Date(`${newAppt.endDate || newAppt.startDate}T${newAppt.endTime || '10:00'}:00`).toISOString()
    try {
      setCreating(true)
      setCreateError(null)
      await appointmentsAPI.createAppointment({
        title: newAppt.title.trim(),
        description: newAppt.description.trim() || undefined,
        startTime: startISO,
        endTime: endISO,
        location: newAppt.location.trim() || undefined,
        isAllDay: newAppt.isAllDay,
      })
      setShowAdd(false)
      setNewAppt({ title: '', description: '', startDate: '', startTime: '', endDate: '', endTime: '', location: '', isAllDay: false })
      await refresh()
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to create appointment.')
    } finally {
      setCreating(false)
    }
  }

  // Helpers to split ISO into date/time inputs
  const toDateValue = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  const toTimeValue = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mi}`
  }

  // Edit state
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editAppt, setEditAppt] = useState<any | null>(null)

  const openEdit = (appt: any) => {
    setEditAppt({
      id: appt.id,
      title: appt.title || '',
      description: appt.description || '',
      location: appt.location || '',
      startDate: toDateValue(appt.startTime),
      startTime: toTimeValue(appt.startTime),
      endDate: toDateValue(appt.endTime),
      endTime: toTimeValue(appt.endTime),
      status: appt.status || 'SCHEDULED',
      isAllDay: appt.isAllDay || false,
    })
    setEditError(null)
    setShowEdit(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editAppt) return
    const startISO = new Date(`${editAppt.startDate}T${editAppt.startTime || '09:00'}:00`).toISOString()
    const endISO = new Date(`${editAppt.endDate || editAppt.startDate}T${editAppt.endTime || '10:00'}:00`).toISOString()
    try {
      setEditing(true)
      setEditError(null)
      await appointmentsAPI.updateAppointment(editAppt.id, {
        title: editAppt.title.trim(),
        description: editAppt.description.trim() || undefined,
        startTime: startISO,
        endTime: endISO,
        location: editAppt.location.trim() || undefined,
        isAllDay: !!editAppt.isAllDay,
        status: editAppt.status,
      })
      setShowEdit(false)
      setEditAppt(null)
      await refresh()
    } catch (err: any) {
      setEditError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to update appointment.')
    } finally {
      setEditing(false)
    }
  }

  // View state
  const [showView, setShowView] = useState(false)
  const [viewAppt, setViewAppt] = useState<any | null>(null)
  const openView = (appt: any) => {
    setViewAppt(appt)
    setShowView(true)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Appointment Management
          </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Schedule, manage, and track your appointments
          </p>
        </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAdd(true)} 
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
          Schedule Appointment
        </button>
      </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Appointments</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {stats.totalAppointments}
              </p>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 text-primary-500 mr-1" />
                <span className="text-sm text-primary-600 dark:text-primary-400">All time</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/20">
              <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                {stats.confirmedAppointments}
              </p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600 dark:text-success-400">+8%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-success-100 dark:bg-success-900/20">
              <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Scheduled</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {stats.scheduledAppointments}
              </p>
              <div className="flex items-center mt-2">
                <AlertCircle className="h-4 w-4 text-warning-500 mr-1" />
                <span className="text-sm text-warning-600 dark:text-warning-400">Pending</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-warning-100 dark:bg-warning-900/20">
              <Clock className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cancelled</p>
              <p className="text-2xl font-bold text-error-600 dark:text-error-400">
                {stats.cancelledAppointments}
              </p>
              <div className="flex items-center mt-2">
                <ArrowDownRight className="h-4 w-4 text-error-500 mr-1" />
                <span className="text-sm text-error-600 dark:text-error-400">-2%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-error-100 dark:bg-error-900/20">
              <XCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Appointment Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointment Trends</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last 6 months</p>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="appointmentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#f9fafb'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="appointments" 
                stroke={COLORS.primary} 
                fillOpacity={1} 
                fill="url(#appointmentGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="confirmed" 
                stroke={COLORS.success} 
                fillOpacity={1} 
                fill={COLORS.success + '20'} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status Distribution</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current breakdown</p>
            </div>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#f9fafb'
                }} 
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Add Appointment Modal */}
      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule New Appointment</h3>
            <button 
              onClick={() => setShowAdd(false)} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  value={newAppt.title} 
                  onChange={(e) => setNewAppt({ ...newAppt, title: e.target.value })} 
                  required 
                  placeholder="Enter appointment title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  value={newAppt.location} 
                  onChange={(e) => setNewAppt({ ...newAppt, location: e.target.value })} 
                  placeholder="Enter location"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={newAppt.startDate} 
                    onChange={(e) => setNewAppt({ ...newAppt, startDate: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={newAppt.startTime} 
                    onChange={(e) => setNewAppt({ ...newAppt, startTime: e.target.value })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={newAppt.endDate} 
                    onChange={(e) => setNewAppt({ ...newAppt, endDate: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={newAppt.endTime} 
                    onChange={(e) => setNewAppt({ ...newAppt, endTime: e.target.value })} 
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                rows={3}
                value={newAppt.description} 
                onChange={(e) => setNewAppt({ ...newAppt, description: e.target.value })} 
                placeholder="Enter appointment description"
              />
            </div>
            {createError && (
              <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-error-500 mr-2" />
                  <span className="text-sm text-error-600 dark:text-error-400">{createError}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setShowAdd(false)} 
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={creating} 
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Appointment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col gap-6">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1 sm:w-64">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex-1 sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View Mode</label>
              <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              <button
                onClick={() => setViewMode('list')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                  <div className="flex items-center justify-center">
                    <Filter className="h-4 w-4 mr-2" />
                    List View
                  </div>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                  <div className="flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar View
                  </div>
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments - List or Calendar */}
      {viewMode === 'list' ? (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by scheduling your first appointment.'}
              </p>
              {!searchTerm && filterStatus === 'ALL' && (
                <button 
                  onClick={() => setShowAdd(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Schedule First Appointment
                </button>
              )}
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {appointment.title}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium w-fit ${
                          appointment.status === 'CONFIRMED' 
                            ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200' :
                          appointment.status === 'SCHEDULED' 
                            ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200' :
                          appointment.status === 'CANCELLED' 
                            ? 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {appointment.status === 'CONFIRMED' && <CheckCircle className="h-4 w-4 mr-1" />}
                          {appointment.status === 'SCHEDULED' && <Clock className="h-4 w-4 mr-1" />}
                          {appointment.status === 'CANCELLED' && <XCircle className="h-4 w-4 mr-1" />}
                          {appointment.status}
                        </span>
                      </div>
                      
                      {appointment.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {appointment.description}
                      </p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                            <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Date</p>
                            <p className="text-gray-900 dark:text-white font-medium">{formatDate(appointment.startTime)}</p>
                        </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
                            <Clock className="h-4 w-4 text-warning-600 dark:text-warning-400" />
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Time</p>
                            <p className="text-gray-900 dark:text-white font-medium">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</p>
                          </div>
                        </div>
                        {appointment.location && (
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-success-100 dark:bg-success-900/20 rounded-lg">
                              <MapPin className="h-4 w-4 text-success-600 dark:text-success-400" />
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Location</p>
                              <p className="text-gray-900 dark:text-white font-medium truncate">{appointment.location}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-info-100 dark:bg-info-900/20 rounded-lg">
                            <Users className="h-4 w-4 text-info-600 dark:text-info-400" />
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Attendees</p>
                            <p className="text-gray-900 dark:text-white font-medium">{appointment.attendees?.length || 0} people</p>
                          </div>
                        </div>
                      </div>

                      {/* Attendees */}
                      {appointment.attendees && appointment.attendees.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Attendees
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {appointment.attendees.map((attendee: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                              >
                                <span className="text-sm text-gray-900 dark:text-white font-medium">
                                  {attendee.name}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  attendee.status === 'CONFIRMED'
                                    ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                                    : attendee.status === 'PENDING'
                                    ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                }`}>
                                  {attendee.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 lg:w-48">
                      <button 
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors inline-flex items-center justify-center" 
                        onClick={() => openEdit(appointment)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button 
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center justify-center" 
                        onClick={() => openView(appointment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {appointment.status === 'CANCELLED' ? 'Reschedule' : 'View'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Calendar Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calendar View</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>Next 30 days</span>
              </div>
            </div>
          </div>

          {/* Agenda-style calendar: next 30 days grouped */}
          {(() => {
            const today = new Date()
            const days: string[] = []
            for (let i = 0; i < 30; i++) {
              const d = new Date(today)
              d.setDate(today.getDate() + i)
              days.push(d.toISOString().slice(0, 10))
            }
            const byDay: Record<string, any[]> = {}
            for (const appt of filteredAppointments) {
              const key = new Date(appt.startTime).toISOString().slice(0, 10)
              if (!byDay[key]) byDay[key] = []
              byDay[key].push(appt)
            }
            return days.map((day) => (
              <div key={day} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(day)}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(day).toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                      {(byDay[day]?.length || 0)} appointment{(byDay[day]?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {(byDay[day] && byDay[day].length > 0) ? (
                    <div className="space-y-4">
                      {byDay[day].map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-semibold text-gray-900 dark:text-white">{appointment.title}</h5>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'CONFIRMED' 
                                  ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200' :
                                appointment.status === 'SCHEDULED' 
                                  ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200' :
                                appointment.status === 'CANCELLED' 
                                  ? 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                            </div>
                              {appointment.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span className="truncate max-w-32">{appointment.location}</span>
                          </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button 
                              className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm" 
                              onClick={() => openEdit(appointment)}
                            >
                              Edit
                            </button>
                            <button 
                              className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm" 
                              onClick={() => openView(appointment)}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No appointments scheduled</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          })()}
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEdit && editAppt && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Appointment</h3>
            <button 
              onClick={() => { setShowEdit(false); setEditAppt(null) }} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  value={editAppt.title} 
                  onChange={(e) => setEditAppt({ ...editAppt, title: e.target.value })} 
                  required 
                  placeholder="Enter appointment title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  value={editAppt.location} 
                  onChange={(e) => setEditAppt({ ...editAppt, location: e.target.value })} 
                  placeholder="Enter location"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={editAppt.startDate} 
                    onChange={(e) => setEditAppt({ ...editAppt, startDate: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={editAppt.startTime} 
                    onChange={(e) => setEditAppt({ ...editAppt, startTime: e.target.value })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={editAppt.endDate} 
                    onChange={(e) => setEditAppt({ ...editAppt, endDate: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={editAppt.endTime} 
                    onChange={(e) => setEditAppt({ ...editAppt, endTime: e.target.value })} 
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  value={editAppt.status} 
                  onChange={(e) => setEditAppt({ ...editAppt, status: e.target.value })}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  rows={3}
                  value={editAppt.description} 
                  onChange={(e) => setEditAppt({ ...editAppt, description: e.target.value })} 
                  placeholder="Enter appointment description"
                />
              </div>
            </div>
            {editError && (
              <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-error-500 mr-2" />
                  <span className="text-sm text-error-600 dark:text-error-400">{editError}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => { setShowEdit(false); setEditAppt(null) }} 
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={editing} 
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {editing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Appointment Modal */}
      {showView && viewAppt && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{viewAppt.title}</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                viewAppt.status === 'CONFIRMED' 
                  ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200' :
                viewAppt.status === 'SCHEDULED' 
                  ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200' :
                viewAppt.status === 'CANCELLED' 
                  ? 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {viewAppt.status === 'CONFIRMED' && <CheckCircle className="h-4 w-4 mr-1" />}
                {viewAppt.status === 'SCHEDULED' && <Clock className="h-4 w-4 mr-1" />}
                {viewAppt.status === 'CANCELLED' && <XCircle className="h-4 w-4 mr-1" />}
                {viewAppt.status}
              </span>
            </div>
            <button 
              onClick={() => setShowView(false)} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatDate(viewAppt.startTime)}</p>
        </div>
          </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-warning-600 dark:text-warning-400" />
          </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatTime(viewAppt.startTime)} - {formatTime(viewAppt.endTime)}</p>
        </div>
          </div>
            {viewAppt.location && (
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-success-600 dark:text-success-400" />
          </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-gray-900 dark:text-white font-medium">{viewAppt.location}</p>
        </div>
          </div>
            )}
          </div>
          
          {viewAppt.description && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Description</h4>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {viewAppt.description}
              </p>
        </div>
          )}

          {/* Attendees */}
          {viewAppt.attendees && viewAppt.attendees.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Attendees</h4>
              <div className="flex flex-wrap gap-2">
                {viewAppt.attendees.map((attendee: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {attendee.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      attendee.status === 'CONFIRMED'
                        ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                        : attendee.status === 'PENDING'
                        ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                    }`}>
                      {attendee.status}
                    </span>
          </div>
                ))}
          </div>
        </div>
          )}

          <div className="flex items-center gap-3 justify-end">
            <button 
              onClick={() => setShowView(false)} 
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={() => { setShowView(false); openEdit(viewAppt) }} 
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Appointment
            </button>
      </div>
        </div>
      )}
    </div>
  )
}
