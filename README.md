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
