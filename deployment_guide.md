# Deployment Guide: Collaborative Study Platform 🚀

This document outlines the step-by-step process to deploy your **Collaborative Study Room Platform** into a live, production-grade cloud environment. We will host the Node.js backend on **Render** (as a persistent Web Service supporting WebSockets) and host the React + Vite frontend on **Vercel** (as a high-speed static deployment).

---

## 🛠️ Step 1: Set Up MongoDB Atlas (Cloud Database)

If you aren't already using MongoDB Atlas for cloud database storage:
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new free-tier shared cluster.
3. Under **Database Access**, create a database user (e.g. `collab_admin`) and copy the password.
4. Under **Network Access**, add a rule to allow connections from anywhere (`0.0.0.0/0`) since Render's free tier IPs rotate dynamically.
5. In your cluster dashboard, click **Connect** -> **Drivers**, select **Node.js**, and copy your connection string:
   ```text
   mongodb+srv://collab_admin:<password>@cluster0.vnekz6e.mongodb.net/study_collab?retryWrites=true&w=majority
   ```
   *(Keep this connection string ready to use in the backend env configuration!)*

---

## 🟢 Step 2: Deploy Backend Web Service (Render)

We deploy the Express.js server to **Render** because it provides native support for persistent TCP connections, allowing **Socket.io WebSockets** to run continuously without timeouts (unlike stateless Serverless platforms).

1. Log in to [Render.com](https://render.com) using your GitHub account.
2. Click the **New +** button in the dashboard and select **Web Service**.
3. Choose **Connect a repository** and select your repository: `vanshgupta11/Study-collab`.
4. Configure the service parameters precisely:
   - **Name**: `study-collab-api` (or any custom name)
   - **Region**: Select the closest geographic server region to you
   - **Branch**: `main`
   - **Root Directory**: `server`  *(⚠️ CRITICAL: Must be set to `server` as the backend is in a subfolder!)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

5. Scroll down and click **Advanced**, then add the following **Environment Variables**:
   
   | Key | Value | Purpose |
   |---|---|---|
   | `MONGO_URI` | `mongodb+srv://collab_admin:<password>@...` | Your Atlas MongoDB connection string |
   | `JWT_SECRET` | `a_highly_secure_random_production_secret_key` | Secret key for signing login auth tokens |
   | `PORT` | `10000` | Port for Render (Render maps outer HTTPS dynamically) |
   | `CLIENT_URL` | `https://your-app.vercel.app` | *⚠️ CRITICAL: Enter your temporary Vercel frontend URL here (we will update this in Step 4 once deployed!)* |

6. Click **Deploy Web Service**.
7. Render will build and deploy your backend. Once it goes green, copy your **Web Service URL** located at the top-left of the service page (e.g. `https://study-collab-api.onrender.com`).

---

## 🔵 Step 3: Deploy Frontend Client (Vercel)

We host the Vite static output on **Vercel** for lightning-fast loads.

1. Log in to [Vercel.com](https://vercel.com) using your GitHub account.
2. In the dashboard, click **Add New...** and select **Project**.
3. Import your GitHub repository: `vanshgupta11/Study-collab`.
4. Configure the Vite project details:
   - **Project Name**: `study-collab`
   - **Framework Preset**: `Vite` *(Vercel will auto-detect Vite)*
   - **Root Directory**: Click *Edit* and select **`client`** *(⚠️ CRITICAL: Must be set to `client`!)*
   - **Build & Development Settings**: Keep defaults (Build command: `vite build`, Output directory: `dist`)

5. Expand the **Environment Variables** accordion and add the following variable:
   
   | Key | Value | Purpose |
   |---|---|---|
   | `VITE_API_URL` | `https://study-collab-api.onrender.com/api` | **⚠️ CRITICAL**: Paste your live Render Web Service URL from Step 2, appending **`/api`** to the end of it! |

6. Click **Deploy**.
7. Vercel will bundle and compile your React app. Once complete, copy your newly generated live deployment URL (e.g. `https://study-collab.vercel.app`).

---

## ⚡ Step 4: Complete the CORS Bridge (Crucial)

To complete the real-time link and allow your browser to communicate securely between the Vercel frontend and Render backend, you must allow CORS:

1. Copy your live **Vercel Frontend URL** (e.g. `https://study-collab.vercel.app`).
2. Go to your **Render Dashboard** and select your backend Web Service (`study-collab-api`).
3. Click the **Environment** tab on the left navigation bar.
4. Locate the `CLIENT_URL` key and replace its value with your live Vercel URL:
   - **CLIENT_URL** = `https://study-collab.vercel.app` *(Do NOT add a trailing slash at the end!)*
5. Click **Save Changes**.
6. Render will automatically re-deploy the server with your updated environment configuration.

---

🎉 **Congratulations! Your Collaborative Study Platform is fully deployed and live!**
Open your Vercel URL in your browser, register an account, and experience real-time focus timers, chats, and shared classrooms!
