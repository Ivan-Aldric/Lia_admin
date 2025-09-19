import { useState } from 'react'
import { 
  BookOpen, 
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code,
  Database,
  Settings,
  Users,
  BarChart3,
  Calendar,
  CheckSquare,
  DollarSign,
  Bell,
  FileText,
  Video,
  Download
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function Documentation() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started')

  const sections = [
    {
      id: 'getting-started',
      title: t('docs.gettingStarted'),
      icon: BookOpen,
      articles: [
        { title: t('docs.quickStart'), href: '#', type: 'guide' },
        { title: t('docs.installation'), href: '#', type: 'guide' },
        { title: t('docs.firstSteps'), href: '#', type: 'tutorial' },
        { title: t('docs.accountSetup'), href: '#', type: 'tutorial' }
      ]
    },
    {
      id: 'features',
      title: t('docs.features'),
      icon: Settings,
      articles: [
        { title: t('docs.taskManagement'), href: '#', type: 'guide' },
        { title: t('docs.appointmentScheduling'), href: '#', type: 'guide' },
        { title: t('docs.financialTracking'), href: '#', type: 'guide' },
        { title: t('docs.notificationSystem'), href: '#', type: 'guide' }
      ]
    },
    {
      id: 'api',
      title: t('docs.apiReference'),
      icon: Code,
      articles: [
        { title: t('docs.authentication'), href: '#', type: 'reference' },
        { title: t('docs.endpoints'), href: '#', type: 'reference' },
        { title: t('docs.webhooks'), href: '#', type: 'reference' },
        { title: t('docs.rateLimiting'), href: '#', type: 'reference' }
      ]
    },
    {
      id: 'integrations',
      title: t('docs.integrations'),
      icon: ExternalLink,
      articles: [
        { title: t('docs.calendarSync'), href: '#', type: 'guide' },
        { title: t('docs.emailIntegration'), href: '#', type: 'guide' },
        { title: t('docs.thirdPartyApps'), href: '#', type: 'guide' }
      ]
    },
    {
      id: 'troubleshooting',
      title: t('docs.troubleshooting'),
      icon: Settings,
      articles: [
        { title: t('docs.commonIssues'), href: '#', type: 'troubleshooting' },
        { title: t('docs.errorCodes'), href: '#', type: 'reference' },
        { title: t('docs.performanceTips'), href: '#', type: 'guide' }
      ]
    }
  ]

  const quickLinks = [
    { title: t('docs.userGuide'), href: '#', icon: FileText },
    { title: t('docs.videoTutorials'), href: '#', icon: Video },
    { title: t('docs.apiDocs'), href: '#', icon: Code },
    { title: t('docs.downloadPdf'), href: '#', icon: Download }
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'tutorial': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'reference': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'troubleshooting': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('docs.title')}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('docs.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('docs.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('docs.quickLinks')}
            </h2>
            <div className="space-y-2">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
                >
                  <link.icon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {link.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {/* Documentation Sections */}
            {sections.map((section) => (
              <div
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <section.icon className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                  {expandedSection === section.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                
                {expandedSection === section.id && (
                  <div className="px-6 pb-4">
                    <div className="space-y-2">
                      {section.articles.map((article, index) => (
                        <a
                          key={index}
                          href={article.href}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
                        >
                          <span className="text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                            {article.title}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(article.type)}`}>
                              {article.type}
                            </span>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Getting Started Card */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-700">
              <div className="flex items-start">
                <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-4 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-primary-900 dark:text-primary-100 mb-2">
                    {t('docs.newToLiaAdmin')}
                  </h3>
                  <p className="text-primary-800 dark:text-primary-200 mb-4">
                    {t('docs.gettingStartedDescription')}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="#"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                    >
                      {t('docs.startHere')}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center px-4 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                    >
                      {t('docs.watchTutorial')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
