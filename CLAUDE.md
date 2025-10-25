# Coolify Test App - Project Guidelines

## Project Purpose

This is a **test project** created specifically to validate Coolify's preview environment functionality before deploying the production EPRLive24 application. It replicates EPRLive24's multi-service architecture in a simplified stack to identify potential issues early.

**DO NOT use this for production**. This is a testing and evaluation tool only.

---

## Why This Project Exists

### Context
EPRLive24 (the main project) needs PR preview environments for faster code reviews and better quality assurance. Coolify was identified as a potential platform, but it has known issues with:
- Docker Compose multi-service setups
- Container renaming breaking service communication
- Complex authentication flows (OAuth/OpenIddict)

### Solution
Before committing EPRLive24 (.NET 9, React, SQL Server, OAuth) to Coolify, we created this simplified test project to:
1. **Test Coolify's preview deployment functionality** with a similar architecture
2. **Identify container naming issues** that could break service-to-service communication
3. **Validate authentication flows** similar to EPRLive24's OAuth
4. **Test database isolation** for PR-specific environments
5. **Document workarounds** for any issues discovered

---

## Architecture

This project mirrors EPRLive24's structure with simpler technologies:

| EPRLive24 (Production) | Coolify Test App (This Project) |
|------------------------|----------------------------------|
| .NET 9 Backend | **FastAPI** (Python) |
| ASP.NET Core Identity + OpenIddict | **JWT Authentication** |
| React + Vite + Relay | **Next.js** (React) |
| SQL Server 2022 | **PostgreSQL 16** |
| Traefik Reverse Proxy | Built-in Coolify routing |
| Multi-service Docker Compose | **Same** (3 services + database) |

### Services

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│   FastAPI    │────▶│  PostgreSQL  │
│   Frontend   │     │   Backend    │     │   Database   │
│  (port 3000) │     │  (port 8000) │     │  (port 5432) │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Critical Dependencies**:
1. Frontend → Backend (API calls)
2. Backend → Database (SQL queries)
3. Backend → Backend (health checks, internal communication)

**If Coolify renames containers**, these dependencies break (e.g., `postgres` becomes `postgres-pr-123`).

---

## What to Test

### Primary Tests
1. **Service Communication**
   - Can frontend reach backend via service name?
   - Can backend reach database via service name?
   - Do health checks work after container renaming?

2. **Authentication Flow**
   - Does JWT token validation work across services?
   - Similar to EPRLive24's OAuth/OpenIddict flow
   - Tests service-to-service communication for auth

3. **Preview Deployments**
   - Do preview environments create automatically on PR open?
   - Do they update on PR push?
   - Do they clean up on PR close?

4. **Database Isolation**
   - Can multiple PRs run simultaneously with separate databases?
   - Do migrations run correctly in isolated environments?

5. **Container Naming**
   - Does Coolify rename containers (e.g., `backend` → `backend-pr-123`)?
   - If yes, do connection strings still work?
   - This is the **CRITICAL** test for EPRLive24

---

## Key Files and Their Purpose

### Backend (FastAPI)
- `backend/app/main.py` - API entry point with health check endpoint
- `backend/app/auth.py` - JWT authentication (similar to EPRLive24's OAuth)
- `backend/app/routers/auth.py` - Login/register endpoints
- `backend/app/routers/todos.py` - CRUD endpoints for todos
- `backend/app/models.py` - SQLAlchemy models (User, Todo)
- `backend/alembic/` - Database migrations (similar to EF Core migrations)
- `backend/seed_data.py` - Dummy data for testing

### Frontend (Next.js)
- `frontend/src/app/page.tsx` - Landing page with backend status check
- `frontend/src/app/login/page.tsx` - Login form
- `frontend/src/app/register/page.tsx` - Registration form
- `frontend/src/app/todos/page.tsx` - Todo management (requires auth)
- `frontend/src/lib/api.ts` - API client with JWT token handling

### Infrastructure
- `docker-compose.yml` - Multi-service orchestration
- `backend/Dockerfile` - Python backend container
- `frontend/Dockerfile` - Next.js production build
- `.env.example` - Environment variables template

---

## Development Workflow

### Local Development

```bash
# 1. Start all services
docker compose up -d

# 2. Run migrations
docker compose exec backend alembic upgrade head

# 3. Seed test data
docker compose exec backend python seed_data.py

# 4. Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Testing Coolify

See `README.md` for detailed Coolify setup and testing instructions.

**Critical Tests**:
1. Create PR → Verify preview deployment created
2. Check container names → `docker ps` in Coolify server
3. Test authentication → Login should work in preview
4. Create todo → Database connection should work
5. Close PR → Verify preview cleaned up

---

## Expected Issues and Workarounds

### Issue 1: Container Renaming

**Symptom**: Backend can't connect to database
```
Error: could not translate host name "postgres" to address
```

**Cause**: Coolify renamed `postgres` to `postgres-pr-123`

**Workaround**:
```yaml
# Use environment variable for database host
environment:
  - DATABASE_URL=postgresql://user:pass@${DB_HOST:-postgres}:5432/testdb
```

### Issue 2: Frontend Can't Reach Backend

**Symptom**: API calls fail with "Service not found"

**Workaround**: Use external URL instead of internal service name
```typescript
// frontend/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL; // External URL via Coolify
// NOT: http://backend:8000 (internal service name)
```

### Issue 3: Migrations Don't Run

**Symptom**: `relation 'users' does not exist`

**Workaround**: Run migrations manually
```bash
docker compose exec backend alembic upgrade head
```

---

## Success Criteria

### ✅ Coolify Works If:
1. Preview deployments create automatically on PR open
2. All services start and communicate correctly
3. Authentication flow works (login/register)
4. Todo CRUD operations work
5. Multiple PRs can run simultaneously
6. Preview cleanup works on PR close

### ❌ Coolify FAILS If:
1. Container renaming breaks service communication
2. Authentication doesn't work
3. Database not initialized
4. Multiple PRs conflict
5. Previews don't create or clean up

---

## Reporting Results

After testing, create `COOLIFY_TEST_RESULTS.md` with:
1. All tests performed and results
2. Issues encountered and workarounds applied
3. Container naming observations (critical!)
4. Final recommendation: Adopt / Conditional / Reject Coolify

Template:
```markdown
# Coolify Test Results

**Test Date**: [Date]
**Coolify Version**: [Version]

## Tests Performed
- [ ] Preview deployment created
- [ ] Container names checked
- [ ] Service communication tested
- [ ] Authentication tested
- [ ] Multiple PRs tested

## Issues Found
1. [Issue description]
   - Workaround: [Solution]

## Recommendation
[Adopt / Conditional / Reject] Coolify for EPRLive24

**Reasoning**: [Why]
```

---

## Next Steps

1. **If Coolify Works**: Adapt EPRLive24's docker-compose.yml using lessons learned
2. **If Coolify Fails**: Evaluate PullPreview as alternative
3. **Report to CTO**: Share findings and recommendation

---

## Code Quality Guidelines

This is a **test project**, so standards are relaxed compared to production:

✅ **Acceptable**:
- Minimal error handling
- No comprehensive testing
- Simplified authentication (JWT instead of OAuth)
- Basic UI without polish
- Hardcoded test credentials

❌ **Not Acceptable**:
- Security vulnerabilities that could affect test results
- Missing functionality that prevents testing critical paths
- Unclear documentation that makes testing difficult

---

## Related Documentation

- **Main Coolify Testing Plan**: `../coolify-testing-plan.md`
- **Coolify Evaluation**: `../coolify-evaluation-summary.md`
- **EPRLive24 Requirements**: `../issue-feature-pr-preview-environments.md`
- **Platform Research**: `../pr-preview-platforms-research.md`

---

## Maintenance

This project should be:
- **Updated** if Coolify testing reveals needed changes
- **Deleted** after EPRLive24 successfully deploys to chosen platform
- **Preserved** if used as template for future platform evaluations

**Not for production use**. This is a testing tool only.

---

## Questions?

See `README.md` for setup instructions and testing procedures.
