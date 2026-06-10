# Common Interview Questions - Smart Task Manager

## React & Frontend

1. **What is React and why use it?**
   - Library for building UI with reusable components. We use functional components and hooks.

2. **Explain useState and useEffect.**
   - `useState`: stores component state (e.g. tasks list).
   - `useEffect`: runs side effects (e.g. fetch tasks on mount or when filters change).

3. **What is React Router?**
   - Handles client-side navigation (`/login`, `/dashboard`) without full page reload.

4. **What is a Protected Route?**
   - Wrapper that checks authentication before rendering Dashboard; redirects to login if not logged in.

5. **How do you store JWT on the frontend?**
   - Stored in `localStorage`. Axios interceptor attaches it as `Authorization: Bearer <token>`.

6. **Why use Axios instead of fetch?**
   - Interceptors, cleaner error handling, automatic JSON, easy config for base URL and headers.

## Node.js & Express

7. **What is Express?**
   - Minimal web framework for Node.js to build REST APIs quickly.

8. **What is middleware?**
   - Functions that run between request and response (e.g. `protect` for JWT, `cors`, `express.json()`).

9. **Explain MVC in this project.**
   - **Model**: MySQL tables (users, tasks)
   - **View**: React frontend
   - **Controller**: `authController.js`, `taskController.js`
   - **Routes**: Map URLs to controllers

10. **What is bcrypt?**
    - Hashes passwords one-way. On login, `bcrypt.compare()` checks plain password against hash.

## JWT & Authentication

11. **What is JWT?**
    - JSON Web Token: signed string containing user id (payload). Client sends it to prove identity.

12. **Explain JWT flow in this app.**
    1. User logs in → server verifies password → returns JWT
    2. Frontend saves token in localStorage
    3. Every API request sends `Authorization: Bearer <token>`
    4. `protect` middleware verifies token → attaches `req.user.id`
    5. Controllers use `req.user.id` to fetch only that user's tasks

13. **Where is JWT secret stored?**
    - In `.env` as `JWT_SECRET` (never commit to Git).

14. **What happens when token expires?**
    - `jwt.verify()` fails → 401 response → frontend clears storage and redirects to login.

## MySQL & Database

15. **Why use foreign keys?**
    - `tasks.user_id` references `users.id` — ensures every task belongs to a valid user.

16. **What is ON DELETE CASCADE?**
    - If a user is deleted, all their tasks are automatically deleted.

17. **Difference between SQL and NoSQL?**
    - SQL (MySQL): structured tables, relationships. NoSQL: flexible documents. We use SQL for relational user-task data.

18. **What is a connection pool?**
    - Reuses DB connections instead of opening new ones per request (better performance).

## REST API

19. **What are REST principles?**
    - Use HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove), PATCH (partial update).

20. **List API endpoints in this project.**
    - See README API section.

21. **What is CORS?**
    - Browser security: blocks frontend (port 5173) from calling backend (port 5000) unless server allows origin via `cors` package.

## General

22. **How would you improve this project?**
    - Refresh tokens, httpOnly cookies, input sanitization, pagination, unit tests, rate limiting.

23. **What is async/await?**
    - Cleaner syntax for Promises. `async` functions return Promises; `await` pauses until DB query completes.

24. **How do you handle errors?**
    - try/catch in controllers, return consistent JSON `{ success, message }`, global error middleware in server.js.

25. **Explain deployment architecture.**
    - Frontend on Vercel (static), Backend on Render (Node), Database on cloud MySQL (PlanetScale, Railway, or Render MySQL).
