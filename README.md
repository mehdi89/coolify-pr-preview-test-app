# Coolify Test App - EPRLive24 Architecture Test

**Purpose**: Test Coolify preview environments with a simplified architecture matching EPRLive24

**Stack**:
- **Backend**: Python FastAPI (similar to EPRLive24's .NET backend)
- **Frontend**: Next.js (similar to EPRLive24's React UI)
- **Database**: PostgreSQL (similar to EPRLive24's SQL Server)
- **Features**: Authentication + Todo Management

---

## 🏗️ Architecture

This project replicates EPRLive24's multi-service architecture:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Next.js   │────▶│   FastAPI   │────▶│  PostgreSQL  │
│   Frontend  │     │   Backend   │     │   Database   │
│   (port 3000)│    │  (port 8000)│     │  (port 5432) │
└─────────────┘     └─────────────┘     └──────────────┘
```

**Critical Test Cases**:
1. ✅ Service-to-service communication (Frontend → Backend, Backend → Database)
2. ✅ Authentication flow (login/registration with JWT tokens)
3. ✅ Container naming in Coolify (does `backend` → `backend-pr-123` break connections?)
4. ✅ Multiple preview deployments (can 2 PRs run simultaneously?)
5. ✅ Database migrations (does schema migration work in preview?)

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/your-username/coolify-test-app.git
cd coolify-test-app

# 2. Copy environment file
cp .env.example .env

# 3. Start all services with Docker Compose
docker compose up -d

# 4. Wait for services to be healthy (~30 seconds)
docker compose ps

# 5. Run database migrations
docker compose exec backend alembic upgrade head

# 6. Seed dummy data
docker compose exec backend python seed_data.py

# 7. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Test Accounts

After seeding data, you can log in with:

```
Email: test@example.com
Password: password123

Email: admin@example.com
Password: admin123
```

---

## 🧪 Testing Coolify Preview Environments

### Setup in Coolify

1. **Install Coolify** on your server:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```

2. **Create New Project** in Coolify UI:
   - Go to Projects → New Project
   - Name: "Coolify Test App"
   - Add Resource → Docker Compose

3. **Connect GitHub Repository**:
   - Repository: your-username/coolify-test-app
   - Branch: main
   - Docker Compose file: docker-compose.yml

4. **Set Environment Variables** in Coolify:
   ```
   POSTGRES_USER=testuser
   POSTGRES_PASSWORD=testpass123
   POSTGRES_DB=testdb
   DATABASE_URL=postgresql://testuser:testpass123@postgres:5432/testdb
   JWT_SECRET_KEY=your-secret-key-change-in-production
   NEXT_PUBLIC_API_URL=http://your-domain.com
   ```

5. **Enable Preview Deployments**:
   - Go to Settings → Preview Deployments
   - Toggle "Enable" → ON
   - Set max previews: 10

### Testing Workflow

1. **Create Test Branch**:
   ```bash
   git checkout -b test-preview-1
   echo "# Test change" >> frontend/src/app/page.tsx
   git commit -am "Test: Preview deployment"
   git push origin test-preview-1
   ```

2. **Open Pull Request**:
   - Open PR on GitHub
   - Coolify should automatically detect and deploy preview
   - Check for preview URL comment on PR

3. **Test Preview Environment**:
   ```bash
   # Access preview URL (e.g., pr-123.preview.yourdomain.com)

   # Test backend health
   curl http://pr-123.preview.yourdomain.com/health

   # Test frontend
   curl http://pr-123.preview.yourdomain.com/

   # Test authentication (critical!)
   curl -X POST http://pr-123.preview.yourdomain.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123"}'
   ```

4. **Test Service Communication** (Critical Test!):
   ```bash
   # Exec into backend container
   docker exec -it <backend-container-name> bash

   # Test if backend can reach database
   ping postgres  # Should resolve

   # Test database connection
   python -c "from app.database import engine; print(engine.connect())"
   ```

5. **Test Multiple PRs**:
   - Create second test branch and PR
   - Verify both previews run simultaneously
   - Check for container naming conflicts

6. **Test Cleanup**:
   - Close/merge PR
   - Verify Coolify removes preview environment
   - Check containers and database are deleted

---

## 📁 Project Structure

```
coolify-test-app/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── main.py       # FastAPI app entry point
│   │   ├── database.py   # Database connection
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── auth.py       # JWT authentication
│   │   └── routers/      # API routes
│   ├── alembic/          # Database migrations
│   ├── requirements.txt  # Python dependencies
│   ├── Dockerfile        # Backend Docker image
│   └── seed_data.py      # Dummy data seeding
├── frontend/             # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app directory
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities
│   ├── package.json      # Node dependencies
│   └── Dockerfile        # Frontend Docker image
├── docker-compose.yml    # Multi-service orchestration
├── .env.example          # Environment variables template
└── README.md             # This file
```

---

## 🔍 What This Tests

### 1. Service-to-Service Communication
- Frontend calls Backend API (tests HTTP communication)
- Backend calls PostgreSQL (tests database connection)
- **Coolify Issue**: Container renaming may break `postgres` hostname

### 2. Authentication Flow
- Login/Registration with JWT tokens
- Protected routes requiring authentication
- **Similar to EPRLive24**: OAuth/OpenIddict flow
- **Coolify Issue**: If backend container renamed, frontend can't find it

### 3. Database Migrations
- Alembic migrations run on container startup
- **Tests**: Schema changes in preview environments
- **Coolify Issue**: Database initialization in isolated previews

### 4. Environment Variables
- Different configs for dev/preview/production
- **Tests**: PR-specific environment variable injection
- **Coolify Issue**: Environment variable substitution

---

## 🚨 Known Issues to Watch For

### Issue 1: Container Renaming Breaks Service Names

**Symptom**:
```bash
# Frontend can't reach backend
curl http://localhost:3000/api/todos
# Error: "Backend service not found"

# Backend can't reach database
docker logs backend
# Error: "could not translate host name 'postgres' to address"
```

**Diagnosis**:
```bash
# Check actual container names
docker ps --filter "name=coolify-test"

# If Coolify renamed them:
# postgres → postgres-pr-123
# backend → backend-pr-123
# frontend → frontend-pr-123
```

**Workaround**:
- Update `docker-compose.yml` to use explicit `container_name`
- Use environment variables for service hostnames

### Issue 2: Database Not Initialized

**Symptom**:
```bash
# Backend fails to start
docker logs backend
# Error: "relation 'users' does not exist"
```

**Diagnosis**:
- Migrations didn't run
- Database volume not created

**Workaround**:
- Run migrations manually: `docker compose exec backend alembic upgrade head`

### Issue 3: Frontend Can't Reach Backend

**Symptom**:
- Login button doesn't work
- Console errors: "Failed to fetch"

**Diagnosis**:
```bash
# Check NEXT_PUBLIC_API_URL
docker logs frontend | grep API_URL

# Should be: http://backend:8000
# NOT: http://localhost:8000
```

**Workaround**:
- Update `NEXT_PUBLIC_API_URL` environment variable

---

## 📊 Success Criteria

### ✅ Coolify Preview Environments Work If:

1. **Preview created automatically** when PR opened
2. **All services start successfully** (frontend, backend, database)
3. **Service communication works** (frontend → backend → database)
4. **Authentication flow works** (login/registration)
5. **Todo CRUD operations work** (create, read, update, delete)
6. **Multiple PRs run simultaneously** without conflicts
7. **Preview cleaned up automatically** when PR closed

### ❌ Coolify DOES NOT Work If:

1. **Containers fail to start** (build errors, health check failures)
2. **Service names don't resolve** (backend can't find `postgres`)
3. **Authentication broken** (frontend can't reach backend)
4. **Database not initialized** (migrations don't run)
5. **Multiple PRs conflict** (port conflicts, name collisions)
6. **Previews not cleaned up** (orphaned containers/databases)

---

## 🛠️ Development

### Adding New Features

**Backend (FastAPI)**:
```bash
# Add new endpoint
# Edit: backend/app/routers/todos.py

# Create migration
docker compose exec backend alembic revision --autogenerate -m "Add new field"
docker compose exec backend alembic upgrade head
```

**Frontend (Next.js)**:
```bash
# Install new package
cd frontend
npm install <package-name>

# Create new component
# Add to: frontend/src/components/
```

### Running Tests

```bash
# Backend tests
docker compose exec backend pytest

# Frontend tests
docker compose exec frontend npm test

# Integration tests
docker compose exec backend python -m pytest tests/integration/
```

---

## 📚 API Documentation

Once running, access interactive API docs:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

**Authentication**:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

**Todos**:
- `GET /api/todos` - List all todos (requires auth)
- `POST /api/todos` - Create todo (requires auth)
- `PUT /api/todos/{id}` - Update todo (requires auth)
- `DELETE /api/todos/{id}` - Delete todo (requires auth)

**Health**:
- `GET /health` - Health check endpoint

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check logs
docker compose logs backend

# Common issues:
# 1. Database not ready → Wait 30 seconds and restart
# 2. Migrations failed → Run manually: docker compose exec backend alembic upgrade head
# 3. Port conflict → Check if port 8000 is in use
```

### Frontend won't connect to backend

```bash
# Check environment variables
docker compose exec frontend env | grep API_URL

# Should be: NEXT_PUBLIC_API_URL=http://backend:8000
# NOT: http://localhost:8000 (won't work in Docker)
```

### Database connection failed

```bash
# Check if postgres is running
docker compose ps postgres

# Test connection
docker compose exec backend python -c "from app.database import engine; engine.connect()"

# Check connection string
docker compose exec backend env | grep DATABASE_URL
```

---

## 🔗 Related Documentation

- **Coolify Testing Plan**: ../coolify-testing-plan.md
- **Coolify Evaluation**: ../coolify-evaluation-summary.md
- **EPRLive24 Requirements**: ../issue-feature-pr-preview-environments.md

---

## 📝 Notes

This is a **test project** to validate Coolify before deploying EPRLive24. It intentionally replicates EPRLive24's architecture:

| EPRLive24 | Coolify Test App |
|-----------|------------------|
| .NET Backend | FastAPI Backend |
| React UI | Next.js UI |
| SQL Server | PostgreSQL |
| ASP.NET Identity + OAuth | FastAPI + JWT |
| GraphQL | REST API |
| Traefik | Built-in Coolify routing |

**Test Results**: Document your findings in `COOLIFY_TEST_RESULTS.md` after testing.

---

## 🚀 Next Steps After Testing

1. **If tests PASS**: Adapt EPRLive24 for Coolify using lessons learned
2. **If tests FAIL**: Document issues and evaluate PullPreview as alternative
3. **Report to CTO**: Share findings and recommendation

---

**Questions?** Check `coolify-testing-plan.md` for detailed testing procedures.
