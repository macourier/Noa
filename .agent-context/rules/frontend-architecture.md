# Frontend Architecture & Composition Patterns

> A complex UI is built from simple, mathematically robust functions. State is dangerous; isolate it.

## 1. File Structure (Feature-Driven Design)
Organize your application by feature domain, not by file type.
- **BANNED:** Monolithic directories like `/components` (with 500 files), `/hooks`, `/api`.
- **REQUIRED (Feature Sliced):**
  ```
  src/
    features/
      authentication/
        api/          #(login, logout fetchers)
        components/   #(LoginForm, ProfileView)
        hooks/        #(useAuth, useSession)
        store.ts      #(Zustand slice)
        types.ts      #(Zod schemas)
    components/       #(Global shared UI like Button, Modal)
    lib/              #(Axios instance, utility wrappers)
  ```

## 2. Separation of State and UI (Smart vs. Dumb)
- **Dumb Components (Presentational):** Receive data via `props`, emit events via callbacks (`onAction`). They do not know about the network, global context, or databases.
- **Smart Components (Containers):** Connect to global state (Redux/Zustand), fetch data (React Query), and pass it down.
- **Rule:** An intricate UI layout component should NEVER contain a `fetch` or `useQuery` call.

## 3. Server State vs. Client State
Modern frontend frameworks differentiate between remote and local data.
- **Server State (Async, Cached):** Data belonging to the database. MUST be managed by tools like `TanStack Query` (React Query) or `SWR`.
- **Client State (Sync, Ephemeral):** UI toggles, modal states, form drafts. Manage via `useState`, `useContext`, or `Zustand`.
- **BANNED:** Storing API responses in a global Redux/Zustand store (e.g., `dispatch(setUsers(data))`). Use React Query instead.

## 4. The Composition Pattern (Avoiding Prop Drilling)
If a component takes more than 5 props, or if props are passed down through 3+ intermediate components, the architecture is broken.
- **BANNED:** `<Layout user={user} theme={theme} onLogout={handleLogout} />`
- **REQUIRED:** Use React's `children` prop and composition.
  ```tsx
  // ✅ Clean composition
  <Layout>
    <Sidebar user={user} />
    <Content onLogout={handleLogout} />
  </Layout>
  ```

## 5. Explicit Component Contracts (Typing)
Every component **MUST** have an explicit, exported interface for its props.
- **BANNED:** `const Button = (props: any) => ...`
- **REQUIRED:** Prefix handlers with `on` and booleans with `is/has`.
  ```typescript
  export interface ButtonProps {
    variant: 'primary' | 'secondary';
    isLoading?: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }
  ```

## 6. Form Handling & Validation
Never write manual state bindings for complex forms.
- **Rule:** All forms MUST use a robust library (`react-hook-form` is the standard) combined with a schema validator (`Zod`).
- **BANNED:** Creating 5 `useState` variables for 5 input fields.

## 7. Performance & Re-renders
React is fast until you break it.
- **Rule:** Do not pass newly instantiated objects or arrow functions directly into dependency arrays (`useEffect`) or memoized components (`React.memo`) unless wrapped in `useMemo`/`useCallback`.
- **Rule:** Never execute expensive mapping/filtering inside the render path blindly without memoization.
