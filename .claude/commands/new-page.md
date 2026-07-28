# Scaffold New Page

Create a new page following nxclip.ai conventions.

Steps:
1. Create `src/pages/$ARGUMENTS/$ARGUMENTS.tsx` as a functional React component with TypeScript
2. Add a route in `src/App.tsx` inside the authenticated layout (wrapped in `AuthGuard`)
3. Add a sidebar nav entry in `src/components/Sidebar.tsx` with a `lucide-react` icon
4. Follow the design system: dark creator-tech aesthetic, compact layout, `rounded-2xl` cards, Tailwind utility classes only

The page must:
- Use `useAppSelector` / `useAppDispatch` for any Redux state
- Call API via service modules in `src/services/apiClient.ts` — never directly
- Handle loading and error states
- Be fully typed — no `any`
