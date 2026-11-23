# Civic Issue Tracker BD

A full-stack web application built to report, map, and track local civic problems and traffic disruptions across Bangladesh in real time.

Live Site: https://civic-tracker-bd.vercel.app/
GitHub: https://github.com/marufbytes/civic-tracker

---

## Overview

Broken roads, waterlogged streets, unmanaged garbage, and sudden traffic bottlenecks are part of daily life in our cities. Most of these reports stay buried in private group posts or social media feeds without any status tracking or accountability. 

Civic Issue Tracker provides a simple platform where citizens can drop a pin on a live map, upload photos, and track the progress of an issue from pending to resolved.

I built this project out of personal interest and a practical daily need. The focus was on building a fast, lightweight tool tailored to local issues across Bangladesh, handling serverless photo uploads cleanly without extra paid storage, and keeping the interface direct and usable.

---

## What It Does

- Interactive Map: Pin an issue anywhere in Bangladesh or grab current coordinates with device GPS.
- Issue Categories: Tag reports under Road, Waterlogging, Heavy Traffic, Road Protest, Accident/Emergency, Garbage, or Streetlight.
- Photo Verification: Upload snapshots of the issue and check "After" resolution photos once fixed.
- Cloud-Safe Image Storage: Images are compressed in the browser and saved as Base64 strings directly in the database, avoiding local file writes on Vercel.
- Community Upvoting: Upvote local posts so urgent neighborhood problems get immediate visibility.
- Email Verification: User registration and password reset are verified through 6-digit email OTP codes.
- Admin Dashboard: Review incoming reports, approve valid posts, update resolution states, and flag spam.
- Dark and Light Interface: Built-in theme toggling across all screens.

---

## Tech Stack

- Framework: Next.js (App Router, Server Actions)
- Language: TypeScript
- UI: Tailwind CSS, Lucide Icons
- Database: Neon Serverless PostgreSQL
- ORM: Drizzle ORM
- Map Engine: Leaflet, React-Leaflet, OpenStreetMap
- Auth & Email: Custom Session Auth, Nodemailer (SMTP OTP)
- Hosting: Vercel

---

## Project Structure

```text
civic-tracker/
├── public/                  # Map assets and static icons
├── src/
│   ├── app/                 # App Router pages, APIs, and Server Actions
│   │   ├── api/             # API endpoints
│   │   ├── dashboard/       # Moderation and issue status views
│   │   ├── actions.ts       # Issue reporting server actions
│   │   └── auth-actions.ts  # Auth, OTP, and password reset actions
│   ├── components/          # UI components (LandingPage, Modals, Map)
│   ├── db/                  # Drizzle ORM schema and database setup
│   └── lib/                 # Utility functions and image compression helpers
├── drizzle.config.ts        # Drizzle ORM configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
└── tailwind.config.ts       # Tailwind CSS configuration

Local Setup
Requirements
Node.js (v18 or higher)

npm or pnpm

A free PostgreSQL database instance (Neon.tech or local)

1. Clone the repository
Bash
git clone [https://github.com/marufbytes/civic-tracker.git](https://github.com/marufbytes/civic-tracker.git)
cd civic-tracker
2. Install dependencies
Bash
npm install
3. Add environment variables
Create a .env file in the root folder:

Code snippet
DATABASE_URL="postgresql://username:password@host/neondb?sslmode=require"
SMTP_EMAIL="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
JWT_SECRET="your-secret-key"
4. Push database tables
Run Drizzle to create all tables in your database:

Bash
npx drizzle-kit push
5. Run the dev server
Bash
npm run dev
Open http://localhost:3000 in your browser.

Deployment Notes
This project is deployed on Vercel. Because Vercel serverless functions have a read-only filesystem, file uploads do not use fs.writeFile. Instead, client-side images are compressed to JPEG and stored directly as Base64 data strings in the database text column.

To deploy your own copy:

Push your repository to GitHub.

Import the project on Vercel.

Add DATABASE_URL, SMTP_EMAIL, SMTP_PASSWORD, and JWT_SECRET in Vercel Environment Variables.

Hit Deploy.

Author
Maruf Ahammed

Department of Computer Science and Engineering

American International University-Bangladesh (AIUB)

Email: marufahammed496@gmail.com

Portfolio: https://marufahammed.me/index.html

GitHub: https://github.com/marufbytes
