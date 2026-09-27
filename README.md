# HadaLink

**"Connecting farmers with agricultural equipment when they need it."**

HadaLink is a digital marketplace connecting farmers with agricultural equipment owners, rental providers, mechanization service providers, and qualified equipment operators. It is an access layer that helps farmers discover, compare, and coordinate access to fragmented agricultural equipment and mechanization services across Nigeria.

This repository contains a complete, functional frontend prototype. There is no real backend, database server, authentication server, payment gateway, external API, or cloud storage. The browser's `localStorage` acts as the local database, and the application is structured so that a real backend can be introduced later with minimal UI changes.

> Prototype notice: all data is demonstration data stored in your browser. Payments and authentication are simulated. HadaLink does not own the listed equipment and does not guarantee availability or the cheapest price. Verification is a document review, not a physical inspection.

---

## Technology stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4 |
| State | React `useSyncExternalStore` bound to the local database store |
| Database | Browser `localStorage` behind a repository layer |
| Tooling | ESLint (eslint-config-next), Next.js build pipeline |

No other runtime dependencies are used. Icons are inline SVGs and imagery is locally generated so the app works offline.

## How to install and run

```bash
# from the project root
npm install

# start the development server
npm run dev
# open http://localhost:3000

# production build and serve
npm run build
npm start

# lint
npm run lint
```

Node.js 20 or newer is recommended.

## Demo accounts

The login screen has one-click demo buttons for each role. You can also log in manually:

| Role | Email | Password | What it demonstrates |
| --- | --- | --- | --- |
| Farmer demo | `farmer@hadalink.ng` | `demo1234` | Search, filter, compare, save, book, pay (simulated), review, message |
| Provider demo | `provider@hadalink.ng` | `demo1234` | List equipment, manage availability, accept/reject bookings, complete jobs, view earnings and reviews |
| Admin demo | `admin@hadalink.ng` | `demo1234` | Verify providers, manage users and listings, monitor bookings/transactions, moderate reviews, manage categories, configure commission |

Demo data covers selected farming locations across Nigeria (Zaria, Kaduna, Kano, Jos, Minna, Ibadan, Enugu, Awka, Bauchi, and others). This is demonstration data and does not represent a launched nationwide service.

You can switch between roles at any time from the user menu ("Demo: switch role") during a pitch.

## Application structure

```
app/                  Next.js App Router pages (public site, farmer, provider, admin areas)
components/
  ui/                 Reusable primitives: Button, Input, Select, Modal, Drawer, Card,
                      Badge, Table, EmptyState, LoadingState, ErrorState, ConfirmDialog,
                      Toast, Pagination, RatingStars, Avatar, ClientOnly
  layout/             SiteHeader, SiteFooter, DashboardShell (sidebar + mobile bottom nav), RoleGuard
features/             Feature modules: listings (cards, search, compare), bookings (request form,
                      cards), messages (thread), reviews (form), home (showcase)
services/             Application services with all business rules (auth, listings, bookings,
                      payments, reviews, notifications, messaging, saved listings, verification,
                      categories, profiles, admin, analytics, demo tools)
repositories/         Typed CRUD repositories over the local database (swap for REST later)
lib/                  Storage wrapper (safe localStorage), local database (hydrate, persist,
                      subscribe, reset), id/date/format/validation helpers
data/                 Seed database builder with realistic Nigerian demo data
types/                Shared TypeScript models and result types
hooks/                React bindings: useAuth, useDatabase, useListings (useSyncExternalStore)
scripts/              Smoke test that exercises the full service layer end to end
public/images/        Locally generated Nigerian/African agricultural imagery
```

Data flow:

```
UI (components / features / pages)
  -> hooks (useSyncExternalStore subscriptions)
    -> services (business rules, role checks, domain events)
      -> repositories (typed CRUD)
        -> lib/db (in-memory state + localStorage persistence + pub/sub)
```

The UI never calls `localStorage` directly and never contains database logic.

## localStorage database architecture

Two localStorage keys are used:

- `hadalink:db:v1`: the whole database (JSON document with the schema below)
- `hadalink:session:v1`: the simulated session (`{ userId, startedAt }`)
- `hadalink:compare:v1`: the compare shortlist (UI convenience state)

Initialization behavior:

1. On first load the app checks whether the database key exists.
2. If it does not exist, realistic Nigerian demo data is seeded.
3. If it exists, it is loaded and validated. Corrupted data is discarded and the seed is restored (the user is informed).
4. Existing user data is never overwritten automatically.

Every mutation goes through `services` and `repositories`, is written to `localStorage` immediately, and notifies subscribers so the UI updates instantly and survives refresh.

### Main entities

| Collection | Purpose |
| --- | --- |
| `users` | Accounts: name, email, phone, role (FARMER / PROVIDER / ADMIN), status |
| `farmers` | Farmer profiles: farm name, size, location, preferred services |
| `providers` | Provider profiles: business name, description, verification status, rating |
| `listings` | Marketplace listings (equipment or service): title, category, price, pricing unit, condition, operator included, terms, status |
| `equipment` | Spec sheets for equipment listings (brand, model, horsepower, year) |
| `services` | Scope sheets for service listings (scope, duration, deliverables) |
| `categories` | Admin-managed categories (Tractors, Ploughing, Planting, Harvesting, Irrigation, Transportation, Processing, Other) |
| `availability` | Per-date provider blocks: AVAILABLE (default), BOOKED, UNAVAILABLE |
| `bookings` | Requests and jobs with status workflow, amounts, commission |
| `transactions` | Simulated payment records with commission breakdown |
| `reviews` | One review per completed booking, ratings 1 to 5 |
| `notifications` | Per-user events (booking, payment, review, verification, account) |
| `messages` | Booking-based conversations with read status |
| `savedListings` | Farmer shortlists |
| `verificationRequests` | Provider verification submissions and admin decisions |
| `settings` | Commission rate (5% default), currency, demo mode, schema version |

## Main workflows

### The marketplace loop (farmer)

1. Farmer searches equipment/services (keyword, category, location, price range, availability, operator, verification).
2. Farmer compares up to 3 listings side by side.
3. Farmer opens a listing, checks availability and provider verification, then sends a booking request (date, quantity, farm location, notes).
4. Booking is `PENDING`; the provider is notified. Unavailable dates and double bookings are refused with a clear explanation.
5. Provider accepts (`CONFIRMED`) or rejects (`REJECTED` with reason).
6. Farmer proceeds to the simulated payment page: payment summary shows gross amount, 5% HadaLink commission, and provider amount. The demo can simulate successful, failed, or pending payments.
7. Provider marks the job `IN_PROGRESS` (optional) and then `COMPLETED`.
8. A transaction record is created/guaranteed on completion.
9. The farmer leaves a review (only after completion, one per booking).
10. Provider and listing ratings update immediately. Admin sees the transaction in the admin dashboard.

### Provider loop

Create listings (CRUD is real) -> manage availability (booked/unavailable dates) -> receive requests -> accept or reject -> communicate with the farmer -> complete jobs -> view earnings and reviews -> submit verification documents.

### Admin loop

Verify providers (approve/reject with note) -> manage users (search, filter, edit, suspend, reactivate, delete with cascade cleanup) -> manage listings (search, filter, enable, disable, delete) -> monitor bookings and transactions (with commission) -> moderate reviews -> manage categories (CRUD) -> configure the commission rate -> reset demo data.

### Booking status rules

```
PENDING    -> CONFIRMED | REJECTED | CANCELLED
CONFIRMED  -> IN_PROGRESS | COMPLETED | CANCELLED
IN_PROGRESS-> COMPLETED | CANCELLED
REJECTED / CANCELLED / COMPLETED are terminal
```

Invalid transitions are refused with a clear message.

## How to reset demo data

Two options:

1. **In the app (recommended for demos):** Admin demo -> Settings -> "Reset demo data".
2. **Manually:** Clear the site's browser storage (or remove the `hadalink:db:v1` key). The app reseeds on the next load.

Resetting restores the original seeded database: demo users, listings, bookings, transactions, reviews, notifications, and messages.

## Simulated vs production functionality

| Feature | Prototype (this repo) | Production requirement |
| --- | --- | --- |
| Authentication | Simulated; credentials stored in localStorage | Real auth server, hashed passwords, sessions/tokens, server-side role enforcement |
| Authorization | Centralized role checks in services (`requireRole`) plus UI gating | Every check must be enforced server-side; treat local checks as UX only |
| Payments | Simulated outcomes (successful / failed / pending) | Payment gateway integration, webhooks, receipts, refunds |
| Verification | Document review workflow with admin decision | KYC/business verification process; never claim physical inspection unless implemented |
| Storage | localStorage via repository layer | REST API / server actions + real database |
| Notifications | Local records | Push/email/SMS channels backed by real events |
| Messaging | Local booking threads | Real-time or polled messaging service |
| Ratings | Computed from local reviews | Same rules, stored server-side with moderation tooling |

## Backend migration recommendations

1. Replace each repository (`userRepository`, `listingRepository`, `bookingRepository`, `transactionRepository`, `reviewRepository`, `notificationRepository`, ...) with an API-backed implementation of the same interface in `repositories/base.ts`.
2. Move service business rules (booking transitions, conflict prevention, commission calculation, review unlocking, cascade deletes) into server code (API routes, server actions, or a dedicated service layer) and keep the client thin.
3. Keep the `Result<T>` envelope and the existing type contracts in `types/models.ts` so UI changes stay minimal.
4. Enforce authentication and authorization on the server for every mutation; keep `requireRole` on the client for UX only.
5. Replace the simulated payment service with a gateway integration and map gateway states onto the existing `paymentStatus` model (PENDING / SUCCESSFUL / FAILED).
6. Keep the notification and message schemas; back them with real delivery channels.
7. Add pagination and server-side filtering to the search endpoints as data grows.

## Known prototype limitations

- Authentication and session handling are simulated and not secure by design. Never ship the local password storage to production.
- Payments are simulated. No real money moves and no payment provider is integrated.
- Provider verification reviews submitted text/documents only. There is no physical inspection of equipment.
- HadaLink does not own equipment, does not guarantee availability or prices, does not provide insurance, and does not offer automatic dispute resolution.
- Messaging is intentionally lightweight (booking-based threads), not a full chat product.
- Data lives in one browser. There is no multi-device sync or multi-user concurrency control beyond what localStorage provides.
- Dashboard analytics are computed live from local records (nothing is hard-coded) but are limited to the data in the current browser.
- The demo dataset covers selected Nigerian locations and is not evidence of a nationwide launch.

## Testing the flows

- `npm run lint` passes with zero warnings/errors.
- `npm run build` builds the full application (41 routes).
- `node scripts/smoke-test` (bundled with esbuild, see the header of `scripts/smoke-test.ts`) exercises the entire service layer: seeding, auth, search, booking conflicts, status transitions, simulated payments, commission math (₦100,000 -> ₦5,000 / ₦95,000), reviews and rating updates, availability rules, listing CRUD, verification workflow, admin moderation, category CRUD, analytics, persistence, and demo reset (84 assertions).
