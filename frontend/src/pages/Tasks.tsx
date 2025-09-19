import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter,
  Flag,
  Target,
  Activity
} from 'lucide-react'
import { tasksAPI } from '../services/api'

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createErrorDetails, setCreateErrorDetails] = useState<string[]>([])
  const [showEdit, setShowEdit] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const params: any = {}
        if (filterStatus !== 'ALL') params.status = filterStatus
        if (filterPriority !== 'ALL') params.priority = filterPriority
        const res = await tasksAPI.getTasks(params)
        const list = res.data?.data || []
        setTasks(list)
      } catch (_) {
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [filterStatus, filterPriority])

  const refreshTasks = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterStatus !== 'ALL') params.status = filterStatus
      if (filterPriority !== 'ALL') params.priority = filterPriority
      const res = await tasksAPI.getTasks(params)
      setTasks(res.data?.data || [])
    } catch (_) {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    try {
      setCreating(true)
      setCreateError(null)
      setCreateErrorDetails([])
      await tasksAPI.createTask({
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
      })
      setShowAdd(false)
      setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '' })
      refreshTasks()
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error
      const details = err?.response?.data?.details
      setCreateError(apiMsg || 'Failed to create task. Please try again.')
      if (Array.isArray(details)) {
        setCreateErrorDetails(details.map((d: any) => d.msg || JSON.stringify(d)))
      }
    } finally {
      setCreating(false)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="h-4 w-4 text-error-500" />
      case 'MEDIUM':
        return <Clock className="h-4 w-4 text-warning-500" />
      case 'LOW':
        return <CheckSquare className="h-4 w-4 text-success-500" />
      default:
        return <CheckSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-error-500 bg-error-50 dark:bg-error-900/20'
      case 'MEDIUM':
        return 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20'
      case 'LOW':
        return 'border-l-success-500 bg-success-50 dark:bg-success-900/20'
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-700'
    }
  }

  const getTaskCardColor = (task: any) => {
    if (task.status === 'COMPLETED') {
      // Use a consistent completed style regardless of priority
      return 'border-l-success-500 bg-success-50 dark:bg-success-900/20'
    }
    return getPriorityColor(task.priority)
  }


  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const toDateInputValue = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const openEdit = (task: any) => {
    setEditingTask({
      ...task,
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      dueDate: toDateInputValue(task.dueDate),
      status: task.status || 'PENDING',
    })
    setUpdateError(null)
    setShowEdit(true)
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return
    if (!String(editingTask.title).trim()) return
    try {
      setUpdating(true)
      setUpdateError(null)
      await tasksAPI.updateTask(editingTask.id, {
        title: String(editingTask.title).trim(),
        description: String(editingTask.description || '').trim() || undefined,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate || undefined,
        status: editingTask.status,
      })
      setShowEdit(false)
      setEditingTask(null)
      refreshTasks()
    } catch (err: any) {
      setUpdateError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update task.')
    } finally {
      setUpdating(false)
    }
  }

  const handleCompleteToggle = async (task: any) => {
    try {
      setLoading(true)
      if (task.status === 'COMPLETED') {
        await tasksAPI.updateTask(task.id, {
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate ? toDateInputValue(task.dueDate) : undefined,
          status: 'PENDING',
        })
      } else {
        await tasksAPI.completeTask(task.id)
      }
      await refreshTasks()
    } catch (_) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Task Management
          </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Organize, track, and complete your tasks efficiently
          </p>
        </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdd(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
          Add Task
        </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/20">
              <Target className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {tasks.filter(t => t.status === 'PENDING').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-warning-100 dark:bg-warning-900/20">
              <Clock className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {tasks.filter(t => t.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/20">
              <Activity className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                {tasks.filter(t => t.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success-100 dark:bg-success-900/20">
              <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Task</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new task to your list</p>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Title</label>
                <input
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                  required
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                <select
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                    <option value="HIGH">🔴 High Priority</option>
                    <option value="MEDIUM">🟡 Medium Priority</option>
                    <option value="LOW">🟢 Low Priority</option>
                </select>
              </div>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                <input
                  type="date"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <input
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Optional description"
                />
              </div>
            </div>
            {createError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">{createError}</div>
                {createErrorDetails.length > 0 && (
                    <ul className="list-disc pl-5 text-xs text-red-500 dark:text-red-400 mt-2">
                    {createErrorDetails.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEdit && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Task</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Update task details</p>
            </div>
            <form onSubmit={handleUpdateTask} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Title</label>
                <input
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    placeholder="Enter task title"
                  required
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                <select
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                >
                    <option value="HIGH">🔴 High Priority</option>
                    <option value="MEDIUM">🟡 Medium Priority</option>
                    <option value="LOW">🟢 Low Priority</option>
                </select>
              </div>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                <input
                  type="date"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={editingTask.dueDate}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={editingTask.status}
                onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
            </div>
            {updateError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">{updateError}</div>
                </div>
              )}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowEdit(false); setEditingTask(null) }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none min-w-[140px]"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="relative">
              <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none min-w-[140px]"
              >
                <option value="ALL">All Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterStatus !== 'ALL' || filterPriority !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first task.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 ${getTaskCardColor(task)} transition-all duration-200 hover:shadow-md`}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center space-x-2">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          getPriorityIcon(task.priority)
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${task.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          task.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {task.description}
                    </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      {task.category && <span>Category: {task.category}</span>}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span>Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-4">
                    <button
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      onClick={() => openEdit(task)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
                      onClick={() => handleCompleteToggle(task)}
                      disabled={loading}
                    >
                      {loading ? 'Please wait…' : (task.status === 'COMPLETED' ? 'Reopen' : 'Complete')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
