"use client"

import type React from "react"
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion"
import { ArrowRight, CheckSquare, Calendar, DollarSign, Bell, Sparkles, Star, Users, Shield, Zap, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"
import { useRef } from "react"

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // 3D parallax transforms
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400])
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 15])
  const rotateY = useTransform(scrollYProgress, [0, 1], [0, -10])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  // Mouse movement for 3D effects
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateXMouse = useTransform(mouseY, [-300, 300], [10, -10])
  const rotateYMouse = useTransform(mouseX, [-300, 300], [-10, 10])

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(event.clientX - centerX)
    mouseY.set(event.clientY - centerY)
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <motion.div
          style={{ y: y1, rotateX, rotateY }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            rotateX: [0, 20, 0],
            rotateY: [0, -20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          style={{ y: y2, scale }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400/30 to-rose-600/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            rotateZ: [0, 45, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* 3D Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-lg"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-30, 30, -30],
              x: [-20, 20, -20],
              rotateX: [0, 360, 0],
              rotateY: [0, -360, 0],
              scale: [0.8, 1.2, 0.8],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <motion.nav
        initial={{ y: -100, opacity: 0, rotateX: -90 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ duration: 1, type: "spring", stiffness: 100 }}
        style={{
          rotateX: rotateXMouse,
          rotateY: rotateYMouse,
          transformStyle: "preserve-3d",
        }}
        className="relative z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{
                scale: 1.1,
                rotateY: 15,
                z: 50,
                transition: { type: "spring", stiffness: 300 },
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                className="w-8 h-8 rounded-lg shadow-lg flex items-center justify-center overflow-hidden"
                animate={{
                  rotateY: [0, 360],
                  rotateX: [0, 20, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <img 
                  src="/Logo.png" 
                  alt="LIA Admin Logo" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">LIA Admin</span>
            </motion.div>
            <div className="flex items-center ml-auto space-x-2 sm:space-x-4">
              <motion.div
                whileHover={{
                  scale: 1.05,
                  rotateX: 10,
                  z: 30,
                  transition: { type: "spring", stiffness: 400 },
                }}
              >
                <Link to="/login" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 font-medium">Sign In</Link>
              </motion.div>
              <motion.div
                whileHover={{
                  scale: 1.1,
                  rotateY: 10,
                  rotateX: -5,
                  z: 50,
                  boxShadow: "0 20px 40px rgba(249, 115, 22, 0.3)",
                  transition: { type: "spring", stiffness: 300 },
                }}
                whileTap={{ scale: 0.95, rotateX: 5 }}
              >
                <Link to="/register" className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-4 py-2 sm:px-6 rounded-lg font-semibold shadow-lg transition-all duration-300 text-sm sm:text-base">Get Started</Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20"
        style={{
          rotateX: rotateXMouse,
          rotateY: rotateYMouse,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 50, rotateX: -45 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.2, type: "spring", stiffness: 80 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.span
              animate={{
                rotateY: [0, 5, 0, -5, 0],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="inline-block bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            >
              Your Life Admin
            </motion.span>
            <motion.span
              className="text-orange-600 dark:text-orange-400 block"
              animate={{
                rotateX: [0, 10, 0, -10, 0],
                textShadow: [
                  "0 0 0px rgba(249, 115, 22, 0)",
                  "0 0 20px rgba(249, 115, 22, 0.5)",
                  "0 0 0px rgba(249, 115, 22, 0)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              Assistant
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30, rotateX: -30 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            Transform your daily life with our comprehensive admin platform. Manage tasks, appointments, finances, and notifications all in one powerful, intelligent system.
          </motion.p>

          {/* Hero Image Section */}
          <motion.div
            className="mb-12 flex justify-center"
            initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              className="relative"
              whileHover={{
                scale: 1.05,
                rotateY: 10,
                rotateX: 5,
                transition: { type: "spring", stiffness: 300 }
              }}
            >
              <img 
                src="/image.png" 
                alt="LIA Admin - Digital Life Management" 
                className="w-full max-w-4xl h-auto rounded-2xl shadow-2xl border border-white/20"
                style={{ transform: "translateZ(20px)" }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-orange-600/20 to-transparent rounded-2xl"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 40, rotateX: -20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              whileHover={{
                scale: 1.1,
                rotateY: 15,
                rotateX: -10,
                z: 50,
                boxShadow: "0 25px 50px rgba(249, 115, 22, 0.4)",
                transition: { type: "spring", stiffness: 300 },
              }}
              whileTap={{ scale: 0.95, rotateX: 5 }}
            >
                <Link to="/register" className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-xl inline-flex items-center group">
                Start Free Trial
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.div>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{
                scale: 1.05,
                rotateY: -10,
                rotateX: 5,
                z: 30,
                transition: { type: "spring", stiffness: 300 },
              }}
            >
              <Link to="/login" className="border-2 border-gray-300 dark:border-gray-600 hover:border-orange-500 text-gray-700 dark:text-gray-300 hover:text-orange-600 px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300">Sign In</Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Users, value: "10K+", label: "Active Users" },
            { icon: CheckSquare, value: "50K+", label: "Tasks Completed" },
            { icon: Calendar, value: "25K+", label: "Appointments" },
            { icon: TrendingUp, value: "99%", label: "Satisfaction Rate" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
            >
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </motion.div>
              <motion.h3
                className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                viewport={{ once: true }}
              >
                {stat.value}
              </motion.h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20"
        initial={{ opacity: 0, rotateX: 45 }}
        whileInView={{ opacity: 1, rotateX: 0 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50, rotateX: -30 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Everything you need to manage your life
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Powerful features designed to make your life more organized, efficient, and stress-free
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: CheckSquare,
              title: "Task Management",
              description: "Organize and track your tasks with priority levels, due dates, categories, and progress tracking. Never miss a deadline again.",
              color: "from-blue-500 to-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              icon: Calendar,
              title: "Appointment Scheduling",
              description: "Schedule and manage appointments with smart reminders, attendee management, and calendar integration.",
              color: "from-emerald-500 to-emerald-600",
              bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
            },
            {
              icon: DollarSign,
              title: "Financial Management",
              description: "Track income, expenses, and financial goals with detailed analytics and budget insights.",
              color: "from-amber-500 to-amber-600",
              bgColor: "bg-amber-50 dark:bg-amber-900/20",
            },
            {
              icon: Bell,
              title: "Smart Notifications",
              description: "Get notified via email, SMS, or WhatsApp for important reminders and updates.",
              color: "from-amber-500 to-amber-600",
              bgColor: "bg-amber-50 dark:bg-amber-900/20",
            },
            {
              icon: Shield,
              title: "Secure & Private",
              description: "Your data is protected with enterprise-grade security and privacy controls.",
              color: "from-indigo-500 to-indigo-600",
              bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Experience blazing-fast performance with our optimized platform and real-time updates.",
              color: "from-pink-500 to-pink-600",
              bgColor: "bg-pink-50 dark:bg-pink-900/20",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 100,
                rotateX: 45,
                rotateY: index % 2 === 0 ? -20 : 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
                rotateX: 0,
                rotateY: 0,
              }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                type: "spring",
                stiffness: 100,
              }}
              viewport={{ once: true }}
              whileHover={{
                y: -20,
                rotateX: 15,
                rotateY: index % 2 === 0 ? 10 : -10,
                scale: 1.05,
                z: 50,
                boxShadow: "0 30px 60px rgba(0, 0, 0, 0.2)",
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 cursor-pointer group"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg`}
                animate={{
                  rotateY: [0, 360],
                  rotateX: [0, 20, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                  delay: index * 0.5,
                }}
                whileHover={{
                  scale: 1.2,
                  rotateZ: 180,
                  transition: { duration: 0.3 },
                }}
              >
                <feature.icon className={`h-6 w-6 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} />
              </motion.div>
              <motion.h3
                className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center"
                style={{ transform: "translateZ(20px)" }}
              >
                {feature.title}
              </motion.h3>
              <motion.p
                className="text-gray-600 dark:text-gray-300 text-center"
                style={{ transform: "translateZ(10px)" }}
              >
                {feature.description}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Testimonials Section */}
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            What our users say
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied users who have transformed their daily lives
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Manyong Mireille",
              role: "Accountant",
              content: "LIA Admin has completely transformed how I manage my business and personal life. The task management features are incredible!",
              rating: 4,
            },
            {
              name: "Djomo Gabriel",
              role: "Mechatronics Engineer / Trader",
              content: "The appointment scheduling and notification system has saved me hours every week. Highly recommended!",
              rating: 4,
            },
            {
              name: "Emily Rodriguez",
              role: "Freelancer",
              content: "The financial tracking features help me stay on top of my income and expenses. It's like having a personal assistant!",
              rating: 5,
            },
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, rotateX: 30, scale: 0.8 }}
        whileInView={{ opacity: 1, rotateX: 0, scale: 1 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true }}
        className="py-12 sm:py-20 mx-2 sm:mx-4 rounded-3xl shadow-2xl relative overflow-hidden"
        style={{ 
          transformStyle: "preserve-3d"
        }}
      >
        {/* Background Image with Parallax Effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            backgroundImage: "url('/image.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        {/* Background Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 via-amber-600/80 to-rose-600/80 rounded-3xl" />
        
        {/* 3D Background Elements */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            rotateX: [0, 360],
            rotateY: [0, 180],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <Sparkles className="absolute top-10 left-10 w-8 h-8 text-white" />
          <Sparkles className="absolute top-20 right-20 w-6 h-6 text-white" />
          <Sparkles className="absolute bottom-10 left-1/3 w-10 h-10 text-white" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            style={{ transform: "translateZ(30px)" }}
            animate={{
              rotateY: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            Ready to transform your life?
          </motion.h2>
          <motion.p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed" style={{ transform: "translateZ(20px)" }}>
            Join thousands of users who have revolutionized their daily productivity with LIA Admin. Start your free trial today and experience the difference.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ transform: "translateZ(40px)" }}
          >
            <motion.div
              whileHover={{
                scale: 1.1,
                rotateY: 10,
                rotateX: -5,
                z: 50,
                boxShadow: "0 25px 50px rgba(255, 255, 255, 0.3)",
                transition: { type: "spring", stiffness: 300 },
              }}
              whileTap={{ scale: 0.95, rotateX: 5 }}
            >
              <Link to="/register" className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 inline-flex items-center">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{
                scale: 1.05,
                rotateY: -10,
                rotateX: 5,
                z: 30,
                transition: { type: "spring", stiffness: 300 },
              }}
            >
              <Link to="/login" className="border-2 border-white/30 text-white hover:border-white hover:bg-white/10 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300">
                Sign In
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <motion.footer
        className="bg-gray-900 text-white py-8 sm:py-12 mt-16 sm:mt-20"
        initial={{ opacity: 0, rotateX: 45 }}
        whileInView={{ opacity: 1, rotateX: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" style={{ transformStyle: "preserve-3d" }}>
            <motion.div
              className="flex items-center justify-center space-x-2 mb-4"
              whileHover={{
                scale: 1.1,
                rotateY: 15,
                z: 30,
                transition: { type: "spring", stiffness: 300 },
              }}
            >
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 10,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <img 
                  src="/Logo.png" 
                  alt="LIA Admin Logo" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <span className="text-xl font-bold">LIA Admin</span>
            </motion.div>
            <motion.p className="text-gray-400 mb-4" style={{ transform: "translateZ(10px)" }}>
              Your comprehensive Life Admin Assistant
            </motion.p>
            <motion.p className="text-sm text-gray-500" style={{ transform: "translateZ(5px)" }}>
              © 2025 LIA Admin Assistant. All rights reserved.
            </motion.p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  )
}
