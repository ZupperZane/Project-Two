# Career Compass

## Local Setup

Create a local `.env` file with the needed server values:

```bash
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=project_two
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account", ... }'
# Or use:
# GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

Install dependencies:

```bash
npm install
```

Run the API server:

```bash
npm run server
```

Run the Vite frontend in a second terminal:

```bash
npm run dev
```

Useful checks:

```bash
npm run build
npm run lint
```

## App Structure

```text
Project-Two/
|-- index.js                  Express API and production static file server
|-- mongo.js                  Shared MongoDB connection helper
|-- firebaseAdmin.js          Firebase Admin initialization and token verification support
|-- vite.config.ts            Vite config and /api dev proxy to localhost:3000
|-- index.html                App shell, tab title, and favicon link
|-- public/                   Static assets such as favicon.svg
|-- src/
|   |-- main.tsx              React app entry
|   |-- App.tsx               App providers and router mount
|   |-- routes/               Route table and protected-route wrapper
|   |-- layout/               Root route layout
|   |-- pages/                Top-level screens
|   |-- components/           Reusable UI and feature components
|   |-- contexts/             Auth and theme context definitions
|   |-- hooks/                useAuth and useTheme helpers
|   |-- firebase/             Firebase client config
|   |-- css/                  Shared page, navbar, search, auth, and theme styles
|   `-- utils/                Route constants and shared values
`-- dist/                     Production build output
```

## Key Frontend Components

- `src/main.tsx`: mounts the React app and imports global CSS.
- `src/App.tsx`: wraps the app in `ThemeProvider`, `AuthProvider`, and `RouterProvider`.
- `src/routes/MainRouter.tsx`: defines the active routes for home, jobs, employers, auth, dashboard, and search.
- `src/routes/PrivateRoute.tsx`: protects pages that require a logged-in user.
- `src/layout/Root.tsx`: shared layout outlet for routed pages.
- `src/contexts/AuthProvider.tsx`: tracks Firebase auth state and current app user/profile data.
- `src/contexts/ThemeProvider.tsx`: manages light/dark mode state.
- `src/hooks/useAuth.ts`: typed access to auth state.
- `src/hooks/useTheme.ts`: typed access to theme state and toggling.
- `src/components/Navbar.tsx`: main navigation, search entry, auth buttons, and theme toggle.
- `src/components/SearchBar.tsx`: reusable search UI for jobs and employers.
- `src/components/DisplayAllJobs.tsx`: job list cards, filtering, saved jobs, admin/employer actions, and View Details links.
- `src/components/DisplayJobByID.tsx`: individual job details, resume selection, and quick apply flow.
- `src/components/DisplayAlllCompanies.tsx`: employer/company listing cards.
- `src/components/EmployerJobsPanel.tsx`: employer dashboard jobs, applicants, resume links, edit, and delete actions.
- `src/components/ResumeUpload.tsx`: job-seeker resume upload, default resume selection, and resume deletion.

## Key Pages

- `src/pages/Home.tsx`: landing page with primary calls to action.
- `src/pages/Jobs.tsx`: browse jobs and access employer post-job actions.
- `src/pages/JobID.tsx`: route wrapper for the single-job detail view.
- `src/pages/Employers.tsx`: browse employer/company profiles.
- `src/pages/EmployerID.tsx`: individual employer/company profile and related jobs.
- `src/pages/CreatePost.tsx`: employer/admin job posting form and company setup flow.
- `src/pages/Dashboard.tsx`: role-aware dashboard for job-seekers, employers, and admins.
- `src/pages/LoginPage.tsx`: sign in and password reset entry.
- `src/pages/SignUpPage.tsx`: account creation with role selection.
- `src/pages/SelectRolePage.tsx`: post-auth role selection/onboarding support.
- `src/pages/ResetPasswordPage.tsx`: password reset form.
- `src/pages/SearchPage.tsx`: search results page.
- `src/pages/ErrorPage.tsx`: route error fallback.

## Routes

```text
/                 -> redirects to /home
/home             -> landing page
/jobs             -> job listings
/jobs/:id         -> job detail view
/jobs/new         -> protected job creation page
/jobs/all         -> all jobs component route
/employers        -> company listings
/employer/:id     -> company detail view
/dashboard        -> protected role-based dashboard
/login            -> login
/signup           -> signup
/reset-password   -> password reset
/select-role      -> role selection
/search           -> search results
```

## Roles And Core Workflows

- Job-seekers can browse jobs, view details, upload resumes, choose a default resume, save jobs, apply to jobs, and view application history.
- Employers can create/select a company profile, post jobs, edit jobs, delete jobs, and review applicants from the dashboard.
- Admins can view users, view jobs, delete/moderate jobs, change user status, and inspect moderation logs.

Admin signup still relies on backend authorization. The UI can request an admin role, but protected admin API routes require an authenticated user whose stored role is `admin`.

## API Diagram

```text
                         +--------------------------+
                         |  Browser / React / Vite  |
                         |  pages + components      |
                         +------------+-------------+
                                      |
                                      | /api/* requests
                                      v
                         +--------------------------+
                         |  Express API (index.js)  |
                         +------------+-------------+
                                      |
              +-----------------------+-----------------------+
              |                       |                       |
              v                       v                       v
   +---------------------+  +---------------------+  +---------------------+
   | Public API          |  | Firebase Auth       |  | Static Production   |
   | GET /api/health     |  | authenticateRequest |  | dist/index.html     |
   | GET /api/jobs       |  | loadCurrentUser     |  | catch-all route     |
   | GET /api/jobs/:id   |  | requireRoles        |  +---------------------+
   | GET /api/companies  |  +----------+----------+
   +---------------------+             |
                                       v
              +------------------------+------------------------+
              |                         |                       |
              v                         v                       v
   +----------------------+  +----------------------+  +----------------------+
   | Job-Seeker API       |  | Employer API         |  | Admin API            |
   | profile              |  | company profile      |  | users                |
   | resumes              |  | select company       |  | jobs                 |
   | applications         |  | jobs CRUD            |  | user status          |
   | favorites            |  | applicants           |  | moderation logs      |
   +----------+-----------+  +----------+-----------+  +----------+-----------+
              |                         |                       |
              +-------------------------+-----------+-----------+
                                                    |
                                                    v
                                      +--------------------------+
                                      | MongoDB                  |
                                      | users                    |
                                      | jobs                     |
                                      | companies                |
                                      | applications             |
                                      | job_seeker_profiles      |
                                      | employer_profiles        |
                                      | admin_profiles           |
                                      | moderation_logs          |
                                      | resumes.files/chunks     |
                                      +--------------------------+
```

## API Reference

### Public

- `GET /api/health`: API health check.
- `GET /api/jobs`: list jobs with optional filters/search.
- `GET /api/jobs/:id`: get a single job.
- `GET /api/companies`: list companies with optional filters/search.
- `GET /api/companies/:id`: get a single company.
- `GET /api/resume/:fileId`: stream a resume file from GridFS.

### Users

- `POST /api/users/bootstrap`: create or sync the current Firebase user in MongoDB.
- `GET /api/users/me`: fetch the current app user and profile.
- `PATCH /api/users/me`: update the current user/profile.
- `DELETE /api/users/me`: delete current account data.

### Job-Seekers

- `GET /api/job-seeker/profile`: get the current job-seeker profile.
- `PATCH /api/job-seeker/profile`: update the current job-seeker profile.
- `POST /api/job-seeker/resume`: upload a resume.
- `DELETE /api/job-seeker/resume/:fileId`: delete one resume.
- `PATCH /api/job-seeker/resume/:fileId/default`: set default resume.
- `POST /api/job-seeker/applications`: apply to a job.
- `GET /api/job-seeker/applications`: list current user's applications.
- `GET /api/job-seeker/favorites`: list saved jobs.
- `POST /api/job-seeker/favorites/:jobId`: save a job.
- `DELETE /api/job-seeker/favorites/:jobId`: unsave a job.

### Employers

- `POST /api/employer/company-profile`: create or update the employer company profile.
- `POST /api/employer/select-company`: attach an employer to an existing company.
- `GET /api/employer/jobs`: list jobs owned by the employer, or all jobs for admins.
- `POST /api/employer/jobs`: create a job posting.
- `PATCH /api/employer/jobs/:id`: update a job posting.
- `DELETE /api/employer/jobs/:id`: delete a job posting and related applications.
- `GET /api/employer/jobs/:id/applicants`: list applicants for a job.

### Admins

- `GET /api/admin/users`: list users.
- `GET /api/admin/jobs`: list all jobs.
- `DELETE /api/admin/jobs/:id`: moderate/delete a job with a reason.
- `PATCH /api/admin/users/:uid/status`: change a user's status.
- `GET /api/admin/moderation-logs`: list recent moderation events.

## Styling

- `src/css/App.css`: theme variables, app background, major theme surfaces.
- `src/css/Page.css`: shared page containers, forms, dashboards, cards, and buttons.
- `src/css/Navbar.css`: responsive navigation and theme toggle styling.
- `src/css/SearchBar.css`: shared search input/button styling.
- `src/css/Home.css`: landing-page-specific hero and section styling.
- `src/css/Login.css`: login/signup/reset auth screens.
- `src/css/DisplayAllJobs.css` and `src/css/DisplayAllCompanies.css`: listing-specific styles.

## Build And Deployment Notes

- `index.js` serves `dist/` and falls back to `dist/index.html` for client-side routes.
- Run `npm run build` before deploying so the production server has fresh static assets.
