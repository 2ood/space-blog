# ✦ COSMOS — An AI Research Blog

> *Navigate the universe of ideas. Each paper, a planet.*

<br/>

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white)
![Payload CMS](https://img.shields.io/badge/Payload_CMS-000000?style=flat-square&logo=payloadcms&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-000000?style=flat-square&logo=mongodb&logoColor=47A248)
![TypeScript](https://img.shields.io/badge/TypeScript-000000?style=flat-square&logo=typescript&logoColor=3178C6)

<br/>

---

## ✦ What is this?

**COSMOS** is an interactive 3D space blog for AI research. Instead of a feed, you get a star field — each planet is a blog post. Navigate freely, follow curated trajectories through topic clusters, and dock at planets to read.

Built as a personal publishing platform where the *experience of discovery* matters as much as the content.

<br/>

## ✦ Features

```
✦ Interactive 3D star field        — fly through a living solar system of posts
✦ Pointer-lock free roam           — WASD + mouse FPS navigation
✦ Trajectory mode                  — guided tours through topic clusters
✦ Constellation lines              — visual connections between related posts
✦ Planet shaders                   — procedural GLSL planets, rings, moons
✦ Payload CMS backend              — full admin panel for writing & publishing
✦ Post detail pages                — rich text rendered from Lexical editor
✦ Star name labels                 — toggle with T key
```

<br/>

## ✦ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| 3D Engine | React Three Fiber + Three.js |
| 3D Helpers | @react-three/drei |
| CMS | Payload CMS v3 |
| Database | MongoDB (Atlas) |
| State | Zustand |
| Animation | Framer Motion |
| Language | TypeScript |
| Deployment | Vercel |

<br/>

## ✦ Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)

### Installation

```bash
git clone https://github.com/<your-username>/space-blog.git
cd space-blog
npm install
```

### Environment

Create a `.env.local` file at the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>
PAYLOAD_SECRET=<any-long-random-string>
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### Seed the database

```bash
npm run seed
```

This populates MongoDB with 24 dummy posts across three topic clusters (Transformers/NLP, Alignment/Safety, Scaling/Empirics) and their constellation connections.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the cosmos awaits.

The Payload admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

<br/>

## ✦ Navigation

| Input | Action |
|---|---|
| `Right-click` | Toggle pointer lock (free roam) |
| `W A S D` | Move through space |
| `Mouse` | Look around |
| `E / C` | Move up / down |
| `Scroll` | Adjust speed |
| `Left-click` | Fly to nearest star |
| `Space` | Advance to next stop (trajectory mode) |
| `H` | Hide / show control panel |
| `T` | Toggle star name labels |
| `Esc` | Close post card |

<br/>

## ✦ Project Structure

```
src/
├── app/
│   ├── (frontend)/          # Public-facing pages
│   │   ├── page.tsx         # Main 3D scene
│   │   └── post/[slug]/     # Post detail page
│   ├── (payload)/           # Payload admin routes
│   └── api/
│       ├── posts/           # GET /api/posts → star data
│       └── connections/     # GET /api/connections → constellation lines
├── collections/
│   ├── Posts.ts             # Blog post schema
│   ├── Connections.ts       # Constellation connections schema
│   └── Users.ts             # Auth
├── components/
│   ├── SpaceScene/          # Root canvas + data fetching
│   ├── BlogStars/           # Planet meshes + shaders
│   ├── ConstellationLines/  # Tube geometry lines
│   ├── CameraController/    # Free roam + fly-to
│   ├── TrajectoryController/# Guided tour logic
│   ├── ControlPanel/        # Top-left UI panel
│   ├── HUD/                 # Crosshair + status
│   └── PostCard/            # Post preview overlay
├── config/spaceConfig.ts    # Tag colors, trajectory sequences
├── store/spaceStore.ts      # Zustand global state
└── seed.ts                  # DB seed script
```

<br/>

## ✦ Deployment

This project is designed to deploy on **Vercel** with **MongoDB Atlas**.

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard:
   - `MONGODB_URI`
   - `PAYLOAD_SECRET`
   - `NEXT_PUBLIC_SERVER_URL` — set to your production URL (e.g. `https://space-blog.vercel.app`)
4. Deploy

> **Note:** After your first deploy, copy the production URL into `NEXT_PUBLIC_SERVER_URL` and redeploy to ensure the Payload admin panel works correctly.

<br/>

## ✦ Writing Posts

1. Go to `/admin` and create a user account
2. Create a new Post with:
   - `title`, `slug`, `date`, `excerpt`
   - `tags` — determines the planet's color and cluster
   - `size` — planet size (1–5)
   - `trajectoryOrder` — position in the default tour sequence
   - `position` — x/y/z coordinates in 3D space
   - `content` — rich text body (rendered on the post detail page)
3. Add constellation connections between posts via the Connections collection
4. The star field updates live on the next page load

<br/>

---

<div align="center">

*Made with React Three Fiber, Payload CMS, and a love for the cosmos.*

</div>