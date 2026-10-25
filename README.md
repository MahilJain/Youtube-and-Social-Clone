#Video Sharing Platform

It is a full-stack video-sharing application inspired by familiar
creator and video platforms. The backend provides the core API and MongoDB
domain model for users, videos, comments, likes, subscriptions, playlists,
tweets, and channel analytics. The frontend is an intentionally simple,
responsive React starting point that is being expanded in milestones.

> **Project status:** The backend API is implemented. The frontend currently
> contains the M1 foundation—responsive layout, routing, theme/sidebar state,
> query/store setup, and initial Axios resource clients. Most page routes are
> placeholders; authentication and the video feed/player have not yet been
> connected end-to-end. This README describes what exists today, not planned
> features as if they were finished.


## 60-second interview introduction

> “I built Streamline as a full-stack video-sharing application. The backend is
> an Express REST API backed by MongoDB and Mongoose. I organized it around
> resource routes, controllers, middleware, and schemas. JWT authentication
> supports both Bearer headers and HTTP-only cookies, and refresh tokens are
> rotated through a refresh endpoint. Video and image uploads pass through
> Multer to temporary disk storage and then Cloudinary, with the resulting
> URLs saved in MongoDB. The frontend is React 18 with Vite, React Router,
> Redux Toolkit for small client-only state, and TanStack Query planned for
> server state. I focused on documenting the API contract and laying a
> responsive, extensible frontend foundation before implementing the feature
> pages.”

## Repository structure

```text
Youtube/
├── Backend/
│   ├── src/
│   │   ├── app.js                 # Express app, middleware, route mounts, errors
│   │   ├── index.js               # dotenv, MongoDB connection, HTTP server
│   │   ├── constants.js           # Database name
│   │   ├── routes/                # HTTP paths and middleware composition
│   │   ├── controllers/           # Request validation and resource operations
│   │   ├── models/                # Mongoose schemas and relationships
│   │   ├── middlewares/           # JWT authentication and Multer uploads
│   │   ├── db/                    # MongoDB connection
│   │   └── utils/                 # API response/error, async handler, Cloudinary
│   ├── public/temp/               # Temporary Multer upload directory
│   ├── .env.sample
│   └── package.json
└── FrontEnd/
    ├── src/
    │   ├── app/                   # Redux store, router, QueryClient
    │   ├── api/                   # Axios clients and resource API modules
    │   ├── components/layout/     # Navbar, desktop/mobile navigation, layout
    │   ├── pages/                 # Home and initial route placeholders
    │   ├── App.jsx
    │   └── main.jsx
    ├── API_CONTRACT.md            # Endpoint-by-endpoint backend reference
    ├── .env.example
    └── package.json
```

## Technology choices

### Backend

- Node.js with ES modules
- Express 5 for HTTP routing and middleware
- MongoDB with Mongoose schemas, references, population, and aggregation
- JSON Web Tokens for access/refresh authentication
- bcrypt for password hashing
- Multer for multipart uploads
- Cloudinary for uploaded media storage
- `mongoose-aggregate-paginate-v2` is installed; current video and comment list
  endpoints implement page pagination directly with `skip` and `limit`.

### Frontend

- React 18 and Vite
- React Router 6 with a browser router and nested layout routes
- Redux Toolkit and React Redux for auth/preferences client state
- TanStack Query 5 for the server-state foundation
- Axios public/private clients with cookie credentials and a single-flight
  refresh attempt on 401 responses
- Tailwind CSS 4 with a class-based dark-mode variant
- React Hot Toast for notifications

## System and request pipeline

### Application startup

1. `Backend/src/index.js` loads environment variables.
2. The application connects to MongoDB using `MONGODB_URL` and the database
   name `youtube`.
3. Once connected, the Express server starts on `PORT` (8000 by default).
4. `Backend/src/app.js` configures CORS, JSON and URL-encoded body parsing,
   static serving from `public`, and cookie parsing.
5. Versioned routers are mounted below `/api/v1`; unmatched requests and
   controller errors pass to a centralized JSON error handler.

### Typical API request

```text
Browser
  → Axios request (for private requests: Bearer access token + cookies)
  → Express middleware (CORS, body/cookie parsing)
  → resource router
  → verifyJWT when the route is protected
  → controller validation/business operation
  → Mongoose query or mutation
  → ApiResponse JSON
```

Private API routes accept an access token from either the `accessToken` cookie
or an `Authorization: Bearer <token>` header. `verifyJWT` validates the JWT,
loads the user without password/refresh-token fields, and attaches it to
`req.user`.

Most successful backend responses use this envelope:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Resource retrieved successfully",
  "success": true
}
```

Errors use `{ "statusCode", "success": false, "message", "errors" }`. Dashboard
responses are an exception and return `{ "message", "data" }`.

### Authentication pipeline

1. Registration accepts profile fields and an avatar (with an optional cover
   image), hashes the password with bcrypt, and creates a user. Registration
   does not log the user in.
2. Login accepts email or username plus password, checks the bcrypt hash, and
   issues access and refresh JWTs.
3. Login returns the user and both token values in its JSON `data`, and also
   sets `accessToken` and `refreshToken` as HTTP-only cookies.
4. Protected requests validate the access token. The frontend private Axios
   client attaches a Bearer token when present.
5. On a 401, the private client calls `POST /api/v1/users/refresh-token` once
   per concurrent refresh, using cookies, then retries the original request
   with the new access token.
6. Refresh verifies the presented token against the token stored for that
   user, generates a new token pair, and rotates the cookies.
7. Logout removes the stored refresh token and clears both cookies.

### Media upload pipeline

```text
multipart request
  → Multer writes a uniquely named file to Backend/public/temp
  → controller validates required metadata and file fields
  → Cloudinary upload (resource_type: auto)
  → temporary local file is removed
  → Cloudinary URL is stored in the relevant MongoDB document
  → API returns the created/updated document
```

Video publishing expects `videoFile` and `thumbnail` fields (one file each),
plus `title`, `description`, and numeric `duration`. Multer's configured maximum
is 500 MiB per file. User registration expects an `avatar` file and optionally
accepts `coverImage`.

The current upload pipeline is synchronous from the controller's perspective.
There is no backend transcode job, processing-status endpoint, HLS manifest
contract, or quality-variant API.

## MongoDB schema and relationships

All seven schemas enable Mongoose timestamps, so documents also have
`createdAt` and `updatedAt`.

| Model | Important fields | Relationships and behavior |
|---|---|---|
| **User** | `username`, `email`, `fullName`, `avatar`, `coverImage`, `watchHistory`, `password`, `refreshToken` | `username` and `email` are unique; password is bcrypt-hashed. `watchHistory` references Videos. Sensitive password and refresh-token fields are excluded from user response projections. |
| **Video** | `videoFile`, `thumbnail`, `title`, `description`, `duration`, `views`, `isPublished`, `owner` | `owner` references User. `views` defaults to 0 and `isPublished` defaults to true. Media fields contain Cloudinary URLs. |
| **Comment** | `content`, `video`, `owner` | References a Video and its owning User. There is no parent-comment field, so nested replies are not represented. |
| **Like** | `video?`, `comment?`, `tweet?`, `likedBy` | References one supported target and the liking User. Partial unique indexes prevent duplicate likes for each target type. The schema does not define a target-count field. |
| **Subscription** | `subscriber`, `channel` | Both reference User. A unique compound index prevents duplicate `(subscriber, channel)` records. |
| **Playlist** | `name`, `description`, `videos`, `owner` | `videos` is an array of Video references; `owner` references User. Description defaults to an empty string. |
| **Tweet** | `content`, `owner` | Owner references User. Tweets are text posts, not video uploads. |

Relationship summary:

```text
User 1 ── owns ── * Video
User 1 ── writes ─ * Comment ── belongs to ── 1 Video
User * ── likes ── * Video / Comment / Tweet  (Like records)
User * ── subscribes to ── * User             (Subscription records)
User 1 ── owns ── * Playlist ── contains ── * Video
User 1 ── writes ─ * Tweet
User 1 ── watchHistory ── * Video
```

## Backend API overview

The base URL is `/api/v1`. The complete contract, including request fields,
response shapes, auth requirements, and pagination details, is in
[FrontEnd/API_CONTRACT.md](./FrontEnd/API_CONTRACT.md).

| Resource | Route prefix | Capabilities |
|---|---|---|
| Health check | `/healthcheck` | Service health response |
| Users | `/users` | Register, login, logout, refresh, current user, account/password/profile images, channel profile, watch history |
| Videos | `/videos` | Published listing/search/page pagination, publish, read, update, delete, publish toggle |
| Comments | `/comments` | List with page pagination/search/sort, create, edit, delete |
| Likes | `/likes` | Toggle video/comment/tweet likes; list current user's liked videos |
| Subscriptions | `/subscriptions` | Toggle subscription; list channel subscribers and subscribed channels |
| Playlists | `/playlists` | Create/read/update/delete and add/remove videos |
| Tweets | `/tweets` | Create/list/update/delete text posts |
| Dashboard | `/dashboard` | Current channel stats and own videos |

Video listing uses page-based pagination (`page`, `limit`) and can search title
and description using `query`; sorting supports `createdAt`, `updatedAt`,
`views`, and `title`. Comment listing is also page-based. Other list endpoints
are not paginated.

## Frontend architecture and current scope

- `src/main.jsx` mounts Redux, TanStack Query, the router, and the toast
  provider.
- `src/app/store.js` keeps only authentication credentials and UI preferences
  (theme and sidebar expansion) in Redux. Theme/sidebar choices persist in
  local storage. Server data belongs in TanStack Query, not Redux.
- `src/app/queryClient.js` defines shared query defaults.
- `src/app/router.jsx` declares nested routes under a persistent `Layout` and
  lazy-loads page modules.
- `src/api/client.js` defines public/private Axios instances with
  `withCredentials: true`; private requests attach the current Bearer token
  and attempt one refresh/retry on 401.
- `src/api/auth.js` and `src/api/videos.js` are initial resource API modules.
- Layout includes a responsive navbar, desktop collapsible sidebar, mobile
  bottom navigation, URL-based search navigation, and dark-mode toggle.
- The Home page is a designed empty-feed state. Watch, channel, search,
  upload, studio, library, and sign-in routes are currently placeholders.

The root-level `Youtube` directory is the Git repository root. The separate
`Backend` and `FrontEnd` directories keep their own package manifests and
dependency installs.

## Run locally

### 1. Backend

```powershell
cd Backend
npm install
Copy-Item .env.sample .env
npm run dev
```

Set real local values in `Backend/.env` before running:

- `PORT` (defaults to 8000)
- `CORS_ORIGIN` (for local frontend use `http://localhost:5173`)
- `MONGODB_URL` (defaults in the sample to local MongoDB)
- `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

The backend connects to the database named `youtube`. Cloudinary credentials
are required for the upload endpoints. Do not commit a real `.env` file or
secrets.

### 2. Frontend

In a separate terminal:

```powershell
cd FrontEnd
npm install
Copy-Item .env.example .env
npm run dev
```

`FrontEnd/.env.example` sets:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Useful frontend commands:

```powershell
npm run build
npm run lint
npm run preview
```

## Important implementation notes and current limitations

- The `/videos/:videoId` read endpoint increments the view count on every
  successful request. The backend route is public and does not add that view
  to authenticated watch history; the history update in the controller only
  runs if `req.user` exists, but the route is not mounted with `verifyJWT`.
- Login and refresh issue HTTP-only cookies. Production cookies are secure and
  use `SameSite=None`; cross-site production deployments require HTTPS and an
  exact credential-enabled CORS origin.
- Registration requires an avatar upload. It returns a created user but does
  not set login cookies.
- The backend implements likes and subscribe toggles, but there is no read
  endpoint for per-viewer like state or aggregate like counts.
- Comments do not support nested replies.
- There is no notification/Socket.IO API, combined subscription video feed,
  HLS/transcoding status endpoint, or playlist listing endpoint for a public
  channel profile.
- The frontend foundation is not yet a full video platform UI. Authentication,
  feed cards/infinite loading, watch player, comments, upload form, and library
  pages remain future implementation work.

## Interview discussion points

1. **Why separate routes and controllers?** Routes define the HTTP surface and
   middleware ordering; controllers handle request validation and coordinate
   persistence or external upload work; models own document shape and indexes.
2. **How is media handled?** Multipart files land in a temporary directory
   through Multer, then Cloudinary returns durable URLs that are saved to
   MongoDB. MongoDB stores metadata and URLs rather than the binary media.
3. **How does authentication work?** bcrypt verifies passwords; JWTs identify
   users; the middleware accepts cookie or Bearer access tokens; refresh
   tokens are compared with the stored token and rotated.
4. **How is duplicate data prevented?** Unique indexes cover usernames,
   emails, subscription pairs, and per-user likes per target type.
5. **How is frontend state divided?** Redux is reserved for small client
   session/preferences state; TanStack Query is the chosen owner for API
   results and mutation invalidation.
6. **What would be a next architectural step?** Complete auth hooks and
   protected routes, then add resource query/mutation hooks and feed/watch
   pages. If asynchronous transcoding is added, use a job/status model and
   expose processing state instead of treating an upload URL as a ready HLS
   asset.
