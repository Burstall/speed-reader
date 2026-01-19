# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Speed Reader is a personal RSVP (Rapid Serial Visual Presentation) web app using ORP (Optimal Recognition Point) focal letter technique. Displays one word at a time with a highlighted focal letter, enabling reading speeds of 150-1200 WPM.

**Reference app**: https://focus-reader-alpha.vercel.app/

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State**: Zustand with persist middleware
- **PDF Parsing**: pdf-parse (server-side)
- **Deployment**: Vercel

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Architecture

### ORP Algorithm
The focal letter position is calculated by word length:
- 1-2 chars → index 0
- 3-6 chars → index 1
- 7-8 chars → index 2
- 9-10 chars → index 3
- 11+ chars → ~35% position

### Key Components
- `WordDisplay` - RSVP display with focal letter highlight
- `useRsvpEngine` - Timing engine using requestAnimationFrame
- `readerStore` - Zustand store for playback state

### API Routes
- `/api/auth` - Simple password authentication
- `/api/parse/pdf` - PDF text extraction (8s timeout)
- `/api/fetch/substack` - Article fetching via session cookie

## Important Constraints

- **Vercel limits**: 10s function timeout, 4.5MB request body
- **Substack credentials**: Never store persistently - session-only
- **Timing**: Use `requestAnimationFrame` not `setInterval` for high WPM precision

## Authentication

Simple password gate for personal use. Middleware protects all routes except `/login`. Future upgrade path to NextAuth.js and Web3 token-gating.

## Claude Code Framework

This project uses the "flashback" framework for session management:
- **Session memory**: `.claude/flashback/memory/REMEMBER.md`
- **Working plan**: `.claude/flashback/memory/WORKING_PLAN.md`
- **Slash commands**: `/fb:*` prefix (e.g., `/fb:session-start`, `/fb:working-plan`)
