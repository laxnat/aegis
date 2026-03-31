# Aegis

A collaborative document workspace with real-time editing, folder organisation, and document sharing.

---

## Screenshots

<!-- Home dashboard -->
![Home Dashboard](screenshots/home-dashboard.png)

<!-- Document editor -->
![Document Editor](screenshots/editor.png)

<!-- Share panel -->
![Share Panel](screenshots/share-panel.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Supabase (email + Google OAuth) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Real-time collaboration | Liveblocks v3 |
| Rich text editor | Tiptap v3 |
| Animations | Framer Motion |
| Icons | Lucide React |

---

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Liveblocks](https://liveblocks.io) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/aegis.git
cd aegis
npm install
```

### 2. Configure environment variables

Create a `.env` file in the root:

```env
# PostgreSQL — from your Supabase project settings → Database
DATABASE_URL=
DIRECT_URL=

# Supabase — from your project settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Liveblocks — from your dashboard → API Keys
LIVEBLOCKS_SECRET_KEY=
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
```

### 3. Push the database schema

```bash
npx prisma db push
npx prisma generate
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Features

- Create, rename, and delete documents and folders
- Nested folder support with breadcrumb navigation
- Drag-and-drop to move documents into folders
- Real-time collaborative editing powered by Liveblocks + Tiptap
- Rich text block editor with slash commands (headings, lists, tables, code blocks, and more)
- Block-level selection with multi-delete
- Document sharing with view/edit permissions
- Document status labels (Draft, In Progress, Review, Done)
- Pinning for documents, folders, and shared documents
- Global search palette (⌘K)
- Recently viewed row on the home dashboard
