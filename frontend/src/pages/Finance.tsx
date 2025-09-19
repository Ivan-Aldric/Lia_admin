import { useEffect, useState } from 'react'
import { financeAPI } from '../services/api'
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Search,
  CreditCard,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  XCircle
} from 'lucide-react'

export default function Finance() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterPeriod, setFilterPeriod] = useState('month')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newTx, setNewTx] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE',
    date: '',
    category: '',
    description: '',
  })

  // Financial statistics
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    transactionCount: 0
  })

  const formatFCFA = (amount: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
      .format(Math.abs(amount)) + ' FCFA'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch transactions
        const params: any = {}
        if (filterType !== 'ALL') params.type = filterType
        const transactionsRes = await financeAPI.getTransactions(params)
        const transactionsData = transactionsRes.data?.data || []
        setTransactions(transactionsData)

        // Fetch financial statistics
        const statsRes = await financeAPI.getStats(filterPeriod)
        console.log('Finance stats response:', statsRes.data)
        if (statsRes.data?.data) {
          const data = statsRes.data.data
          console.log('Finance stats data:', data)
          setStats({
            totalIncome: data.totalIncome || 0,
            totalExpenses: data.totalExpenses || 0,
            netIncome: data.netIncome || 0,
            transactionCount: data.transactionCount || 0
          })
        } else {
          console.log('No stats data received, using fallback calculation')
          // Fallback: calculate stats from transactions
          const totalIncome = transactionsData
            .filter((t: any) => t.type === 'INCOME')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0)
          
          const totalExpenses = transactionsData
            .filter((t: any) => t.type === 'EXPENSE')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0)
          
          setStats({
            totalIncome,
            totalExpenses,
            netIncome: totalIncome - totalExpenses,
            transactionCount: transactionsData.length
          })
        }
      } catch (_) {
        setTransactions([])
        setStats({ totalIncome: 0, totalExpenses: 0, netIncome: 0, transactionCount: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [filterType, filterPeriod])

  const refresh = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterType !== 'ALL') params.type = filterType
      const res = await financeAPI.getTransactions(params)
      setTransactions(res.data?.data || [])
    } catch (_) {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTx.title.trim()) return
    const amountNumber = Number(newTx.amount)
    if (Number.isNaN(amountNumber)) {
      setCreateError('Amount must be a number')
      return
    }
    try {
      setCreating(true)
      setCreateError(null)
      await financeAPI.createTransaction({
        title: newTx.title.trim(),
        amount: amountNumber,
        type: newTx.type,
        date: newTx.date || new Date().toISOString(),
        category: newTx.category || 'General',
        description: newTx.description.trim() || undefined,
      })
      setShowAdd(false)
      setNewTx({ title: '', amount: '', type: 'EXPENSE', date: '', category: '', description: '' })
      await refresh()
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to add transaction.')
    } finally {
      setCreating(false)
    }
  }

  // Edit state
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editTx, setEditTx] = useState<any | null>(null)

  const openEdit = (tx: any) => {
    setEditTx({
      id: tx.id,
      title: tx.title || '',
      amount: String(tx.amount ?? ''),
      type: tx.type || 'EXPENSE',
      date: tx.date ? new Date(tx.date).toISOString().slice(0, 10) : '',
      category: tx.category || '',
      description: tx.description || '',
    })
    setEditError(null)
    setShowEdit(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTx) return
    const amountNumber = Number(editTx.amount)
    if (Number.isNaN(amountNumber)) {
      setEditError('Amount must be a number')
      return
    }
    try {
      setEditing(true)
      setEditError(null)
      await financeAPI.updateTransaction(editTx.id, {
        title: editTx.title.trim(),
        amount: amountNumber,
        type: editTx.type,
        date: editTx.date || new Date().toISOString(),
        category: editTx.category || 'General',
        description: editTx.description.trim() || undefined,
      })
      setShowEdit(false)
      setEditTx(null)
      await refresh()
    } catch (err: any) {
      setEditError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to update transaction.')
    } finally {
      setEditing(false)
    }
  }

  // View state
  const [showView, setShowView] = useState(false)
  const [viewTx, setViewTx] = useState<any | null>(null)
  const openView = (tx: any) => {
    setViewTx(tx)
    setShowView(true)
  }

  const categories = ['Salary', 'Food & Dining', 'Housing', 'Freelance', 'Utilities', 'Investments', 'Transportation', 'Entertainment']

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return <TrendingUp className="h-4 w-4 text-success-500" />
      case 'EXPENSE':
        return <TrendingDown className="h-4 w-4 text-error-500" />
      case 'TRANSFER':
        return <DollarSign className="h-4 w-4 text-primary-500" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'border-l-success-500 bg-success-50 dark:bg-success-900/20'
      case 'EXPENSE':
        return 'border-l-error-500 bg-error-50 dark:bg-error-900/20'
      case 'TRANSFER':
        return 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20'
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-700'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF',
      currencyDisplay: 'code',
      maximumFractionDigits: 0,
    })
      .format(Math.abs(amount))
      .replace('XAF', 'FCFA')
      .trim()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'ALL' || transaction.type === filterType
    
    return matchesSearch && matchesType
  })


  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Financial Management
          </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your income, expenses, and financial health
          </p>
        </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAdd(true)} 
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
          Add Transaction
        </button>
          </div>
        </div>
      </div>

      {/* Financial Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                {formatFCFA(stats.totalIncome)}
              </p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600 dark:text-success-400">+12%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-success-100 dark:bg-success-900/20">
              <TrendingUp className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-error-600 dark:text-error-400">
                {formatFCFA(stats.totalExpenses)}
              </p>
              <div className="flex items-center mt-2">
                <ArrowDownRight className="h-4 w-4 text-error-500 mr-1" />
                <span className="text-sm text-error-600 dark:text-error-400">-5%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-error-100 dark:bg-error-900/20">
              <TrendingDown className="h-6 w-6 text-error-600 dark:text-error-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Net Income</p>
              <p className={`text-2xl font-bold ${stats.netIncome >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                {formatFCFA(stats.netIncome)}
              </p>
              <div className="flex items-center mt-2">
                {stats.netIncome >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-success-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-error-500 mr-1" />
                )}
                <span className={`text-sm ${stats.netIncome >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                  {stats.netIncome >= 0 ? '+8%' : '-3%'}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${stats.netIncome >= 0 ? 'bg-success-100 dark:bg-success-900/20' : 'bg-error-100 dark:bg-error-900/20'}`}>
              <Wallet className={`h-6 w-6 ${stats.netIncome >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`} />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {stats.transactionCount}
              </p>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 text-primary-500 mr-1" />
                <span className="text-sm text-primary-600 dark:text-primary-400">This month</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/20">
              <CreditCard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Transaction</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Record a new financial transaction</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={newTx.title} 
                    onChange={(e) => setNewTx({ ...newTx, title: e.target.value })} 
                    placeholder="Transaction title"
                    required 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={newTx.amount} 
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} 
                    placeholder="e.g. 10000" 
                    required 
                  />
              </div>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={newTx.type} 
                    onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                  >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={newTx.date} 
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={newTx.category} 
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })} 
                    placeholder="e.g. Food & Dining" 
                  />
              </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  value={newTx.description} 
                  onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} 
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              {createError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">{createError}</div>
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
                  {creating ? 'Adding...' : 'Add Transaction'}
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
                placeholder="Search transactions by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-4 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none min-w-[140px]"
              >
                <option value="ALL">All Types</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="pl-4 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none min-w-[140px]"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterType !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first transaction.'}
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 ${getTypeColor(transaction.type)} transition-all duration-200 hover:shadow-md`}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(transaction.type)}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {transaction.title}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'INCOME'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : transaction.type === 'EXPENSE'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {transaction.type}
                      </span>
                    </div>
                    
                    {transaction.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {transaction.description}
                    </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Category: {transaction.category || 'General'}</span>
                      <span>Date: {formatDate(transaction.date)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-4">
                    <div className="text-left sm:text-right">
                      <p className={`text-xl font-bold ${
                        transaction.type === 'INCOME'
                          ? 'text-success-600 dark:text-success-400'
                          : transaction.type === 'EXPENSE'
                          ? 'text-error-600 dark:text-error-400'
                          : 'text-primary-600 dark:text-primary-400'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button 
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium" 
                        onClick={() => openEdit(transaction)}
                      >
                        Edit
                      </button>
                      <button 
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium" 
                        onClick={() => openView(transaction)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Transaction Modal */}
      {showEdit && editTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Transaction</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Update transaction details</p>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={editTx.title} 
                    onChange={(e) => setEditTx({ ...editTx, title: e.target.value })} 
                    required 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={editTx.amount} 
                    onChange={(e) => setEditTx({ ...editTx, amount: e.target.value })} 
                    required 
                  />
              </div>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={editTx.type} 
                    onChange={(e) => setEditTx({ ...editTx, type: e.target.value })}
                  >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={editTx.date} 
                    onChange={(e) => setEditTx({ ...editTx, date: e.target.value })} 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={editTx.category} 
                    onChange={(e) => setEditTx({ ...editTx, category: e.target.value })} 
                  />
              </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  value={editTx.description} 
                  onChange={(e) => setEditTx({ ...editTx, description: e.target.value })} 
                  rows={3}
                />
              </div>
              {editError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">{editError}</div>
            </div>
              )}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => { setShowEdit(false); setEditTx(null) }} 
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editing} 
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* View Transaction Modal */}
      {showView && viewTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{viewTx.title}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                    viewTx.type === 'INCOME'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : viewTx.type === 'EXPENSE'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {viewTx.type}
                  </span>
                </div>
                <button 
                  onClick={() => setShowView(false)} 
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</p>
                  <p className={`text-2xl font-bold ${
                    viewTx.type === 'INCOME'
                      ? 'text-success-600 dark:text-success-400'
                      : viewTx.type === 'EXPENSE'
                      ? 'text-error-600 dark:text-error-400'
                      : 'text-primary-600 dark:text-primary-400'
                  }`}>
                    {viewTx.type === 'INCOME' ? '+' : viewTx.type === 'EXPENSE' ? '-' : ''}
                    {formatCurrency(viewTx.amount)}
                  </p>
                </div>
            <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(viewTx.date)}</p>
            </div>
          </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewTx.category || 'General'}</p>
          </div>
          {viewTx.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white">{viewTx.description}</p>
                </div>
          )}
            </div>
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mt-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Categories</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Quick access to categorized transactions</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 text-left min-h-[80px]"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {category}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {transactions.filter(t => t.category === category).length} transactions
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
