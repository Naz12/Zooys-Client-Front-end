# 🚀 Zooys Dashboard

A modern, AI-powered productivity and learning platform built with Next.js, React, and TypeScript. Zooys Dashboard provides a comprehensive suite of AI tools for content creation, analysis, and learning enhancement.

![Zooys Dashboard](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🤖 AI-Powered Tools
- **AI YouTube Summarizer** - Extract key insights from YouTube videos
- **AI Chat Assistant** - Intelligent conversational AI for various tasks
- **AI PDF Analyzer** - Process and analyze PDF documents
- **AI Presentation Generator** - Create compelling presentations from content
- **AI Math Solver** - Solve mathematical problems with step-by-step solutions
- **AI Flashcard Creator** - Generate study flashcards from any content
- **AI Book Library** - Organize and analyze your digital library

### 🔐 Authentication & Security
- Secure user registration and login
- JWT-based session management
- Protected routes and API endpoints
- Password validation and security

### 💳 Subscription Management
- Multiple subscription tiers (Free, Pro, Enterprise)
- Usage tracking and limits
- Payment processing with Stripe integration
- Subscription history and management

### 🎨 Modern UI/UX
- Dark theme with gradient accents
- Responsive design for all devices
- Intuitive navigation and user experience
- Real-time notifications and feedback

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript 5.0
- **Styling**: Tailwind CSS 4.0, Radix UI components
- **Authentication**: Custom JWT implementation
- **Payments**: Stripe integration
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Theme**: Next Themes for dark/light mode

## 🤖 Agent Communication Protocol

This project uses an optimized multi-file communication system for frontend and backend agents:

- **Protocol Version**: 2.0 (Token Optimized)
- **Token Reduction**: 90% (from ~4,500 to ~540 tokens per session)
- **Communication Path**: `C:\xampp\htdocs\zooys_backend_laravel-main\agent-communication`
- **Documentation**: See `md/agent-communication-protocol-update.md`

**For all agents**: Always read `current/quick-status.md` first, follow file size limits, and use provided templates.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, pnpm, or bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/zooys-dashboard.git
   cd zooys-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_API_VERSION=v1
   
   # Authentication
   NEXT_PUBLIC_JWT_SECRET=your-jwt-secret
   
   # Stripe (for payments)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   
   # App Configuration
   NEXT_PUBLIC_APP_NAME=Zooys Dashboard
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
zooys-dashboard/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── profile/           # User profile pages
│   └── subscription/      # Subscription management
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── ui/               # Reusable UI components
│   ├── payment/          # Payment components
│   ├── profile/          # Profile components
│   ├── subscription/     # Subscription components
│   └── providers/        # Context providers
├── lib/                  # Utility libraries
│   ├── types/            # TypeScript type definitions
│   ├── auth-context.tsx  # Authentication context
│   ├── api-client.ts     # API client
│   ├── notifications.ts  # Notification system
│   └── stripe.ts         # Stripe integration
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎯 Key Features in Detail

### AI Tools Integration
Each AI tool is designed with a consistent interface and provides:
- File upload capabilities
- Real-time processing status
- Export and sharing options
- Usage tracking and limits

### Authentication System
- Secure user registration and login
- Password strength validation
- Session management with JWT tokens
- Protected route handling
- Automatic token refresh

### Subscription Management
- Multiple pricing tiers
- Usage monitoring and alerts
- Payment processing with Stripe
- Subscription upgrade/downgrade
- Billing history and invoices

## 🔒 Security Features

- JWT-based authentication
- Password hashing and validation
- CSRF protection
- Input sanitization
- Rate limiting on API endpoints
- Secure session management

## 🌐 API Integration

The dashboard integrates with a comprehensive backend API that provides:
- User authentication and management
- AI tool processing endpoints
- Subscription and payment handling
- Usage tracking and analytics
- File upload and processing

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Adaptive layouts for all screen sizes

## 🎨 Theming

- Dark theme by default
- Light theme support
- Custom color schemes
- Consistent design system
- Accessibility compliant

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy automatically

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use consistent code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@zooys.com
- 💬 Discord: [Join our community](https://discord.gg/zooys)
- 📖 Documentation: [docs.zooys.com](https://docs.zooys.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/zooys-dashboard/issues)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [Lucide](https://lucide.dev/) for beautiful icons
- [Stripe](https://stripe.com/) for payment processing

## 📊 Roadmap

- [ ] Mobile app development
- [ ] Advanced AI model integration
- [ ] Team collaboration features
- [ ] API rate limiting improvements
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Plugin system for custom tools

---

<div align="center">
  <p>Made with ❤️ by the Zooys Team</p>
  <p>
    <a href="https://zooys.com">Website</a> •
    <a href="https://docs.zooys.com">Documentation</a> •
    <a href="https://github.com/yourusername/zooys-dashboard/issues">Report Bug</a> •
    <a href="https://github.com/yourusername/zooys-dashboard/issues">Request Feature</a>
  </p>
</div>