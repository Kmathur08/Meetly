# Meetly

Meetly is a browser-based video meeting app for small teams. Sign in, start a room, share the link, and talk face to face with up to six people, with no downloads.

## Features

- **Video and audio calls** over WebRTC, peer to peer, for up to 6 people per room
- **Screen sharing** that everyone in the room sees, with a one-click switch back to your camera
- **Room chat** with recent history for people who join late
- **Mute and camera indicators** on every participant's tile
- **Accounts and meeting history**, with sessions that expire and a real sign-out
- **Invite links**: paste a full link or just the room code to join

## Tech stack

| Part | Tools |
| --- | --- |
| Frontend | React 19, Vite, socket.io-client, WebRTC |
| Backend | Node.js, Express 5, Socket.io, MongoDB (Mongoose), bcrypt |
| Hosting | Frontend on Vercel, backend on Render |

## Running it locally

You need Node.js 20 or newer and a MongoDB database (local or Atlas).

```bash
npm run install:all

# Backend: copy the example settings and adjust MONGO_URI if needed
cp Backend/.env.example Backend/.env
npm run backend            # http://localhost:8080

# Frontend, in a second terminal: point it at the local backend
cp Frontend/.env.example Frontend/.env   # then switch to the localhost values listed in the file
npm run frontend           # http://localhost:5173
```

Open two browser windows (one of them private) and sign in with two different accounts to try a call. Camera and microphone access needs `localhost` or HTTPS.

## Settings

**Backend** (`Backend/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on (default 8080) |
| `MONGO_URI` | MongoDB connection string |
| `CLIENT_ORIGIN` | Comma-separated frontend URLs allowed to call the API. Set this in production. |
| `SESSION_DAYS` | How long a login lasts (default 7) |
| `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` | Optional TURN relay. Without one, some calls on mobile data or office networks can't connect. |

**Frontend** (`Frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend REST base, ending in `/api/v1/users` |
| `VITE_SOCKET_URL` | Backend origin for the Socket.io connection |

## Checks

```bash
npm test        # backend and frontend unit tests
npm run lint    # ESLint for the frontend
```

## How a call works

1. The browser opens a Socket.io connection with the user's session token. The server rejects it if the session is missing or expired.
2. `join-room` adds the user to the room. The server replies with the people already there and the recent chat.
3. The newcomer creates one `RTCPeerConnection` per participant and sends an offer. Offers, answers and ICE candidates travel through the server's `signal` event, which only relays between members of the same room.
4. Audio and video then flow directly between browsers, encrypted with DTLS-SRTP. Screen sharing swaps the outgoing video track with `replaceTrack`, so no renegotiation is needed.

## Known limits

- Calls are a full mesh, so each person uploads one stream per participant. Six people is the practical ceiling without a media server (SFU).
- Rooms and chat live in the server's memory. They reset when it restarts, and running several backend instances would need the Socket.io Redis adapter.
- Password reset by email isn't available yet.
