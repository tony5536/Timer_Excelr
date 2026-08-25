# ExcelR Training Session Timer

A polished ExcelR session dashboard built with React + TypeScript + Vite for countdown-driven training sessions, live stopwatches, fullscreen presenter mode, and session configuration with local persistence.

## Features

- Session countdown to a configured start time
- Automatic transition from countdown to live stopwatch
- Pause and resume support while session is live
- End session confirmation flow
- Session title, date, and start time configuration
- LocalStorage persistence for the current session setup and timer state
- Display mode for presenting the timer externally
- Fullscreen presenter display optimized for projectors and large screens
- Responsive dark ExcelR-inspired corporate theme

## Tech Stack

- React 19
- TypeScript
- Vite
- CSS custom styling

## Installation

```bash
npm install
```

## Usage

Start the local development server:

```bash
npm run dev -- --host 0.0.0.0
```

Open the local URL printed by Vite, usually:

```bash
http://localhost:5173/
```

## Build Commands

Production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview -- --host 0.0.0.0
```

## Development Commands

```bash
npm run dev -- --host 0.0.0.0
npm run build
```

## GitHub Setup

If you are ready to publish this repository to GitHub:

```bash
git init
git branch -M main
git add .
git commit -m "Build ExcelR training session timer"
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your GitHub repository URL after creating the repository in GitHub.
