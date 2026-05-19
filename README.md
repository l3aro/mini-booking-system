# Co-working Space Booking System

Mini booking management system for co-working spaces. Users view room availability and create bookings. Admins manage rooms and all bookings.

## Tech Stack

| Service | Technology |
|---------|------------|
| Backend API | Laravel 13, Sanctum (PHP 8.5 FPM) |
| Frontend | Next.js 16, TypeScript, Tailwind CSS (Node 24, React 19) |
| Database | PostgreSQL 18 |
| Cache / Session | Redis 8 |
| Reverse Proxy | nginx (alpine) |

## Prerequisites

- Docker Engine 28+
- Docker Compose v2.36+

## Quick Start

```bash
# 1. Configure environment
cp backend/.env.example backend/.env

# 2. Generate app key
docker compose run --rm php php artisan key:generate

# 3. Start all services
docker compose up -d --build

# 4. Run migrations and seed data
docker compose exec php php artisan migrate:fresh --seed
```

Access the application at **http://localhost:8080**.

## Architecture

Single-origin via nginx reverse proxy. All traffic flows through `localhost:8080`:

```
Browser → localhost:8080
  ├── /api/* → nginx → FastCGI → php:9000 (Laravel)
  └── /*     → nginx → proxy_pass → nextjs:3000 (Next.js)
```

No CORS needed. Same origin for frontend and API.

## URLs

| Service | Internal | External |
|---------|----------|----------|
| Application | - | http://localhost:8080 |
| API | http://nginx/api | http://localhost:8080/api |
| PostgreSQL | postgres:5432 | localhost:5432 |
| Redis | redis:6379 | localhost:6379 |

## Auth Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cowork.com | password |
| User | john@example.com | password |
| User | jane@example.com | password |

## Setup Commands

```bash
# Run migrations (fresh)
docker compose exec php php artisan migrate:fresh

# Seed sample data
docker compose exec php php artisan db:seed

# Run both
docker compose exec php php artisan migrate:fresh --seed

# Open artisan tinker
docker compose exec php php artisan tinker
```

## Testing

**Backend (Pest):**
```bash
docker compose exec php php artisan test
docker compose exec php php artisan test --filter=overlapping_booking_rejected
```

**Frontend (Vitest):**
```bash
cd frontend && npm run test
# or inside container:
docker compose exec nextjs npm run test
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/register | None | Register new user |
| POST | /api/login | None | Login, receive token |
| POST | /api/logout | Bearer | Revoke token |
| GET | /api/user | Bearer | Get current user |
| GET | /api/rooms | None | List all rooms |
| GET | /api/rooms/{id} | None | Get room details |
| POST | /api/rooms | Admin | Create room |
| PUT | /api/rooms/{id} | Admin | Update room |
| DELETE | /api/rooms/{id} | Admin | Delete room |
| GET | /api/rooms/{id}/bookings | None | Room bookings (?date=YYYY-MM-DD) |
| GET | /api/rooms/{id}/availability | None | Available slots (?date=YYYY-MM-DD) |
| POST | /api/bookings | Bearer | Create booking |
| GET | /api/bookings | Bearer | List bookings (?filter=mine) |
| DELETE | /api/bookings/{id} | Bearer | Delete booking (admin or owner) |

### Request Examples

**Login:**
```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cowork.com","password":"password"}'
```

**Create booking (use token from login):**
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"room_id":1,"start_time":"2026-05-20T09:00:00Z","end_time":"2026-05-20T10:00:00Z"}'
```

**Check availability:**
```bash
curl "http://localhost:8080/api/rooms/1/availability?date=2026-05-20"
```

## Project Structure

```
├── docker-compose.yml        # Docker services (nginx, php, postgres, redis, nextjs)
├── nginx/
│   └── default.conf          # nginx reverse proxy config
├── backend/                  # Laravel 13 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/  # Auth, Room, Booking controllers
│   │   │   ├── Requests/     # Form request validation
│   │   │   └── Resources/    # API resource transformers
│   │   ├── Models/           # Room, Booking, User
│   │   ├── Repositories/     # BookingRepository
│   │   └── Services/         # BookingService (overlap logic)
│   ├── config/               # App configuration
│   ├── database/
│   │   ├── migrations/       # Database schema
│   │   └── seeders/          # Sample data
│   ├── routes/
│   │   └── api.php           # API route definitions
│   └── tests/                # Pest feature tests
├── frontend/                 # Next.js 16 app
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   ├── contexts/         # Auth, Room contexts
│   │   └── lib/              # API client (Axios)
│   └── package.json
└── backend/.env.example      # Environment variable documentation
```
