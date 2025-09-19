import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Appointments from './pages/Appointments'
import Finance from './pages/Finance'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Help from './pages/Help'
import Documentation from './pages/Documentation'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'
import './i18n'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
            {/* Protected routes */}
            <Route path="/app" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="finance" element={<Finance />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route path="help" element={<Help />} />
              <Route path="docs" element={<Documentation />} />
              <Route path="privacy" element={<Privacy />} />
            </Route>
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
