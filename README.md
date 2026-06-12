# Bribie Island Tigers FC — Training Hub

A training session management web app built for Bribie Island Tigers 
Football Club, Queensland. Admins create and publish structured training 
sessions; coaches access their drill sheets on mobile at the training ground.

## Features
- Role-based access (President, Admin, Coach)
- Training plan builder with interactive pitch diagram editor
- Drill sheet viewer optimised for mobile on-pitch use
- PDF export for printing
- Coach and team management
- User account management

## Tech Stack
- React 18 + Vite
- React Router v6
- Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- Plain CSS with custom properties — no component libraries
- Deployed on Vercel

## Screenshots
[add screenshots here]

## Running locally
1. Clone the repo
2. Copy .env.example to .env and add your Supabase credentials
3. npm install
4. npm run dev