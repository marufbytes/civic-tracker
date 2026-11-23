# 🏛️ Civic Issue Tracker BD

A full-stack, crowdsourced platform built to report, track, and resolve local civic and traffic issues across Bangladesh in real time.

[![Live Demo](https://img.shields.io/badge/Demo-Vercel-black?style=flat&logo=vercel)](https://civic-tracker-bd.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=flat&logo=github)](https://github.com/marufbytes/civic-tracker)

---

## 📌 Project Overview

Everyday civic issues like potholes, open garbage dumps, sudden waterlogging, and extreme traffic jams often go unreported or get lost in unstructured social media posts. Civic Issue Tracker bridges the gap between citizens and local authorities by providing a centralized, transparent platform where problems can be mapped, upvoted, and monitored from report to resolution.

### Motivation & Interest
Built out of personal interest and a practical daily need. The goal was to build a clean civic-tech utility that gives communities a voice and provides transparent, data-driven visibility into neighborhood problems without administrative roadblocks.

---

## ✨ Key Features

- **Interactive Live Map:** Pin exact problem spots across Bangladesh or grab current GPS coordinates.
- **Category & Severity Filters:** Filter reports by road condition, waterlogging, heavy traffic, garbage, streetlights, or emergency incidents.
- **Proof-of-Work Media:** Upload issue photos and view official "After" photos once issues are resolved.
- **Serverless Media Handling:** Photos are compressed directly in the browser and stored as Base64 JPEG data URLs in the database, avoiding local disk writes for seamless cloud deployments.
- **Community Engagement:** Upvote critical neighborhood issues and comment to share live updates.
- **Secure Authentication:** Account creation and password recovery verified via 6-digit email OTPs.
- **Role-Based Moderation:** Admin dashboard to review incoming reports, update statuses, and clean spam.
- **Theme Support:** Fully responsive dark and light modes.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Lucide Icons
- **Database & ORM:** PostgreSQL (Neon Serverless), Drizzle ORM
- **Maps:** Leaflet, React-Leaflet, OpenStreetMap
- **Authentication & Email:** Custom Auth, Nodemailer (SMTP OTP)
- **Deployment:** Vercel

---

## 📂 Project Structure

```text
civic-tracker/
├── public/                  # Static assets and icons
├── src/
│   ├── app/                 # Next.js App Router, API routes & Server Actions
│   │   ├── api/             # Backend API handlers
│   │   ├── dashboard/       # Moderation and issue management views
│   │   ├── actions.ts       # Core issue report server actions
│   │   └── auth-actions.ts  # Auth, OTP, and password reset actions
│   ├── components/          # UI components (LandingPage, AuthModal, Map views)
│   ├── db/                  # Drizzle ORM schema and database client
│   └── lib/                 # Client utilities and upload helpers
├── drizzle.config.ts        # Drizzle ORM configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
