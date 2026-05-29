# StudyRoom: Collaborative Study Platform 🚀

StudyRoom is a high-fidelity, real-time MERN stack application designed for students and professionals to study collaboratively. It incorporates virtual study rooms, live interactive chat, real-time multiplayer activity feeds, shared focus session timers, and a unified analytical dashboard to measure learning progress.

---

## 🌟 Key Features

- **🔐 Robust Authentication & Security**
  - Secure registration and login workflows with custom password hashing.
  - REST API endpoint protection using JSON Web Token (JWT) authorization headers.
  - Real-time connection guard verifying JWT handshake during WebSocket authorization.

- **🏫 Dynamic Study Rooms**
  - Create custom classrooms with descriptive goals.
  - Automatically generates unique 6-character alphanumeric invite codes.
  - Instant room joining via invite codes, facilitating instant focus circles.
  - Complete owner administration (delete rooms with cascade database cleanups for messages and focus logs).

- **⏱️ Shared Focus Session Timer**
  - Interactive counting-up stopwatch hook (`useTimer`) tracking focus durations.
  - Automatic session logging (`POST /api/sessions/start` and `/end/:id`).
  - Broadcasts live member focus alerts (`session-started`, `session-ended`) to the classroom activity feed.

- **💬 Live Multiperson Chat & Auto-scroll**
  - Persistent real-time chat powered by Socket.io.
  - Preserves scroll locks during older message lookups and automatically snaps down to the newest inputs upon incoming streams.
  - Populates sender information and keeps a ledger of history records.

- **⚡ Real-Time Activity Feed**
  - Sidebar streaming room coordination events (member joins, leaves, focus session initiations and ends).
  - Clear visual indicator showing active network connectivity with the socket server.

- **📊 Unified Analytical Dashboard**
  - Sleek glassmorphism metrics tracking **Total Study Time** (formatted as `Xh Ym`), **Total Sessions completed**, and **Rooms Joined**.
  - Custom list grid mapping focus times directly onto active workspace components (`RoomCard`).
  - Chronological records ledger presenting the last 10 session logs (Room, Timestamp, and formatted Durations).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS, Lucide Icons, Context API |
| **Backend** | Node.js, Express.js, Socket.io, Express Validator |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JSON Web Token (JWT), bcryptjs |

---

## 📂 Project Structure

```
collaborative classroom/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI widgets (ChatBox, SessionTimer, RoomCard, etc.)
│   │   ├── context/        # React Context (AuthContext, SocketContext)
│   │   ├── hooks/          # Custom react hooks (useTimer)
│   │   ├── pages/          # Primary page views (DashboardPage, RoomPage, Login, etc.)
│   │   └── services/       # axios API setup
│   └── tailwind.config.js  # Styling guidelines
└── server/                 # Node.js + Express backend
    ├── config/             # Database connection setups
    ├── controllers/        # REST controllers (auth, room, session)
    ├── middleware/         # Auth filters and validator checkpoints
    ├── models/             # Schema specifications (User, Room, Session, Message)
    ├── routes/             # REST routing routes
    ├── socket/             # WebSocket handlers
    └── server.js           # Server startup script
```

---

## 🚀 Setup & Installation Instructions

Follow these steps to run the application locally on your computer.

### Prerequisites
- Node.js (v16.0.0 or higher recommended)
- MongoDB installed locally or a MongoDB Atlas account

---

### 1. Backend Server Setup

1. Open a terminal window and navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install the backend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` configuration file in the root of the `server/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/collaborative_classroom
   JWT_SECRET=super_secret_jwt_token_key_123_change_this_in_production
   ```

4. *(Optional)* Start the MongoDB service if running locally.

---

### 2. Frontend Client Setup

1. Open a second terminal window and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

3. Vite connects to `http://localhost:5000/api` out-of-the-box inside `client/src/services/api.js`. If you wish to configure this value dynamically, configure a `.env` file inside the `client/` directory with:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

---

## 💻 Running Locally

### Step 1: Start the Backend Server
In the server terminal, start the server in development mode (using Nodemon):
```bash
npm run dev
```
*The server will start on `http://localhost:5000` with confirmation that MongoDB connected successfully.*

### Step 2: Start the Frontend Client
In the client terminal, start the Vite development server:
```bash
npm run dev
```
*The client application will start. Open your web browser and navigate to `http://localhost:5173` (or the address shown in the terminal).*

---

## 📊 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user and retrieve JWT |
| `GET` | `/api/auth/me` | Private | Retrieve active user's profile |

### 🏫 Study Rooms (`/api/rooms`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/rooms` | Private | Create a study room workspace |
| `GET` | `/api/rooms` | Private | List all rooms user is a member of |
| `GET` | `/api/rooms/:id` | Private | Get room metadata, members, and last 50 chats |
| `POST` | `/api/rooms/join` | Private | Join room using a 6-character invite code |
| `DELETE` | `/api/rooms/:id` | Private | Delete room and cascade delete data (Owner only) |
| `GET` | `/api/rooms/:id/sessions` | Private | Fetch session history logged in a room |

### ⏱️ Study Sessions (`/api/sessions`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/sessions/start` | Private | Create a new active study session |
| `POST` | `/api/sessions/end/:id` | Private | Mark session as completed and calculate focus time |
| `GET` | `/api/sessions/my` | Private | Retrieve user's session history ledger |
| `GET` | `/api/sessions/stats` | Private | Retrieve aggregated focus times and per-room breakdowns |

---

## 📡 Socket.io Events Reference

### Client-Side Emits
- `join-room`: Sent on page load. Handshake binds user socket to the room channel.
- `leave-room`: Sent on unmount. Unbinds user socket from the room channel.
- `send-message`: Sends text input to be saved and broadcasted.
- `session-started`: Triggers a room notification that a member has started studying.
- `session-ended`: Triggers a room notification that a member has stopped focus timer.

### Server-Side Broadcasts
- `user-joined`: Sent to other channel members notifying a user joined.
- `user-left`: Sent to other channel members notifying a user left.
- `receive-message`: Emits the saved database chat message structure.
- `room-activity`: Emits real-time focus details (`type: session_start` or `session_end` with precise seconds duration).

---

## 🖥️ Screen Previews Placeholder

```
========================================================================
|                                                                      |
|  [     StudyRoom Analytics Dashboard: Modern Glassmorphic View     ] |
|                                                                      |
|  +-------------------+  +-------------------+  +------------------+  |
|  | TOTAL STUDY TIME  |  |  TOTAL SESSIONS   |  |   ROOMS JOINED   |  |
|  |     12h 45m       |  |        18         |  |        4         |  |
|  +-------------------+  +-------------------+  +------------------+  |
|                                                                      |
|  [My Study Rooms]                                                    |
|  +---------------------+  +---------------------+                    |
|  | CS101 Lounge        |  | Algorithms Circle   |                    |
|  | 5 Members · #E9X1P2 |  | 8 Members · #A3K8W9 |                    |
|  | Time: 5h 20m        |  | Time: 7h 25m        |                    |
|  | [Join Room]         |  | [Join Room]         |                    |
|  +---------------------+  +---------------------+                    |
|                                                                      |
========================================================================
```

*(Screenshots will be uploaded here following live deployments)*

---

## 🌐 Deployment Notes

To launch your platform into production, we recommend deploying backend and frontend layers independently:

### 1. Backend Web Server (Render)
- Deploy your backend code from a GitHub repository to [Render](https://render.com) as a **Web Service**.
- Select the `Node` environment.
- Add your environment variables (`MONGO_URI`, `JWT_SECRET`, `PORT=10000`) in the service settings page.
- Render automatically maps HTTPS ports to the Node process. Ensure your client links directly to this Render hostname.

### 2. Frontend Static Host (Vercel / Netlify)
- Deploy your `client/` folder to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) using standard Git hooks.
- Configure your **Framework Preset** as `Vite`.
- Define **Output Directory** as `dist`.
- Set **Environment Variable** `VITE_API_URL` to point to your live Render Web Service API URL (`https://your-backend.onrender.com/api`).
- *Note: Vite processes environment variables during building. Ensure variables are loaded under Settings -> Environment Variables before executing builds.*
