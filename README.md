# 🌱 Habit Garden

Habit Garden is a full-stack habit-tracking web app that **gamifies consistency** by visually growing plants as users complete habits.  
Habits earn XP, XP levels up plants, and streaks reward long-term consistency.

**Live Demo:** [habit-garden-azure.vercel.app](https://habit-garden-azure.vercel.app/) 
**GitHub:** https://github.com/sammy2345/Habit-Garden

---

## ✨ Features

- 🔐 **Authentication**
  - Secure email/password auth using Supabase Auth
  - Row Level Security (RLS) ensures users only access their own data

- 🌿 **Habit Tracking**
  - Create daily or weekly habits
  - Complete habits once per day (duplicate completions prevented)
  - Per-habit streak tracking (current & best streak)

- 🪴 **Plant Growth System**
  - Habits award XP to plants
  - Plants visually change as they advance through growth stages
  - Animated transitions when a plant levels up

- 📊 **Dashboard**
  - “Today’s habits” with quick complete buttons
  - Main plant with XP progress bar and stage badge
  - 7-day activity summary

- 🎨 **Polished UI**
  - Reusable components (cards, buttons, modals, toasts)
  - Responsive layout
  - Smooth animations with Framer Motion

---

## 🛠 Tech Stack

### Frontend
- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Framer Motion**

### Backend
- **Supabase**
  - PostgreSQL
  - Authentication
  - RPC functions (Postgres functions)
  - Row Level Security (RLS)

### Deployment
- **Vercel** (frontend)
- **Supabase Cloud** (backend)

---

## 🧠 Architecture Highlights

- **Database-driven business logic**
  - Habit completion, XP awards, and streak updates are handled in a single atomic RPC (`complete_habit`)
  - Prevents double XP awards and race conditions

- **Schema versioning**
  - SQL files are split by responsibility:
    - tables
    - RPCs
    - RLS policies
    - auth triggers
    - schema migrations (e.g., streaks)

- **Reusable UI components**
  - Visual logic (plant stages & animations) is isolated from page logic
  - Easy to extend with new plant species or animations

## 🤖 AI Usage Disclaimer

AI tools (including ChatGPT) were used during the development of this project as a **productivity and learning aid**.  
They were primarily used to:
- brainstorm architecture and feature ideas
- clarify and design database schemas and SQL patterns
- assist with debugging and refactoring
- improve code readability and documentation
- support UI development and Tailwind CSS usage

All core implementation decisions, testing, and final design choices were made and verified by the author. This project reflects my own understanding of full-stack development concepts and best practices.

---

## Author’s Note

Hey everyone! 👋  
I hope you get a chance to explore and test **Habit Garden**, my first fully deployed full-stack project.

I’m a recent Computer Science graduate from the **University of Illinois at Chicago (UIC)**, and I built this project to strengthen my skills in full-stack development, database design, and production deployment. My goal was to create something both technically solid and genuinely enjoyable to use.

If you have any feedback, suggestions, or questions, I’d love to hear them. Thanks for checking out my work!


