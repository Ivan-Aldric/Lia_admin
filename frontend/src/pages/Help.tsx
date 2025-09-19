import { useState } from 'react'
import { 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  Phone, 
  Clock, 
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  Users
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function Help() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const faqs = [
    {
      id: 1,
      question: t('help.faq1.question'),
      answer: t('help.faq1.answer')
    },
    {
      id: 2,
      question: t('help.faq2.question'),
      answer: t('help.faq2.answer')
    },
    {
      id: 3,
      question: t('help.faq3.question'),
      answer: t('help.faq3.answer')
    },
    {
      id: 4,
      question: t('help.faq4.question'),
      answer: t('help.faq4.answer')
    },
    {
      id: 5,
      question: t('help.faq5.question'),
      answer: t('help.faq5.answer')
    }
  ]

  const contactMethods = [
    {
      icon: Mail,
      title: t('help.emailSupport'),
      description: t('help.emailDescription'),
      action: t('help.sendEmail'),
      href: 'mailto:support@liaadmin.com'
    },
    {
      icon: MessageCircle,
      title: t('help.liveChat'),
      description: t('help.liveChatDescription'),
      action: t('help.startChat'),
      href: '#'
    },
    {
      icon: Phone,
      title: t('help.phoneSupport'),
      description: t('help.phoneDescription'),
      action: t('help.callNow'),
      href: 'tel:+1234567890'
    }
  ]

  const resources = [
    {
      icon: BookOpen,
      title: t('help.userGuide'),
      description: t('help.userGuideDescription'),
      href: '/app/docs'
    },
    {
      icon: Video,
      title: t('help.videoTutorials'),
      description: t('help.videoTutorialsDescription'),
      href: '#'
    },
    {
      icon: FileText,
      title: t('help.apiDocumentation'),
      description: t('help.apiDocumentationDescription'),
      href: '#'
    },
    {
      icon: Users,
      title: t('help.communityForum'),
      description: t('help.communityForumDescription'),
      href: '#'
    }
  ]

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <HelpCircle className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('help.title')}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('help.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('help.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Support */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t('help.contactSupport')}
            </h2>
            <div className="space-y-4">
              {contactMethods.map((method, index) => (
                <a
                  key={index}
                  href={method.href}
                  className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
                >
                  <method.icon className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {method.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {method.description}
                    </p>
                    <span className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-2 inline-flex items-center">
                      {method.action}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Start */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('help.quickStart')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.href}
                  className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
                >
                  <resource.icon className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {resource.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t('help.frequentlyAskedQuestions')}
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    {expandedFaq === faq.id ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Support Hours */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-700">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-2" />
              <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                {t('help.supportHours')}
              </h3>
            </div>
            <div className="text-primary-800 dark:text-primary-200">
              <p className="font-medium">{t('help.weekdays')}</p>
              <p className="text-sm">{t('help.weekend')}</p>
              <p className="text-sm mt-2">{t('help.responseTime')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
