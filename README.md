# LIA Admin System

A comprehensive admin management system built with React, Node.js, and PostgreSQL.

## 🚀 Features

- **User Authentication** - Secure login and registration
- **Task Management** - Create, update, and track tasks
- **Appointment Scheduling** - Manage appointments and meetings
- **Financial Tracking** - Track transactions and expenses
- **Real-time Notifications** - Email and SMS notifications
- **Dashboard Analytics** - Comprehensive data visualization
- **AI Assistant** - Intelligent account insights and chat

## 🛠️ Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Axios

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Nodemailer
- Twilio (SMS)

## 📦 Installation

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. Start the frontend server:

```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## 📱 Default Credentials

- **Email**: test@example.com
- **Password**: password123

## 🗄️ Database

The application uses PostgreSQL with Prisma ORM. Run migrations to set up the database:

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## 📊 API Documentation

The API is available at `http://localhost:5000/api` with the following endpoints:

- **Authentication**: `/api/auth/*`
- **Tasks**: `/api/tasks/*`
- **Appointments**: `/api/appointments/*`
- **Finance**: `/api/finance/*`
- **Notifications**: `/api/notifications/*`
- **Settings**: `/api/settings/*`

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection protection

## 📈 Monitoring

- Health checks at `/health`
- System monitoring at `/health/system`
- Comprehensive logging
- Error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@liaadmin.com or create an issue in the repository.
