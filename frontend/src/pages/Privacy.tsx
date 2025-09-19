import { useState } from 'react'
import { 
  Shield, 
  Calendar,
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function Privacy() {
  const { t } = useLanguage()
  const [expandedSection, setExpandedSection] = useState<string | null>('data-collection')

  const sections = [
    {
      id: 'data-collection',
      title: t('privacy.dataCollection'),
      icon: FileText,
      content: t('privacy.dataCollectionContent')
    },
    {
      id: 'data-usage',
      title: t('privacy.dataUsage'),
      icon: CheckCircle,
      content: t('privacy.dataUsageContent')
    },
    {
      id: 'data-sharing',
      title: t('privacy.dataSharing'),
      icon: Shield,
      content: t('privacy.dataSharingContent')
    },
    {
      id: 'data-security',
      title: t('privacy.dataSecurity'),
      icon: Shield,
      content: t('privacy.dataSecurityContent')
    },
    {
      id: 'user-rights',
      title: t('privacy.userRights'),
      icon: CheckCircle,
      content: t('privacy.userRightsContent')
    },
    {
      id: 'cookies',
      title: t('privacy.cookies'),
      icon: Info,
      content: t('privacy.cookiesContent')
    },
    {
      id: 'third-party',
      title: t('privacy.thirdParty'),
      icon: AlertTriangle,
      content: t('privacy.thirdPartyContent')
    },
    {
      id: 'updates',
      title: t('privacy.updates'),
      icon: Calendar,
      content: t('privacy.updatesContent')
    }
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('privacy.title')}
          </h1>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                {t('privacy.lastUpdated')}
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                {t('privacy.effectiveDate')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('privacy.introduction')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('privacy.introductionContent')}
        </p>
      </div>

      {/* Privacy Sections */}
      <div className="space-y-6">
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
              <div className="px-6 pb-6">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Information */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 mt-8 border border-primary-200 dark:border-primary-700">
        <div className="flex items-start">
          <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-4 mt-1" />
          <div>
            <h3 className="text-xl font-semibold text-primary-900 dark:text-primary-100 mb-2">
              {t('privacy.contactUs')}
            </h3>
            <p className="text-primary-800 dark:text-primary-200 mb-4">
              {t('privacy.contactDescription')}
            </p>
            <div className="space-y-2">
              <p className="text-primary-700 dark:text-primary-300">
                <strong>{t('privacy.email')}:</strong> privacy@liaadmin.com
              </p>
              <p className="text-primary-700 dark:text-primary-300">
                <strong>{t('privacy.address')}:</strong> {t('privacy.companyAddress')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Download PDF */}
      <div className="mt-8 text-center">
        <a
          href="#"
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          <Download className="h-5 w-5 mr-2" />
          {t('privacy.downloadPdf')}
        </a>
      </div>
    </div>
  )
}
