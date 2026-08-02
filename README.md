# Magical Room

This repository contains a starter project for a magical pixel-style room built with Vue 3 + TypeScript + three.js on the frontend and Node.js + Express + MySQL on the backend.

Features included in this skeleton:
- three.js scene with pixelated render hints, placeholder avatar, notebook, and a winged cat
- Notebook UI overlay that fetches posts and comments from the backend
- Backend REST API for posts and comments (MySQL)
- One-per-day loader animation (stored in localStorage)

How to run
1. Install dependencies:
   npm install

2. Setup MySQL and database:
   - Run the SQL in db/schema.sql to create database and seed sample posts.

3. Start backend API server:
   npm run server

4. Start frontend dev server:
   npm run dev

The frontend expects the API on http://localhost:3000 by default. You can edit server/index.js to change the database connection.

Assets
- Put glTF models in public/models/ and reference them in src/components/ThreeScene.vue. A placeholder is used in the scene now.

Next steps you may want:
- Replace placeholder geometries with glTF models (avatar, cat, notebook)
- Add animations for avatar via AnimationMixer
- Add socket.io real-time comments
- Polish pixel shader / palette mapping for Illit-like look
