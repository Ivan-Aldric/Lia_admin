# Life Admin Assistant (LIA) - SaaS Platform

A comprehensive Life Admin Assistant SaaS platform built with React, Node.js, and PostgreSQL. This platform helps users manage their daily tasks, appointments, finances, and more through an intuitive admin interface.

## 🚀 Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **TypeScript** for type safety

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Prisma ORM** for database management
- **JWT** for authentication
- **bcrypt** for password hashing

### Services
- **Twilio** for SMS notifications
- **WhatsApp Business API** for WhatsApp messages
- **Nodemailer** for email notifications
- **MTN MoMo** & **Orange Money** for payments

### Hosting
- **Frontend**: Vercel
- **Backend**: Render/Heroku
- **Database**: Supabase (managed PostgreSQL)

## 📁 Project Structure

```
lia_admin/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── styles/         # Global styles and Tailwind config
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Prisma models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Main server file
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── shared/                  # Shared types and utilities
├── docs/                    # Documentation
├── env.example             # Environment variables template
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd lia_admin
```

### 2. Environment Setup
```bash
# Copy environment variables template
cp env.example .env

# Edit .env file with your actual values
# Make sure to set up your database URL, JWT secret, and API keys
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# (Optional) Seed the database
npm run db:seed

# Start development server
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Database Setup
Make sure PostgreSQL is running and create a database:
```sql
CREATE DATABASE lia_admin_db;
```

## 🚀 Development Commands

### Backend Commands
```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
```

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🔧 Configuration

### Database Configuration
Update the `DATABASE_URL` in your `.env` file:
```
DATABASE_URL="postgresql://username:password@localhost:5432/lia_admin_db"
```

### API Keys Setup
1. **Twilio**: Get your Account SID, Auth Token, and Phone Number
2. **WhatsApp Business**: Set up Facebook Developer account and get access token
3. **Email**: Configure SMTP settings for your email provider
4. **Payments**: Set up MTN MoMo and Orange Money developer accounts

## 📱 Features

### Core Features
- ✅ User Authentication & Authorization
- ✅ Dashboard with Overview
- ✅ Task Management
- ✅ Appointment Scheduling
- ✅ Financial Tracking
- ✅ Document Management
- ✅ Notification System (Email, SMS, WhatsApp)
- ✅ Payment Integration
- ✅ Dark/Light Theme Toggle

### Advanced Features
- 🔄 Real-time Updates
- 📊 Analytics & Reports
- 🔔 Smart Notifications
- 📱 Mobile Responsive Design
- 🌍 Multi-language Support
- 🔒 Advanced Security

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy!

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set build command: `npm install && npm run db:generate`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy!

### Database (Supabase)
1. Create a new Supabase project
2. Get your database URL
3. Update `DATABASE_URL` in your backend environment variables
4. Run migrations: `npm run db:push`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🎯 Roadmap

- [ ] Mobile App (React Native)
- [ ] AI-powered Task Suggestions
- [ ] Calendar Integration
- [ ] Team Collaboration Features
- [ ] Advanced Analytics
- [ ] API Documentation
- [ ] Webhook Support

---

**Built with ❤️ by the LIA Team**
