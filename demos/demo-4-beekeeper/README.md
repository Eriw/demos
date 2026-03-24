# HiveTrack – Beekeeper Management App

A full-featured web application for beekeepers to manage multiple apiary
locations, track hive health, log inspections, and collaborate with other
beekeepers in real time.

## Features

- **Google authentication** with automatic user profile creation
- **Apiary (Garden) management** — create, edit, delete locations
- **Hive tracking** — add hives, update health status (Healthy / Needs Attention / Swarming / Dormant)
- **Inspection logs** — chronological timeline with manual back-dating support
- **Date filtering** — sidebar calendar to filter inspection logs by date
- **Collaborator system** — invite users by email to access your apiaries
- **Global activity feed** — all inspections across all your apiaries in one view
- **Real-time sync** — Firestore `onSnapshot` listeners update every client instantly
- **Access control** — Firestore security rules enforce ownership and collaborator permissions

## Tech Stack

- **Next.js 14** (App Router)
- **Firebase** — Auth (Google) + Firestore (real-time database)
- **Tailwind CSS** with a custom apiary color theme
- **date-fns** for date formatting

## Setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Authentication** → Sign-in method → **Google**.
3. Enable **Firestore Database** (start in Production mode).
4. Register a **Web App** and copy the config.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Firebase credentials in `.env.local`.

### 3. Deploy Firestore security rules

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Model

```
users/{uid}
  uid, email, displayName, photoURL, createdAt

gardens/{gardenId}
  name, location, ownerId, ownerEmail, collaborators[], createdAt, updatedAt

hives/{hiveId}
  name, gardenId, ownerId, status, createdAt, updatedAt

inspections/{inspectionId}
  hiveId, gardenId, authorId, authorName, message, timestamp, createdAt
```

## Color Palette

| Token | Color |
|---|---|
| `honey-*`    | Golden yellows (#F59E0B family) |
| `charcoal-*` | Deep charcoals (#1C1917 family) |
| Status: Healthy       | Emerald green |
| Status: Needs Attention | Amber |
| Status: Swarming      | Orange |
| Status: Dormant       | Stone gray |
