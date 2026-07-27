# nxclip.ai Project Instructions

This file contains persistent instructions and project-specific rules for the nxclip.ai application.

## Project Overview
nxclip.ai is an AI-powered platform designed for gaming creators to generate, manage, and optimize their content.

## Tech Stack
- **Frontend:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS (Modern "dark creator-tech" aesthetic)
- **State Management:** Redux Toolkit
- **Backend:** Custom API Gateway (`https://api-gateway-216098834386.us-central1.run.app`) via `identityApi`, `contentApi`, `feedApi`, `analyticsApi`, `notificationApi`, `coachApi` in `src/services/apiClient.ts`
- **Auth:** JWT tokens (1hr access / 30-day refresh) managed via `src/services/auth/authService.ts`
- **Animations:** motion (from `motion/react`)
- **Icons:** lucide-react
- **Charts:** recharts

## Design System & Aesthetic
The application follows a premium, professional, and sleek "dark creator-tech" design language.

### Colors
- **Base:** Neutral graphite/charcoal palette for dark mode.
- **Surface:** Subtle layering using neutral grays (e.g., `bg-white/5` in dark mode).
- **Accent:** nxclip.ai signature brand gradient (Purple/Indigo/Violet) used sparingly for high-impact elements.
- **Text:** High contrast for primary content, muted grays for secondary information.

### Layout & Spacing
- **Compactness:** Maintain a professional, compact layout. Avoid excessive whitespace.
- **Sidebar:** 240px width (expanded), 64px (collapsed).
- **TopBar:** 56px (14 units) height.
- **Padding:** Standardized 32px (8 units) for main content areas, 20-24px for cards.

### Components
- **Borders:** Subtle borders (`border-gray-100` in light, `border-white/10` or `border-dark-border` in dark).
- **Border Radius:**
  - Buttons/Inputs: 10px - 12px (`rounded-lg` or `rounded-xl`).
  - Cards/Panels: 14px - 16px (`rounded-2xl`).
- **Shadows:** Subtle, soft shadows for depth. Avoid heavy, dark shadows.
- **Premium Cards:** Use the `.premium-card` utility class for consistent styling.

## Coding Patterns
- **Utility First:** Use Tailwind CSS utility classes directly.
- **Functional Components:** Use React functional components with hooks.
- **Type Safety:** Maintain strict TypeScript typing across the project.
- **API Calls:** Always use the service modules in `src/services/apiClient.ts`. Never call the gateway URL directly.
- **Error Handling:** Propagate structured `ApiError` objects from `apiClient.ts`. Display user-friendly messages via `sonner` toasts.
- **Lucide Icons:** Use `lucide-react` for all icons. Standardize sizes (16-18px for UI icons, 20-24px for feature icons).

## Feature Specifics
- **Image Studio:** AI-driven image and meme generation.
- **Clip Trimmer:** Tool for highlighting and trimming gameplay.
- **AI Coach:** LLM-powered creator advice and analytics interpretation.
- **Analytics:** Data visualization for content performance.
- **Home Feed:** Social-style discovery feed for creator content.
