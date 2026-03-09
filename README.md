# 🪐 COSMOS — An AI Research Blog

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
✦ Big Bang intro               — planets explode from their centroid on first load
✦ Interactive 3D star field    — fly through a living solar system of posts
✦ Pointer-lock free roam       — WASD + mouse FPS navigation
✦ Observer mode                — click-to-focus with hover title hints
✦ Trajectory mode              — guided tours through topic clusters
✦ Constellation lines          — directional (marching dots) and bidirectional
                                  (solid tube) connections between related posts
✦ Planet shaders               — procedural GLSL planets, rings, moons
✦ Search bar                   — filter posts by title, tag, or excerpt; / to open
✦ Payload CMS backend          — full admin panel for writing & publishing
✦ Post detail overlay          — rich text rendered from Lexical editor
✦ Star name labels             — toggle with T key
✦ Mobile support               — touch controls with tap-to-focus
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
| Fonts | Libre Baskerville + Space Mono |
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

Populates MongoDB with 24 sample posts across topic clusters (Transformers/NLP, Alignment/Safety, Scaling/Empirics) arranged in 3D space, with directional constellation connections between them.

### Migrate connections (if upgrading from an older version)

If your database still uses the legacy `Connections` collection, run the one-time migration to move connection data into `relatedPosts` on each Post:

```bash
npx tsx migrate-connections.ts
```

Safe to run multiple times — it overwrites, does not append.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the cosmos awaits.

The Payload admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

<br/>

## ✦ Navigation

### Desktop

| Input | Action |
|---|---|
| `Right-click` | Toggle pointer lock (free roam) |
| `W A S D` | Move through space |
| `Mouse` | Look around |
| `E / C` | Move up / down |
| `Scroll` | Adjust speed |
| `Left-click` (free roam) | Teleport to star |
| `Click star` (observer) | Fly to and focus planet |
| `/` | Open search bar |
| `↑ ↓ Enter` | Navigate search results |
| `Esc` | Close search / post card |
| `H` | Hide / show control panel |
| `T` | Toggle star name labels |

### Mobile

| Input | Action |
|---|---|
| `1-finger swipe` | Move |
| `2-finger swipe` | Look |
| `Pinch` | Zoom |
| `Tap star` | Fly to and focus planet |

<br/>

## ✦ Project Structure

```
src/
├── app/
│   ├── (frontend)/              # Public-facing pages
│   │   ├── page.tsx             # Main 3D scene entry
│   │   ├── globals.css          # Design tokens + fonts
│   │   └── post/[slug]/         # Post detail page
│   └── (payload)/
│       └── api/
│           ├── posts/           # GET /api/posts → full star + connection data
│           └── posts/[slug]/    # GET /api/posts/:slug → post content
├── collections/
│   ├── Posts.ts                 # Schema — includes relatedPosts relationship
│   └── Users.ts
├── components/
│   ├── BigBangLoader/           # Loading screen + big bang waiting state
│   ├── BlogStars/               # Planet meshes, shaders, big bang spring animation
│   ├── CameraController/        # Orchestrates free roam + fly-to + tilt
│   ├── ConstellationLines/      # Directional dots + bidirectional solid tubes
│   ├── ControlPanel/            # Trajectory selector + controls UI
│   ├── HUD/                     # Crosshair, status badge, hover title hint
│   ├── MobileControls/          # Touch event handler
│   ├── PostCard/                # Planet focus preview card
│   ├── PostOverlay/             # Full post content drawer
│   ├── SearchBar/               # Title/tag/excerpt search, flies to result
│   ├── SpaceScene/              # Root canvas + DOM overlay composition
│   ├── StarField/               # Background star particles
│   ├── TrajectoryController/    # Guided tour sequencing
│   └── TrajectoryExitConfirm/   # Dialog when clicking a star mid-trajectory
├── config/
│   ├── spaceConfig.ts           # Tag colours, trajectory sequences, constellation tuning
│   ├── desktopConfig.ts         # Desktop camera constants
│   └── mobileConfig.ts          # Mobile camera + tap constants
├── hooks/
│   ├── camera/
│   │   ├── useBlogStarRegistry.ts  # Shared hitbox mesh registry for raycasting
│   │   ├── useFlyTo.ts             # Fly-to + tilt spring logic
│   │   ├── useFreeRoam.ts          # WASD pointer-lock movement
│   │   ├── useMobileCamera.ts      # Touch-driven camera
│   │   └── useUniverseBounds.ts    # Clamp position to world bounds
│   ├── useMobile.ts
│   ├── usePosts.ts                 # Fetch + store sync, exposes loading/error/refetch
│   └── useTrajectory.ts
├── store/spaceStore.ts             # Zustand — all shared UI + camera state
└── migrate-connections.ts          # One-time migration: Connections → relatedPosts
```

<br/>

## ✦ Writing Posts

1. Go to `/admin` and sign in
2. Create a new **Post** with:
   - `title`, `slug`, `date`, `excerpt`
   - `tags` — determines the planet's colour and trajectory cluster
   - `size` — planet size 1–5
   - `trajectoryOrder` — position in the default guided tour
   - `position` — x/y/z coordinates in 3D space
   - `content` — rich text body (Lexical editor)
   - `relatedPosts` — outgoing directional connections to other posts; if A→B and B→A both exist, they render as a bidirectional solid line
3. The star field updates on the next page load — no rebuild required

<br/>

## ✦ Constellation Connections

Connections are directional: **A → B** means A considers B related. If both posts link to each other, the pair is automatically detected and rendered as a **solid tube** instead of the marching-dot animation. All tuning constants live in `src/config/spaceConfig.ts` under the `CONSTELLATION_` prefix.

<br/>

## ✦ Deployment

Designed to deploy on **Vercel** with **MongoDB Atlas**.

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard:
   - `MONGODB_URI`
   - `PAYLOAD_SECRET`
   - `NEXT_PUBLIC_SERVER_URL` — set to your production URL (e.g. `https://space-blog.vercel.app`)
4. Deploy

> **Note:** After your first deploy, copy the production URL into `NEXT_PUBLIC_SERVER_URL` and redeploy to ensure the Payload admin panel resolves correctly.

<br/>

---

<div align="center">

*Made with React Three Fiber, Payload CMS, and a love for the cosmos.*

</div>
