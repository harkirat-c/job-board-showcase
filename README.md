# Job Board

A full-stack job board web app where employers post and manage job listings and applicants search, filter, and apply for jobs. Built as a team project; this repo is a personal showcase copy of the codebase.

## Features

- **Authentication** for three roles: applicants, employers, and admins (registration, login, and role-based access to protected routes/pages)
- **Job search & filtering** — applicants can search listings by keyword and location, with results sorted and a personalized "recommended jobs" view
- Employer job posting and dashboard for managing listings and reviewing applications
- Applicant profiles, saved jobs, and application tracking
- Ratings/reviews between employers and applicants
- Admin dashboard with analytics and user/job management
- Real-time updates via server-sent events (SSE)

## My contributions

I implemented:
- **User authentication** — registration, login, and role-based access across the applicant, employer, and admin flows
- **Job search and filtering** — the applicant-facing search bar, location filtering, and recommended-jobs logic on the job listings page

## Tech stack

- **Frontend:** React + Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas
- **Testing:** Jest, Supertest, React Testing Library
- **Other:** Multer (file uploads), Server-Sent Events for real-time updates

## Running locally

### Prerequisites

- Node.js 20+
- A MongoDB connection string (e.g. a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/harkirat-c/job-board-showcase.git
   cd job-board-showcase
   npm install
   ```

2. Create a `.env` file in the project root:
   ```
   VITE_API_URL=http://localhost:3000
   ```

3. Create a `.env` file in `server/`:
   ```
   MONGO_URI=YOUR_MONGODB_URI_HERE
   PORT=3000
   ```

4. Run the frontend and backend in separate terminals:
   ```bash
   npm run dev      # Vite dev server (frontend)
   npm run server   # Express API (backend)
   ```

5. (Optional) Seed an admin account:
   ```bash
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword node server/seedAdmin.js
   ```

### Tests

```bash
npm test                # full suite
npm run test:frontend   # frontend only
npm run test:controllers
npm run test:routes
npm run test:services
npm run test:utils
npm run test:validators
```

## Docker

A `Dockerfile` and `docker-compose.yml` are included for containerized builds:

```bash
docker compose up --build
```
