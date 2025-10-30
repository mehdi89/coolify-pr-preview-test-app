# Coolify Setup Guide

## Quick Configuration Reference

### Environment Variables to Set in Coolify

Go to your Coolify project → Environment Variables and add these:

```bash
# Database Configuration
POSTGRES_USER=testuser
POSTGRES_PASSWORD=testpass123  # Change in production!
POSTGRES_DB=testdb
DATABASE_URL=postgresql://testuser:testpass123@postgres:5432/testdb

# Backend Configuration
JWT_SECRET_KEY=super-secret-key-change-in-production-min-32-chars  # Generate new: openssl rand -hex 32
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend Configuration - CRITICAL!
NEXT_PUBLIC_API_URL=https://api.madeindhaka.com

# Environment
ENVIRONMENT=production
```

### Service Routing in Coolify

Configure these in Coolify's service settings:

1. **Frontend** (port 3000):
   - Main service/entrypoint
   - Public URL: https://yourdomain.com

2. **Backend** (port 8000):
   - Exposed via subdomain
   - Public URL: https://api.madeindhaka.com

3. **Database** (port 5432):
   - Internal only (not exposed publicly)

---

## Changes Made for Coolify Compatibility

### ✅ Fixed: Port Conflicts

**Problem**: `docker-compose.yml` exposed ports to host, causing "port already allocated" errors.

**Solution**: Changed from `ports:` to `expose:`:

```yaml
# ❌ Before (breaks in Coolify)
ports:
  - "8000:8000"

# ✅ After (works in Coolify)
# ports:
#   - "8000:8000"  # Uncomment for local dev
expose:
  - "8000"  # Internal communication only
```

### ✅ Configured: API URL

**Problem**: Frontend needs to know backend's public URL.

**Solution**: Set `NEXT_PUBLIC_API_URL=https://api.madeindhaka.com` in Coolify environment variables.

---

## Deployment Checklist

### Initial Deployment

- [ ] Push changes to GitHub (port fixes + API URL config)
- [ ] Set all environment variables in Coolify UI
- [ ] Configure service routing (frontend + backend)
- [ ] Deploy and verify all containers start
- [ ] Test backend health: `curl https://api.madeindhaka.com/health`
- [ ] Test frontend loads: `curl https://yourdomain.com`
- [ ] Run migrations: `docker exec -it <backend-container> alembic upgrade head`
- [ ] Seed test data: `docker exec -it <backend-container> python seed_data.py`
- [ ] Test login/registration flow
- [ ] Test todo CRUD operations

### Preview Deployments (Critical Test!)

- [ ] Enable preview deployments in Coolify settings
- [ ] Create test branch and PR
- [ ] Verify preview deployment creates automatically
- [ ] Check container names: `docker ps` (look for renaming)
- [ ] Test service communication in preview
- [ ] Test authentication in preview
- [ ] Create second PR, verify both run simultaneously
- [ ] Close PR, verify cleanup

---

## Troubleshooting

### If deployment still fails with port errors:

1. Check `docker-compose.yml` has NO uncommented `ports:` sections
2. Verify you pushed the latest changes to GitHub
3. Trigger a rebuild in Coolify

### If frontend can't reach backend:

1. Verify `NEXT_PUBLIC_API_URL=https://api.madeindhaka.com` in Coolify env vars
2. Check backend is exposed at https://api.madeindhaka.com
3. Test backend directly: `curl https://api.madeindhaka.com/health`
4. Check CORS settings in backend (should allow frontend domain)

### If backend can't reach database:

1. Service name `postgres` should work for internal communication
2. If Coolify renames containers, you may need to update `DATABASE_URL`
3. Check container names: `docker ps --filter "name=postgres"`

### If migrations don't run:

Run manually:
```bash
docker exec -it <backend-container-name> alembic upgrade head
```

---

## Next Steps After Successful Deployment

1. **Document Container Naming**: Check if Coolify renames containers (e.g., `postgres-pr-123`)
2. **Test Preview Deployments**: This is the critical test for EPRLive24!
3. **Record Results**: Update `COOLIFY_TEST_RESULTS.md` with findings
4. **Make Recommendation**: Adopt/Conditional/Reject Coolify for EPRLive24

---

## References

- Main documentation: `README.md`
- Project guidelines: `CLAUDE.md`
- Coolify environment template: `.env.coolify`
