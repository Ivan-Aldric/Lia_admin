import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar - Fixed */}
        <Sidebar />
        
        {/* Main content - Scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Header - Fixed */}
          <Header />
          
          {/* Page content - Scrollable */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
