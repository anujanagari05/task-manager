# TaskVibe ⚡ Modern MERN Stack Task Management Web Application

TaskVibe is a state-of-the-art, premium full-stack Task Management application featuring responsive dashboard panels, elegant glassmorphic panels, dark/light theme triggers, interactive status toggling, and visual weekly performance velocity trackers mapped using custom responsive HSL vector graphics.

---

## 🚀 Key Features

*   **Secure Authentication:** High-security login and registration interfaces utilizing JSON Web Tokens (JWT) stored client-side and verified via custom Express routing.
*   **Real-time Task CRUD:** Seamlessly create, edit, retrieve, and delete items with reactive dashboard updates.
*   **Intuitive Priority Indicators:** Color-coded priority badges (High: Rose, Medium: Amber, Low: Emerald) featuring glowing hover micro-animations.
*   **Smart Overdue Triggers:** Automatically tracks date deadlines and tags task cards as overdue or active with reactive calendar warnings.
*   **Dynamic Sorting & Searching:** Instantly filter tasks by status (All, Pending, Completed), select priority weights, or execute debounced term searches matching both titles and descriptions.
*   **Visual Velocity Chart:** Custom, responsive SVG performance charts displaying task completion rates and completion volumes over the last 7 days without requiring heavy third-party canvas bundles.
*   **Stateful Sidebar Navigation:** Track active workloads, review progress bars, toggle premium light/dark layouts, and inspect user profiles dynamically.

---

## 🛠️ Tech Stack Architecture

*   **Frontend:** React.js, Vite, Tailwind CSS v3, Lucide React, Axios
*   **Backend:** Node.js, Express.js, JSON Web Tokens, BcryptJS
*   **Database:** MongoDB Atlas (Mongoose ORM integration)

---

## 📦 Project Structure

```
mern-task-manager/
├── package.json         # Root runner config
├── server/              # Node.js + Express Backend
│   ├── config/          # Database connections
│   ├── middleware/      # Protected JWT endpoints check
│   ├── models/          # User & Task Mongoose Schemas
│   ├── routes/          # REST Endpoint handlers
│   └── server.js        # Main Express gateway
└── client/              # Vite + React Frontend
    ├── public/          # Assets
    ├── src/
    │   ├── components/  # Sidebar, TaskCard, Modals
    │   ├── context/     # AuthContext API Syncs
    │   ├── pages/       # Login, Register, Dashboard, Profile
    │   ├── App.jsx      # Theme coordinators & routers
    │   └── index.css    # Core HSL variables & glassmorphism
    └── tailwind.config.js
```

---

## 💻 Local Setup & Execution

### Prerequisites

*   Make sure you have [Node.js](https://nodejs.org/) (v16+ recommended) installed.
*   A running **MongoDB** database:
    *   **Local MongoDB:** If you have MongoDB installed locally, the server connects automatically to `mongodb://localhost:27017/taskmanager`.
    *   **MongoDB Atlas (Cloud):** Sign up on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) to spin up a free database.

---

### Step 1: Clone or Open the Workspace

Ensure that your current IDE terminal workspace is directed inside:
`C:\Users\Hp\.gemini\antigravity\scratch\mern-task-manager`

---

### Step 2: Configure Environment Variables

1. Go to the `server/` directory.
2. The active `.env` has already been pre-configured for local development. If connecting to a cloud instance, open `.env` and replace `MONGO_URI` with your actual MongoDB Atlas Connection String:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority
   JWT_SECRET=super_secret_key_1234567890_change_this_in_production
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

---

### Step 3: Start the Backend Server

1. Open a new terminal.
2. Navigate to the server folder and launch the Express engine:
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. The server will start in development mode on **`http://localhost:5000`** and log successful database connectivity checks.

---

### Step 4: Start the Frontend React Client

1. Open a second terminal window.
2. Navigate to the client folder and start the dev server:
   ```bash
   cd client
   npm install
   npm run dev
   ```
3. The client application will boot on **`http://localhost:5173`**. Click the terminal link to access your TaskVibe Dashboard in the browser!

---

## 🔗 API Endpoint Catalog

All API requests accept and return JSON bodies. Protected endpoints require the header `Authorization: Bearer <JWT_Token>`.

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Create new account. Returns JWT. |
| **POST** | `/api/auth/login` | Public | Authenticate user. Returns JWT. |
| **GET** | `/api/auth/profile` | Private | Fetch details for authenticated session. |
| **PUT** | `/api/auth/profile` | Private | Update profile details (Name, Email, password change). |

### Task Routes (`/api/tasks`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Private | Fetch tasks. Supports queries: `status`, `priority`, `search`, `sortBy`, `sortOrder`. |
| **GET** | `/api/tasks/:id` | Private | Fetch a specific task by ID. |
| **POST** | `/api/tasks` | Private | Create a task. Payload: `{ title, description, priority, dueDate }`. |
| **PUT** | `/api/tasks/:id` | Private | Update fields or toggle status. |
| **DELETE** | `/api/tasks/:id` | Private | Permanently remove task. |

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/notifications` | Private | Fetch recent notification cards populated with sender, task, and project. |
| **PUT** | `/api/notifications/:id/read` | Private | Mark a single notification card as read. |
| **PUT** | `/api/notifications/read-all` | Private | Mark all unread notification cards for the user as read. |
| **DELETE** | `/api/notifications/:id` | Private | Permanently delete a notification card from history. |

---

## 🌐 Production Deployment Steps

### Backend Hosting: [Render](https://render.com)

1. Sign up on **Render** and link your GitHub repository.
2. Select **New** + **Web Service**.
3. Set the following build options:
   *   **Runtime:** `Node`
   *   **Root Directory:** `server`
   *   **Build Command:** `npm install`
   *   **Start Command:** `npm start`
4. Add the following **Environment Variables** in Render's dashboard:
   *   `NODE_ENV` = `production`
   *   `MONGO_URI` = *(Your MongoDB Atlas connection URI)*
   *   `JWT_SECRET` = *(A secure production hashing string)*
5. Click **Deploy Web Service** and copy your generated Render Service URL (e.g. `https://taskvibe-api.onrender.com`).

---

### Frontend Hosting: [Vercel](https://vercel.com)

1. Sign up on **Vercel** and connect your repository.
2. Select **Import Project** and target the repository.
3. Configure the Project Settings:
   *   **Framework Preset:** `Vite`
   *   **Root Directory:** `client`
   *   **Build Command:** `npm run build`
   *   **Output Directory:** `dist`
4. Add the following **Environment Variable** in Vercel's settings to link it with your deployed backend:
   *   `VITE_API_URL` = *(Your Render Backend Service URL copied from the steps above)*
5. Click **Deploy**. Vercel will build your static React bundles and host the UI on a fast CDN!

---

## 📈 Verification Checklist

To verify that your full stack builds cleanly:
1. Ensure both packages run locally without compile errors.
2. Execute a React build check inside the client folder:
   ```bash
   cd client
   npm run build
   ```
3. Ensure the backend handles CORS requests correctly from any origin, making integration painless.
