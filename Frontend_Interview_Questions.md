# CampusSwap — Frontend Interview Questions

**Role:** Frontend Developer (React)
**Codebase:** CampusSwap — MERN + AI Marketplace
**Difficulty Levels:** Easy, Moderate, Hard

---

## EASY

### 1. What is the entry point of this React application, and how does it render the app?

**File:** `src/index.js`

```js
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Answer:** `index.js` is the entry point. It uses `ReactDOM.createRoot()` (React 18+ API) to mount the `<App />` component into the `#root` div, wrapped in `<React.StrictMode>` for development warnings.

---

### 2. How is routing set up in this application?

**File:** `src/App.js`

**Answer:** The app uses `react-router-dom` v7 with `<BrowserRouter>`, `<Routes>`, and `<Route>`. There are four routes:
- `/` → `Home`
- `/login` → `Login`
- `/register` → `Register`
- `/create` → `CreateListing` (protected)

The `<Navbar />` is rendered outside `<Routes>` so it appears on every page.

---

### 3. How does the Navbar conditionally render content based on authentication?

**Files:** `src/components/Navbar.js`, `src/context/AuthContext.js`

**Answer:** The Navbar calls `useAuth()` to get the `user` object. If `user` is truthy, it shows "Sell Item", "Hi, {firstName}", and Logout. If `user` is null, it shows Login and Sign Up links.

---

### 4. How does the ProductCard component display a product?

**File:** `src/components/ProductCard.js`

**Answer:** It receives `product` and `onClick` props. It renders:
- An image (or an icon placeholder — `FiFileText` for notes, `FiCpu` for gadgets)
- A type badge (`Note` or `Gadget`)
- Title, department, AI caption, price (or "FREE" if `price === 0`), and seller name

---

### 5. How is the Axios API client configured?

**File:** `src/services/api.js`

**Answer:** An Axios instance is created with `baseURL` from the `REACT_APP_API_URL` env var. A request interceptor reads the JWT token from `localStorage` and sets the `Authorization: Bearer <token>` header on every outgoing request automatically.

---

### 6. How does the Home page handle loading and empty states?

**File:** `src/pages/Home.js` (lines 100–106)

**Answer:** When `loading` is true, it shows "Loading listings...". When products array is empty after loading, it shows "No listings found" with a prompt to be the first to list something.

---

### 7. What happens when a user clicks "Logout" in the Navbar?

**Files:** `src/components/Navbar.js` (line 11–14), `src/context/AuthContext.js` (line 27–30)

**Answer:** `handleLogout` calls `logout()` from AuthContext, which removes the JWT token from `localStorage` and sets `user` to null. Then it navigates to `/login`.

---

### 8. How does the Register form handle form state?

**File:** `src/pages/Register.js`

**Answer:** It uses a single `useState` hook with an object `{ name, email, password, department, whatsappNumber }`. Each input updates its corresponding key using the spread operator: `setForm({ ...form, fieldName: e.target.value })`.

---

### 9. What library is used for icons, and which icon sets are used?

**Answer:** `react-icons` v5, specifically the Feather Icons set (`Fi*`): `FiPlusCircle`, `FiLogOut`, `FiShoppingBag`, `FiSearch`, `FiFileText`, `FiCpu`, `FiX`, `FiMessageCircle`, `FiFlag`, `FiTrash2`, `FiUploadCloud`, `FiLoader`.

---

### 10. How does the app protect the `/create` route from unauthenticated users?

**File:** `src/App.js` (lines 11–15, 25–31)

**Answer:** A `ProtectedRoute` wrapper component checks `useAuth()`. If `loading` is true, it shows a loading screen. If `user` is null, it redirects to `/login` via `<Navigate>`. Otherwise, it renders the children (`<CreateListing />`).

---

### 11. How does the Login form handle errors?

**File:** `src/pages/Login.js` (lines 22–23)

**Answer:** The `catch` block sets an error message from `err.response?.data?.error` or a fallback "Login failed". The error message is displayed in a `<div className="auth-error">` above the form fields.

---

### 12. What are the available category filters on the Home page?

**File:** `src/pages/Home.js` (line 8)

**Answer:** The categories are: `['All', 'Electronics', 'Stationery', 'Notes', 'Books', 'Other']`. They are rendered as pill-shaped buttons, and the active one gets the class `filter-btn active`.

---

### 13. How does pagination work on the Home page?

**File:** `src/pages/Home.js` (lines 120–136)

**Answer:** The API returns `totalPages`. When `totalPages > 1`, Previous/Next buttons appear. Previous is disabled when `page <= 1`, Next is disabled when `page >= totalPages`. Clicking updates the `page` state, which triggers `fetchProducts`.

---

### 14. What styling approach is used in this project?

**Answer:** Plain CSS files imported per component/page. No CSS preprocessors (Sass/Less), no CSS-in-JS, no Tailwind. The theme is dark with `#0a0a1a` background, `#16213e`/`#1a1a2e` cards, and `#e94560` accent color.

---

## MODERATE

### 15. Explain the authentication flow from login to protected route access.

**Files:** `src/pages/Login.js` → `src/context/AuthContext.js` → `src/services/api.js`

**Answer:**
1. User submits email/password on the Login page
2. `login(form)` POSTs to `/auth/login` via Axios
3. Backend returns `{ token, user }`
4. `loginUser(token, userData)` stores the token in `localStorage` and sets `user` state
5. The AuthContext `user` state propagates to all consumers (Navbar, ProtectedRoute)
6. Subsequent API calls automatically attach the token via the Axios interceptor
7. On page refresh, `AuthProvider`'s `useEffect` reads the token from `localStorage` and calls `getMe()` to validate and restore the user session

---

### 16. How does the ProductModal handle the "Chat to Buy" WhatsApp integration?

**File:** `src/components/ProductModal.js` (lines 24–27)

**Answer:** It constructs a WhatsApp deep link URL:
```
https://wa.me/{phone}?text={encodedMessage}
```
The phone number is stripped of non-digit characters, and a pre-filled message including the product title and price is URL-encoded. This opens WhatsApp with the message ready to send.

---

### 17. How are AI-generated recommendations fetched and displayed in the modal?

**File:** `src/components/ProductModal.js` (lines 13–19, 118–127)

**Answer:** When the modal mounts (or `product._id` changes), a `useEffect` calls `getRecommendations(product._id)`. The response data is stored in `recommendations` state. If there are recommendations, they are rendered as a grid of `ProductCard` components below the product details.

---

### 18. How does the CreateListing page handle file uploads for images vs PDFs?

**File:** `src/pages/CreateListing.js` (lines 25–34, 92–114)

**Answer:** The file input's `accept` attribute dynamically changes: `image/*` for Gadgets, `application/pdf` for Notes. On file selection:
- If the file is an image, `URL.createObjectURL()` generates a preview
- If it's a PDF, no preview is generated (placeholder shown)
The file is appended to `FormData` and sent as `multipart/form-data` to the API.

---

### 19. How does the AuthContext restore user session on page refresh?

**File:** `src/context/AuthContext.js` (lines 10–20)

**Answer:** The `useEffect` runs once on mount. It checks `localStorage` for a token. If found, it calls `getMe()` to validate the token and fetch the current user. On success, `user` is set. On failure (expired/invalid token), the token is removed from `localStorage`. In both cases, `loading` is set to `false`.

---

### 20. How does the Home page reset pagination when filters change?

**File:** `src/pages/Home.js` (lines 47–49)

**Answer:** A separate `useEffect` watches `search`, `category`, and `department`. Whenever any of these change, it resets `page` to 1 so the product list starts from the first page with the new filters.

---

### 21. How is `useCallback` used to optimize the product fetch function?

**File:** `src/pages/Home.js` (lines 24–40)

**Answer:** `fetchProducts` is wrapped in `useCallback` with `[search, category, department, page]` as dependencies. This ensures the function reference only changes when its dependencies change, preventing unnecessary re-renders of the `useEffect` that depends on it.

---

### 22. How does the ProductModal determine whether to show "Delete Listing" vs "Report"?

**File:** `src/components/ProductModal.js` (lines 23, 36–44, 96–113)

**Answer:** It compares the logged-in user's `_id` with the product's `sellerId._id`. If they match (`isOwner = true`), it shows a "Delete Listing" button. If they don't match and a user is logged in, it shows "Chat to Buy" and "Report" buttons.

---

### 23. How does the app handle multipart/form-data submission for product creation?

**File:** `src/services/api.js` (lines 28–31), `src/pages/CreateListing.js` (lines 45–54)

**Answer:** The CreateListing page builds a `FormData` object with file, type, price, department, and optional title/description. The Axios interceptor adds the auth token. The `createProduct` function explicitly sets `Content-Type: multipart/form-data` in the request headers.

---

### 24. What would happen if the `REACT_APP_API_URL` environment variable is not set?

**File:** `src/services/api.js` (line 3)

**Answer:** The Axios `baseURL` would fall back to `'http://localhost:5000/api'`. In production, if this env var is missing, the app would try to connect to `localhost:5000` instead of the actual production API URL, causing all API calls to fail.

---

### 25. How does the modal close when clicking outside the content area?

**File:** `src/components/ProductModal.js` (lines 47–48)

**Answer:** The outer `.modal-overlay` div has an `onClick={onClose}` handler. The inner `.modal-content` div has `onClick={(e) => e.stopPropagation()}`. So clicking the overlay (outside the content) closes the modal, but clicking inside the content does not.

---

## HARD

### 26. How would you implement optimistic deletion of a product?

**Files:** `src/pages/Home.js` (lines 51–53), `src/components/ProductModal.js` (lines 36–44)

**Answer:** Currently, deletion is not optimistic — it waits for the API response. To make it optimistic:
1. Immediately filter the product out of the products array in Home's `handleDelete`
2. Close the modal
3. Fire the delete API call
4. If the API call fails, revert the product back to the array and show an error toast
This would require keeping a backup of the previous state before filtering.

---

### 27. What problems could arise from using `URL.createObjectURL` in `handleFileChange` without revocation?

**File:** `src/pages/CreateListing.js` (line 30)

**Answer:** `URL.createObjectURL` creates a blob URL that persists until explicitly revoked. If a user uploads multiple files without submitting, each call creates a new blob URL. Memory leaks can occur because the previous blob URLs are never revoked via `URL.revokeObjectURL()`. A cleanup `useEffect` returning a revoke call would fix this.

---

### 28. How would you add client-side form validation to the CreateListing form beyond required fields?

**File:** `src/pages/CreateListing.js`

**Answer:** You could add:
- Price validation: ensure `price > 0` and is a valid number (currently just `min="0"`)
- File size validation: reject files > 10MB before upload
- File type validation: verify MIME type matches the selected listing type
- Department validation: ensure a department is selected (currently required by HTML5 but no custom message)
These would be checked in `handleSubmit` before the API call, with specific error messages set via `setError()`.

---

### 29. How does the `useCallback` + `useEffect` pattern in Home.js compare to using `useEffect` directly with inline async?

**File:** `src/pages/Home.js` (lines 24–44)

**Answer:** The pattern here is:
- `fetchProducts` is defined with `useCallback` and called inside a `useEffect` that depends on it
- This is functionally equivalent to defining an async function inside `useEffect` directly
- The benefit of `useCallback` is that `fetchProducts` can be reused elsewhere (e.g., passed as a prop, called from event handlers) without recreating the function reference
- A downside is slightly more code; the simpler alternative would be an inline async IIFE inside `useEffect`

---

### 30. Implement a custom hook `useDebounce` and integrate it with the search bar to reduce API calls.

**File:** `src/pages/Home.js`

**Answer:** A `useDebounce` hook would look like:
```js
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```
Usage: `const debouncedSearch = useDebounce(search, 400);` then pass `debouncedSearch` to `fetchProducts` dependencies instead of `search`. This prevents an API call on every keystroke.

---

### 31. What edge case exists in the current product recommendations `useEffect`?

**File:** `src/components/ProductModal.js` (lines 13–19)

**Answer:** The `useEffect` only depends on `[product]`. If `product` changes but `product._id` is the same (e.g., title updated via props), the effect won't re-run. Additionally, there's no cleanup or abort controller — if the component unmounts before the fetch completes, it will call `setRecommendations` on an unmounted component (React 18 warns about this but doesn't crash).

---

### 32. How would you refactor the auth forms (Login/Register) to use a shared form validation utility?

**Files:** `src/pages/Login.js`, `src/pages/Register.js`

**Answer:** Both forms share similar patterns (loading, error, submit handling). You could:
1. Create a `useForm` custom hook that manages form state, validation rules, errors, and submission
2. Define validation schemas per form (e.g., email format, password min length, required fields)
3. Share common UI via a reusable `<FormField>` component for inputs, selects, and error displays
4. The hook would return `{ values, errors, loading, handleChange, handleSubmit }`

This reduces duplication: Login (62 lines) and Register (95 lines) could each shrink by ~40%.

---

### 33. What security concern exists with the WhatsApp URL construction in ProductModal?

**File:** `src/components/ProductModal.js` (lines 25–27)

**Answer:** The WhatsApp link uses `encodeURIComponent` which is sufficient for XSS prevention in URLs. However, the seller's phone number is exposed to the client as plain text in the API response and in the DOM. A malicious script injected elsewhere on the page could scrape all seller phone numbers. A better approach might be to proxy the WhatsApp link through the backend or only reveal the number after user interaction.

---

### 34. How does React Router v7's `<Navigate>` component handle redirection in the ProtectedRoute?

**File:** `src/App.js` (lines 11–15)

**Answer:** `<Navigate to="/login" />` is a declarative redirect component. When rendered (i.e., when `user` is null and `loading` is false), it replaces the current location in the history stack with `/login`. It's equivalent to calling `navigate('/login', { replace: true })` imperatively. The `replace` behavior by default prevents the user from pressing "Back" to return to the protected page.

---

### 35. How would you implement infinite scroll instead of pagination on the Home page?

**File:** `src/pages/Home.js`

**Answer:** You would:
1. Remove the `page`/`totalPages` state and pagination UI
2. Use an Intersection Observer on a sentinel element at the bottom of the grid
3. When the sentinel becomes visible and there are more products, append the next page's results to the existing products array instead of replacing them
4. Change `fetchProducts` to append: `setProducts(prev => [...prev, ...res.data.products])`
5. Track a `hasMore` flag from the API instead of `totalPages`

The key challenge is handling filter changes (which should reset the list and observer).

---

### 36. Identify and explain a potential race condition in the current Home page implementation.

**File:** `src/pages/Home.js` (lines 24–44)

**Answer:** If filters or page changes rapidly (e.g., user rapidly clicks pagination buttons or types in search), multiple `fetchProducts` calls will fire concurrently. Since the API responses may arrive out of order, a stale response from an earlier request could overwrite the results from a later request. Fixes:
1. Use an AbortController to cancel in-flight requests when dependencies change
2. Use a debounce on the search input
3. Track a request counter and ignore stale responses (`let currentRequest = 0;` pattern)

---

### 37. How would you implement offline support for listing browsing?

**Files:** `src/pages/Home.js`, `src/services/api.js`

**Answer:** You could:
1. Add a service worker (Workbox) to cache API responses from `GET /products`
2. Use a stale-while-revalidate strategy for product listings
3. Store the last-fetched products in `localStorage` or IndexedDB as a fallback cache
4. On the Home page, check `navigator.onLine` and fall back to cached data if offline
5. Show an "Offline — showing cached data" banner
6. During the `catch` in `fetchProducts`, load from the local cache instead of showing an error

---

### 38. What are the implications of using `window.confirm` for delete confirmation?

**File:** `src/components/ProductModal.js` (line 37)

**Answer:** `window.confirm()` is synchronous and blocks the main thread. Benefits: simple, no extra state needed. Drawbacks: unstyled (breaks the app's dark theme UX), cannot be customized, doesn't work well in some mobile browsers, and provides no accessibility. A better UX would be a custom modal component with "Cancel" and "Confirm" buttons, styled consistently, with keyboard (Escape to cancel) and screen reader support.

---

### 39. Design a simplified state management solution to replace the current Context API if the app needs to share product cart data across multiple pages.

**Files:** `src/context/AuthContext.js`

**Answer:** For a cart feature, the Context API could still work but with optimization:
1. Create a `CartContext` with `{ items, addItem, removeItem, clearCart }`
2. Store cart in `localStorage` for persistence across sessions
3. To avoid re-renders in unrelated components, split into `CartStateContext` and `CartDispatchContext`
4. If performance becomes an issue (many cart updates), switch to `useReducer` instead of `useState`
5. For truly large scale, consider Zustand or Jotai for simpler selector-based subscriptions without unnecessary re-renders

---

### 40. How would you implement end-to-end type safety across the frontend and backend?

**Current state:** No TypeScript, no shared types.

**Answer:** You would:
1. Migrate the frontend to TypeScript (rename `.js` → `.tsx`)
2. Create a shared types package or folder (e.g., `shared/types.ts`) with interfaces for `User`, `Product`, `ApiResponse<T>`, etc.
3. Use the backend's Mongoose schemas as the source of truth for type generation
4. Use Zod or io-ts for runtime validation on both sides
5. Type the Axios responses: `api.get<Product[]>('/products')`
6. Use `zod` schemas to validate API responses at runtime, catching backend contract violations early
7. Generate TypeScript types from the OpenAPI/Swagger spec if one is introduced
