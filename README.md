# Nexus AI — Intelligent Productivity Platform

> A full-stack, production-ready AI-powered productivity application built with React, Node.js/Express, MongoDB, and Claude AI.

![Nexus AI](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MongoDB-blue)
![AI](https://img.shields.io/badge/AI-Claude%20Sonnet-purple)

---

## 🚀 Features

- **AI Assistant** — Real-time conversations powered by Claude (claude-sonnet-4-6)
- **Smart Task Management** — Create, organize, and track tasks with priority & categories
- **Auto Task Creation** — AI automatically extracts and creates tasks from conversations
- **Productivity Analytics** — AI-powered analysis of your work patterns
- **Authentication** — Secure JWT-based signup/login
- **Dark & Light Mode** — Beautiful, theme-aware interface
- **Conversation History** — Persistent chat sessions with smart titles
- **Responsive Design** — Works on mobile, tablet, and desktop

---

## 📁 Project Structure

```
nexus-ai/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth middleware
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   └── services/      # AI Agent service
│   └── package.json
├── frontend/              # React application
│   ├── public/
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── contexts/      # Auth & Theme contexts
│       ├── pages/         # Route pages
│       ├── services/      # API client
│       └── styles/        # Global CSS design system
├── database/
│   └── seed.js            # Demo data seeder
├── .env.example           # Environment variable template
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas account
- Anthropic API key ([get one here](https://console.anthropic.com))

### Step 1 — Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2 — Configure Environment

```bash
# Copy and configure backend environment
cp .env.example backend/.env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexus-ai
JWT_SECRET=your-random-secret-here
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
FRONTEND_URL=http://localhost:3000
```

> **Get your Anthropic API key:** Sign up at [console.anthropic.com](https://console.anthropic.com), create a new API key, and add it to your .env file.

### Step 3 — Seed Database (Optional)

```bash
cd database
node seed.js
# Creates demo user: demo@nexusai.com / demo123456
```

---

## 🖥️ Running the Application

### Backend Server

```bash
cd backend
npm run dev      # Development with auto-reload
# OR
npm start        # Production
```

Server starts on: `http://localhost:5000`

### Frontend

```bash
cd frontend
npm start
```

App opens at: `http://localhost:3000`

---

## 🍃 Connecting the Database

**Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/nexus-ai
```

**MongoDB Atlas (cloud):**
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free cluster
3. Get connection string from "Connect" > "Drivers"
4. Update MONGODB_URI:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexus-ai
```

The app will automatically create all necessary collections and indexes on first run.

---

## 🤖 How the AI Agent Works

The AI agent (`backend/src/services/aiAgent.js`) is the core intelligence module:

### Architecture

```
User Message
    ↓
Intent Detection (analyzes what user wants)
    ↓
Context Builder (fetches user's task count, recent topics)
    ↓
System Prompt Generator (creates dynamic prompt based on user preferences)
    ↓
Claude API Call (claude-sonnet-4-6)
    ↓
Response Parser:
    ├── Task Extractor (finds **[TASK SUGGESTION]** markers)
    ├── Auto Task Creation (creates tasks in DB)
    └── Formatted Response → User
```

### Key AI Behaviors

1. **Dynamic Personality** — Adjusts communication style (professional/friendly/concise) per user preferences
2. **Context Awareness** — Knows user's active task count and recent conversation topics
3. **Intent Detection** — Classifies messages as: task_creation, question, analysis, writing, planning, support
4. **Auto Task Extraction** — Uses special markers to extract task suggestions from responses
5. **Auto Title Generation** — Creates catchy conversation titles from first message
6. **Productivity Analysis** — Analyzes task data and generates actionable insights

### Prompt Engineering

The system prompt is dynamically built per request, including:
- Current date
- User's personality preference
- Active task context
- Recent conversation topics
- Structured output format instructions

---

## 📡 API Routes Documentation

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create new account | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/auth/me` | Get current user | Yes |

**Register body:** `{ name, email, password }`
**Login body:** `{ email, password }`

### AI Chat
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat/message` | Send message, get AI response | Yes |
| GET | `/api/chat/sessions` | List chat sessions | Yes |
| GET | `/api/chat/sessions/:id` | Get specific session | Yes |
| DELETE | `/api/chat/sessions/:id` | Delete session | Yes |
| POST | `/api/chat/analyze` | Get productivity analysis | Yes |

**Message body:** `{ message: string, sessionId?: string }`

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | Get tasks (filterable) | Yes |
| GET | `/api/tasks/stats` | Get task statistics | Yes |
| POST | `/api/tasks` | Create new task | Yes |
| PATCH | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |

**Task query params:** `?status=todo&priority=high&sort=-createdAt`

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PATCH | `/api/users/preferences` | Update preferences | Yes |
| PATCH | `/api/users/profile` | Update profile | Yes |

---

## 🔒 Security Features

- JWT authentication with 7-day expiry
- Rate limiting (100 req/15min general, 20 req/min for AI)
- Helmet.js security headers
- Password hashing with bcrypt (12 rounds)
- Input validation with express-validator
- CORS configured for frontend URL only
- Passwords never returned in API responses

---

## 🗄️ Database Schema

### User
```javascript
{ name, email, password (hashed), preferences: { theme, aiPersonality, notifications },
  stats: { totalChats, totalTasks, completedTasks, streakDays }, isActive, lastLogin }
```

### ChatSession
```javascript
{ user, title, messages: [{ role, content, tokens, metadata }],
  summary, tags, isPinned, totalTokens, lastMessageAt }
```

### Task
```javascript
{ user, title, description, status, priority, category, tags, dueDate,
  completedAt, aiGenerated, aiNotes, subtasks, estimatedMinutes }
```

---

## 🔮 Future Improvements

1. **Real-time collaboration** — WebSocket-based shared workspaces
2. **Calendar integration** — Sync with Google Calendar / Outlook
3. **File attachments** — Upload documents for AI analysis
4. **Custom AI personas** — User-defined assistant personalities
5. **Team features** — Multi-user workspaces with task assignment
6. **Mobile app** — React Native version
7. **Webhooks** — Integrations with Slack, Notion, etc.
8. **Voice input** — Speech-to-text for hands-free task creation
9. **Analytics dashboard** — Advanced charts and productivity trends
10. **Plugin system** — Extensible AI tool use framework

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

Built with ❤️ using React, Node.js, MongoDB, and Claude AI by Anthropic.
#   d e e p l i x - a i  
 