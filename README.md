# FocusFlow ⏰

A comprehensive productivity assistant designed to help you stay focused and organized through the Pomodoro Technique, task management, and progress tracking.

**Live Demo:** [https://focus-flow-agr27.vercel.app/](https://focus-flow-agr27.vercel.app/)

## ✨ Features

### ⏰ Pomodoro Timer
- **Customizable Focus Sessions**: Set custom focus and break durations
- **Session Management**: Track total session time with automatic focus/break cycles
- **Global Timer Widget**: Minimizable floating timer that stays accessible across all pages
- **Mood & Productivity Tracking**: Rate your focus sessions and break satisfaction
- **Visual Feedback**: Color-coded phases (red for focus, green for breaks, blue for long breaks)

### 📋 Task Management
- **Comprehensive Task System**: Create, edit, and delete tasks with due dates
- **Priority Levels**: Organize tasks by priority (Low, Medium, High, ASAP)
- **Task Types**: Categorize as Assignments, Quizzes, Exams, Projects, or Other
- **Class Association**: Link tasks to specific classes or subjects
- **Due Date Tracking**: Visual indicators for upcoming deadlines
- **Task Status**: Track completion status (pending, in progress, completed)

### 🎓 Class Management
- **Class Organization**: Create and manage multiple classes
- **Subject Tracking**: Add course codes and subjects
- **Meeting Times**: Record class schedules and locations
- **Integration Ready**: Support for external LMS integrations

### 📊 Session Analytics & Progress Tracking
- **Weekly Summaries**: View total minutes, daily averages, and productivity rates
- **Visual Charts**: Interactive bar charts showing time spent per day
- **Task Breakdown**: See which tasks consume the most time
- **Class Breakdown**: Track time spent on different subjects
- **Productivity Metrics**: Monitor focus levels and mood trends
- **Historical Data**: Complete session logs with edit capabilities

### 🔗 External Integrations
- **Google Classroom**: Import assignments and tasks directly from Google Classroom
- **OAuth Authentication**: Secure login with Google and GitHub

### 🔐 User Authentication & Security
- **Multiple Login Options**: Email/password, Google OAuth, GitHub OAuth
- **User Profiles**: Personalized dashboard with user-specific data
- **Secure Data**: Supabase-powered backend with Row Level Security (RLS)
- **Session Management**: Persistent login sessions

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Theme**: Easy on the eyes for long study sessions
- **Intuitive Navigation**: Clean, organized interface with clear visual hierarchy
- **Real-time Updates**: Live timer and data synchronization
- **Accessibility**: Keyboard navigation and screen reader support

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data security

### Authentication
- **Supabase Auth** - User authentication
- **OAuth Providers** - Google, GitHub integration

### Deployment
- **Vercel** - Frontend deployment
- **Supabase Cloud** - Backend hosting

## 📱 Pages & Features

### Dashboard (`/`)
- Personalized welcome with user information
- Quick access to timer and tasks
- Upcoming tasks overview
- Global timer status

### Pomodoro Timer (`/timer`)
- Full-featured timer interface
- Session configuration
- Mood and productivity tracking
- Break activity logging

### Tasks (`/tasks`)
- Complete task management system
- Class management
- External integrations (Google Classroom)
- Task filtering and organization

### Sessions (`/sessions`)
- Session history and analytics
- Weekly productivity summaries
- Visual progress charts
- Task and class breakdowns

## 🔧 Configuration

### Database Schema
The application uses the following main tables:
- `profiles` - User profile information
- `classes` - Class/subject management
- `tasks` - Task items with due dates and priorities
- `sessions` - Focus session records with analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the Pomodoro Technique methodology
- Inspired by productivity and focus enhancement tools
- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the documentation
- Contact the development team

---

**FocusFlow** - Stay focused, stay productive! 🚀
