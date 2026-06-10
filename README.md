# Smart Task Management System

A full-stack task management application built with **React**, **Node.js/Express**, **MySQL**, and **JWT authentication**. Designed for fresher developers and technical interviews.

---

## Features

- User Registration & Login
- JWT-based Authentication
- Protected Routes
- Dashboard with task statistics
- Add, Edit, Delete tasks
- Mark tasks as completed/pending
- Filter tasks by status
- Search tasks by title/description
- Logout
- Responsive UI with Tailwind CSS

---

## Project Folder Structure

```
smart-task-manager/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js   # Register, login, profile
│   │   └── taskController.js   # CRUD for tasks
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── validateInput.js    # Input validation
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   ├── database/
│   │   └── schema.sql          # Tables + sample data
│   ├── scripts/
│   │   └── generatePasswordHash.js
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Entry point
│
├── frontend/                   # React + Vite + Tailwind
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios API calls
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
│
├── INTERVIEW_QUESTIONS.md
└── README.md
```

---

## JWT Authentication Flow

```
┌─────────┐     1. Login (email, password)      ┌─────────┐
│ React   │ ──────────────────────────────────► │ Express │
│ Frontend│                                     │ Backend │
└─────────┘                                     └────┬────┘
     ▲                                               │
     │         2. Verify password (bcrypt)           │
     │         3. Generate JWT (user id in payload)  │
     │         4. Return { user, token }             │
     └───────────────────────────────────────────────┘

     5. Save token in localStorage

     6. API Request + Header: Authorization: Bearer <token>

┌─────────┐     7. protect middleware verifies JWT   ┌─────────┐
│ React   │ ───────────────────────────────────────► │ Express │
└─────────┘     8. req.user.id attached to request   └─────────┘
```

**Key points:**
- Password is **never** stored in plain text (bcrypt hash only).
- JWT contains user `id` — not password.
- Token expires based on `JWT_EXPIRES_IN` (default: 7 days).
- Each task query filters by `user_id = req.user.id` so users only see their own tasks.

---

## API Flow (Example: Create Task)

1. User fills task form on Dashboard
2. React calls `createTask(data)` via Axios
3. Axios interceptor adds JWT from localStorage
4. Request: `POST /api/tasks` with JSON body
5. `protect` middleware validates token → sets `req.user.id`
6. `validateTask` checks title/status
7. `taskController.createTask` runs SQL INSERT with `user_id`
8. Server returns `{ success, data: newTask }`
9. Frontend shows success message and refreshes task list

---

## Database Relationships

```
users (1) ──────────< (many) tasks
  id                    user_id (FK → users.id)
```

- **One-to-Many**: One user can have many tasks.
- **Foreign Key**: `tasks.user_id` references `users.id`.
- **ON DELETE CASCADE**: Deleting a user removes all their tasks.

### Tables

| users | tasks |
|-------|-------|
| id (PK) | id (PK) |
| name | title |
| email (unique) | description |
| password (hashed) | status (pending/completed) |
| created_at | created_at, updated_at |
| | user_id (FK) |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/tasks` | Yes | List tasks (`?status=`, `?search=`) |
| GET | `/api/tasks/:id` | Yes | Get one task |
| POST | `/api/tasks` | Yes | Create task |
| PUT | `/api/tasks/:id` | Yes | Update task |
| PATCH | `/api/tasks/:id/status` | Yes | Update status only |
| DELETE | `/api/tasks/:id` | Yes | Delete task |

### Sample Request Bodies

**Register:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "password123" }
```

**Create Task:**
```json
{ "title": "Learn React", "description": "Hooks and Router", "status": "pending" }
```

---

## Sample Test Users

| Name | Email | Password |
|------|-------|----------|
| John Doe | john@example.com | password123 |
| Jane Smith | jane@example.com | password123 |

## Sample Tasks (after running schema.sql)

**John's tasks:**
- Complete React project (pending)
- Study Node.js APIs (completed)
- Prepare for interview (pending)

**Jane's tasks:**
- Buy groceries (pending)
- Morning workout (completed)

---

## Prerequisites

- Node.js (v18+)
- MySQL (v8+)
- npm

---

## Package Installation

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

---

## Environment Variables

### Backend (`backend/.env`)
Copy from `.env.example`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_task_db
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## MySQL Setup Steps

1. **Start MySQL** (XAMPP, WAMP, or MySQL service).

2. **Open MySQL client:**
   ```bash
   mysql -u root -p
   ```

3. **Run schema file:**
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```
   Or copy-paste contents of `backend/database/schema.sql` in MySQL Workbench.

4. **Verify tables:**
   ```sql
   USE smart_task_db;
   SHOW TABLES;
   SELECT * FROM users;
   SELECT * FROM tasks;
   ```

5. **Update `backend/.env`** with your MySQL password.

---

## Run Instructions (Local Development)

**Terminal 1 - Backend:**
```bash
cd backend
cp .env.example .env   # Edit with your DB password
npm run dev
```
Server runs at: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
cp .env.example .env
npm run dev
```
App runs at: `http://localhost:5173`

1. Open `http://localhost:5173`
2. Login with `john@example.com` / `password123`
3. Manage tasks on Dashboard

---

## Deployment

### Backend on Render

1. Push project to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect repo, set root directory to `backend`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables from `.env.example`.
7. Use **Render MySQL** or external DB (PlanetScale, Railway) and update DB env vars.
8. Set `CLIENT_URL` to your Vercel frontend URL.

### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import GitHub repo, set root directory to `frontend`.
3. Framework: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
7. Deploy. `vercel.json` handles React Router SPA routing.

### Post-Deployment Checklist

- [ ] Backend health: `GET https://your-api.onrender.com/api/health`
- [ ] CORS `CLIENT_URL` matches Vercel URL
- [ ] Frontend `VITE_API_URL` points to Render API
- [ ] MySQL allows connections from Render IP (cloud DB)

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT, bcryptjs |

---

## Interview Preparation

See **[INTERVIEW_QUESTIONS.md](./INTERVIEW_QUESTIONS.md)** for 25+ common questions with answers.

---

## License

MIT — Free to use for learning and portfolio projects.
