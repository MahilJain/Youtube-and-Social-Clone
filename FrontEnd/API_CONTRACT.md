# Backend API Contract

This contract describes the routes currently mounted by the Express backend in
`Backend/Backend/src/app.js`. The API base path is `/api/v1`. The backend has no
request-validator directory; validation below reflects checks implemented in
controllers and Mongoose schemas.

## Conventions

- Standard success response: `{ statusCode, data, message, success: true }`
  (`success` is derived from `statusCode < 400`). The dashboard endpoints are an
  exception and return `{ message, data }`.
- Standard error response: `{ statusCode, success: false, message, errors }`.
  `errors` defaults to an empty array. Validation, malformed ObjectId, and
  Multer errors are reported as HTTP 400; duplicate-key errors as 409; missing
  routes/resources as 404; authorization failures as 401/403. The body parser
  uses the same shape for errors.
- Pagination, where implemented, is page-based: query `page` (default 1) and
  `limit` (default 10, clamped to 1–100). Paginated data is
  `{ <items>, pagination: { total, page, limit, totalPages } }`. No endpoint
  uses cursor pagination.
- Authenticated routes accept a JWT from the `accessToken` cookie or an
  `Authorization` header using the Bearer scheme with the access-token value.
  The frontend should send `withCredentials: true` for cookie-based refresh.
- `POST /users/login` and `POST /users/refresh-token` set `accessToken` and
  `refreshToken` cookies. Both are `httpOnly`; in production they are `secure`
  and `SameSite=None`, and otherwise `SameSite=Lax`. Login also includes both
  token strings in its JSON response; refresh includes both as well. Logout
  clears both cookies and removes the stored refresh token.
- CORS allows `process.env.CORS_ORIGIN` (default `true`) and credentials. The
  backend `.env.sample` sets `CORS_ORIGIN=http://localhost:5173`. For a deployed
  frontend, set `CORS_ORIGIN` to its exact origin; cross-site cookies also
  require HTTPS because production cookies are secure.
- Multipart uploads use Multer disk storage, with a 500 MiB per-file limit.
  Uploaded assets are sent to Cloudinary by controllers.
- Unless stated otherwise, request bodies are JSON.

## Endpoints

### Users — `/users`

| Method + path | Auth | Request body / query / params | Success response (`data`) |
|---|---|---|---|
| `POST /users/register` | No | `multipart/form-data`: `fullName`, `email`, `username`, `password`; `avatar` file required (one); `coverImage` file optional (one). Password must be at least 6 characters. | HTTP 201; user document without `password` and `refreshToken`. Does **not** log the user in or set cookies. |
| `POST /users/login` | No | JSON: `email` or `username`, and `password`. | `{ user, accessToken, refreshToken }`; sets both auth cookies. |
| `POST /users/logout` | Yes | No body, query, or params. | `null`; clears both auth cookies. |
| `POST /users/refresh-token` | No | Cookie `refreshToken`, or JSON `{ refreshToken }` when cookie is unavailable. | `{ accessToken, refreshToken }`; rotates and sets both cookies. |
| `POST /users/change-password` | Yes | JSON: `{ oldPassword, newPassword }`; new password must be at least 6 characters. | `null`. Stored refresh token is cleared, but this endpoint does not clear cookies or return replacement tokens. |
| `GET /users/current-user` | Yes | No body, query, or params. | Authenticated user document excluding `password` and `refreshToken`. |
| `PATCH /users/update-account` | Yes | JSON: `{ fullName, email }` (both required). | Updated user document excluding `password` and `refreshToken`. |
| `PATCH /users/avatar` | Yes | `multipart/form-data`: `avatar` file, one. | Updated user document excluding `password` and `refreshToken`. |
| `PATCH /users/cover-image` | Yes | `multipart/form-data`: `coverImage` file, one. | Updated user document excluding `password` and `refreshToken`. |
| `GET /users/c/:username` | Yes | Path `username`. | Channel profile: `{ _id, fullName, username, avatar, coverImage, subscribersCount, channelsSubscribedToCount, isSubscribed }`. |
| `GET /users/history` | Yes | No body, query, or params. | Array of watched video documents, with each video's `owner` populated with `fullName`, `username`, and `avatar`. Not paginated. |

### Videos — `/videos`

| Method + path | Auth | Request body / query / params | Success response (`data`) |
|---|---|---|---|
| `GET /videos` | No | Query: `page`, `limit`; optional `query` (case-insensitive title/description substring), `userId` (owner filter), `sortBy` (`createdAt`, `updatedAt`, `views`, or `title`), `sortType` (`asc` or default descending). | `{ videos, pagination }`; each video's `owner` is populated with `fullName`, `username`, and `avatar`. Page-based. Only published videos are returned. |
| `POST /videos/publish` | Yes | `multipart/form-data`: text fields `title`, `description`, `duration` (finite number >= 0), optional `isPublished`; files `videoFile` (one) and `thumbnail` (one), both required. `isPublished` is false only for the string/boolean `false`; otherwise true. | HTTP 201; created video document. |
| `PATCH /videos/toggle-publish/:videoId` | Yes | Path `videoId`; no body required. | Updated video document with inverted `isPublished`. Owner only. |
| `PATCH /videos/:videoId` | Yes | Path `videoId`; optional JSON fields `title`, `description`, `duration`, `isPublished`; optional multipart file `thumbnail` (one). If sending a thumbnail, use multipart form fields for other updates too. | Updated video document. Owner only. |
| `DELETE /videos/:videoId` | Yes | Path `videoId`; no body required. | `null`; removes this video's ID from users' watch histories. Owner only. |
| `GET /videos/:videoId` | No | Path `videoId`; no body or query. | Published video document with populated `owner` (`fullName`, `username`, `avatar`). **Every successful request increments `views` by one.** This route is not behind `verifyJWT`, so it does not record watch history, even if a cookie is sent. |

### Comments — `/comments`

| Method + path | Auth | Request body / query / params | Success response (`data`) |
|---|---|---|---|
| `GET /comments/:videoId` | No | Path `videoId`; query `page`, `limit`, optional `query` (content substring) and `sortType` (`asc` or default descending by creation date). | `{ comments, pagination }`; each comment's `owner` is populated with `username`, `fullName`, and `avatar`. Page-based. |
| `POST /comments/:videoId` | Yes | Path `videoId`; JSON `{ content }`, non-empty after trimming. | HTTP 201; created comment with populated `owner` (`username`, `fullName`, `avatar`). |
| `PATCH /comments/c/:commentId` | Yes | Path `commentId`; JSON `{ content }`, non-empty after trimming. | Updated comment document. Owner only. |
| `DELETE /comments/c/:commentId` | Yes | Path `commentId`; no body required. | `null`. Owner only. |

### Likes — `/likes`

All routes in this section require authentication.

| Method + path | Auth | Request body / query / params | Success response (`data`) |
|---|---|---|---|
| `POST /likes/toggle/v/:videoId` | Yes | Path `videoId`; no body required. | `{ liked: true, like }` (HTTP 201) or `{ liked: false }` (HTTP 200). |
| `POST /likes/toggle/c/:commentId` | Yes | Path `commentId`; no body required. | `{ liked: true, like }` (HTTP 201) or `{ liked: false }` (HTTP 200). |
| `POST /likes/toggle/t/:tweetId` | Yes | Path `tweetId`; no body required. | `{ liked: true, like }` (HTTP 201) or `{ liked: false }` (HTTP 200). |
| `GET /likes/videos` | Yes | No body, query, or params. | Array of liked video documents, each with populated `owner` (`username`, `fullName`, `avatar`). Not paginated. |

### Playlists — `/playlists`

All routes in this section require authentication. Playlist reads are not
restricted to the owner by the controller; playlist modifications are.

| Method + path | Auth | Request body / query / params | Success response (`data`) |
|---|---|---|---|
| `POST /playlists` | Yes | JSON `{ name, description? }`; name required and non-empty. | HTTP 201; created playlist. |
| `GET /playlists/user/:userId` | Yes | Path `userId`. | Array of that user's playlists, each with populated `videos`. |
| `GET /playlists/:playlistId` | Yes | Path `playlistId`. | Playlist with populated `videos`. |
| `PATCH /playlists/:playlistId` | Yes | Path `playlistId`; optional JSON `{ name, description }`. | Updated playlist. Owner only. |
| `DELETE /playlists/:playlistId` | Yes | Path `playlistId`; no body required. | `null`. Owner only. |
| `POST /playlists/:playlistId/videos/:videoId` | Yes | Path `playlistId`, `videoId`; no body required. | Updated playlist with populated `videos`. Owner only. |
| `DELETE /playlists/:playlistId/videos/:videoId` | Yes | Path `playlistId`, `videoId`; no body required. | Updated playlist with populated `videos`. Owner only. |

### Subscriptions — `/subscriptions`

All routes in this section require authentication. The routes with `/c/` and
`/u/` are aliases to the corresponding long-form routes.

| Method + path | Auth | Request body / query / params | Success response (`data`) |
|---|---|---|---|
| `POST /subscriptions/toggle/:channelId` | Yes | Path `channelId`; no body required. Cannot subscribe to oneself. | `{ subscribed: true }` or `{ subscribed: false }` (HTTP 200). |
| `POST /subscriptions/c/:channelId` | Yes | Path `channelId`; no body required. Alias of toggle route. | `{ subscribed: true }` or `{ subscribed: false }` (HTTP 200). |
| `GET /subscriptions/channel/:channelId/subscribers` | Yes | Path `channelId`. | Array of `{ subscriber: { _id, username, fullName, avatar, coverImage } }`. |
| `GET /subscriptions/c/:channelId` | Yes | Path `channelId`. Alias for channel subscribers. | Same as the long-form channel-subscribers route. |
| `GET /subscriptions/user/:subscriberId/channels` | Yes | Path `subscriberId`. | Array of `{ channel: { _id, username, fullName, avatar, coverImage } }`. |
| `GET /subscriptions/u/:subscriberId` | Yes | Path `subscriberId`. Alias for subscribed channels. | Same as the long-form subscribed-channels route. |

### Tweets — `/tweets`

All routes in this section require authentication.

| Method + path | Auth | Request body / query / params | Success response (`data`) |
|---|---|---|---|
| `POST /tweets` | Yes | JSON `{ content }`, non-empty after trimming. | HTTP 201; created tweet. |
| `GET /tweets/user/:userId` | Yes | Path `userId`. | Array of user's tweets, newest first; `owner` populated with `username`, `fullName`, and `avatar`. |
| `PATCH /tweets/:tweetId` | Yes | Path `tweetId`; JSON `{ content }`, non-empty after trimming. | Updated tweet. Owner only. |
| `DELETE /tweets/:tweetId` | Yes | Path `tweetId`; no body required. | `null`. Owner only. |

### Dashboard — `/dashboard`

All routes in this section require authentication and operate on the current
user's channel.

| Method + path | Auth | Request body / query / params | Success response |
|---|---|---|---|
| `GET /dashboard/stats` | Yes | No body, query, or params. | `{ message, data: { totalSubscribers, totalLikes, totalVideos, totalViews } }`. This endpoint does not return the standard `statusCode` or `success` fields. |
| `GET /dashboard/videos` | Yes | No body, query, or params. | `{ message, data: [video, ...] }`; includes the current user's videos, published and unpublished. Not paginated. This endpoint does not return the standard `statusCode` or `success` fields. |

### Health check — `/healthcheck`

| Method + path | Auth | Request body / query / params | Success response (`data`) |
|---|---|---|---|
| `GET /healthcheck` | No | No body, query, or params. | `null`; response message is `"OK - Server is healthy 🚀"`. |

## Mongoose models

All models use Mongoose timestamps unless otherwise noted below; documents
therefore also have `createdAt` and `updatedAt`.

- **User**: `username` (required, unique, lowercase, trimmed, indexed),
  `email` (required, unique, lowercase, trimmed), `fullName` (required, trimmed,
  indexed), `avatar` (required URL string), `coverImage` (string),
  `watchHistory` (array of `Video` ObjectId references), `password` (required,
  bcrypt-hashed before save), `refreshToken` (string). Password and refresh
  token are omitted from user responses using explicit projections.
- **Video**: `videoFile` (required URL string), `thumbnail` (required URL
  string), `title` (required string), `description` (required, trimmed string),
  `duration` (required number), `views` (number, default 0), `isPublished`
  (boolean, default true), `owner` (required `User` ObjectId reference).
- **Comment**: `content` (required string), `video` (required `Video` ObjectId
  reference), `owner` (required `User` ObjectId reference).
- **Like**: optional `video` (`Video` reference), `comment` (`Comment`
  reference), or `tweet` (`Tweet` reference); `likedBy` (required `User`
  reference). Unique partial indexes prevent duplicate likes by the same user
  for each target type.
- **Subscription**: `subscriber` (`User` reference), `channel` (`User`
  reference). A unique index covers the `(subscriber, channel)` pair.
- **Playlist**: `name` (required string), `description` (string, default empty),
  `videos` (array of `Video` references), `owner` (required `User` reference).
- **Tweet**: `content` (required string), `owner` (`User` reference).

## Missing in backend

- Nested comment replies: comments have no parent/reply field or reply endpoint.
- Video/comment/tweet like counts and per-viewer liked state: toggle endpoints
  exist, but no read endpoint supplies counts or whether the current viewer
  liked each item. The like list endpoint only returns the current user's
  liked videos.
- HLS manifests, quality variants, transcoding/processing status, and status
  polling: uploads store a Cloudinary URL in `videoFile`; no processing API or
  HLS contract is present.
- Notifications or realtime events: no notification endpoint or Socket.IO
  setup is present.
- A videos feed for subscribed channels: the API lists subscribed channels but
  does not return their videos as a combined feed.
- Search filters beyond title/description substring and `sortBy`/`sortType`
  sorting (for example category, duration, or upload-date filters).
- Playlist tabs/feed on a public channel page: playlist read endpoints require
  authentication, and there is no public channel-playlist listing endpoint.
- A password-reset flow.
