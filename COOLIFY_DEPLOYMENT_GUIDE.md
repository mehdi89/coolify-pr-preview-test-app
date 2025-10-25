# Coolify Deployment Guide - PR Preview Setup

**Last Updated**: January 2025

This guide walks you through deploying the Coolify Test App with PR preview environments enabled.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Server with Ubuntu 22.04+ (2 CPU cores, 4GB RAM minimum)
- [ ] Domain name with DNS access (e.g., `preview.yourdomain.com`)
- [ ] GitHub account with admin access to your repository
- [ ] SSH access to your server

---

## Step 1: Install Coolify (15 minutes)

### 1.1 Connect to Your Server

```bash
ssh user@your-server-ip
```

### 1.2 Install Coolify

```bash
# Run the official installation script
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Wait for installation to complete (~10 minutes)
# You'll see: "Coolify is now installed and running!"
```

### 1.3 Access Coolify UI

```bash
# Open in browser:
http://your-server-ip:8000

# You'll see the Coolify welcome screen
```

### 1.4 Complete Initial Setup

1. **Create Admin Account**:
   - Email: your-email@example.com
   - Password: [secure password]
   - Click "Register"

2. **Configure Server**:
   - Server Name: "Coolify Test Server"
   - Click "Validate & Save"

3. **Skip Optional Steps**:
   - Click "Skip" on email configuration (optional)
   - Click "Skip" on teams (optional)

✅ **Checkpoint**: You should now see the Coolify dashboard

---

## Step 2: Configure DNS (10 minutes)

### 2.1 Create Wildcard DNS Record

In your DNS provider (Cloudflare, Route53, etc.):

```
Type: A
Name: *.preview
Content: [your-server-ip]
TTL: 60 (for fast updates)
Proxy: Disabled (important!)
```

**Example**:
- If your domain is `yourdomain.com`
- Set `*.preview.yourdomain.com` → `203.0.113.10`

### 2.2 Verify DNS

```bash
# Test DNS resolution
dig pr-test.preview.yourdomain.com

# Should show your server IP in the ANSWER section
```

✅ **Checkpoint**: DNS should resolve to your server IP

---

## Step 3: Connect GitHub Repository (10 minutes)

### 3.1 Create GitHub App

1. **In Coolify Dashboard**:
   - Click "Sources" in sidebar
   - Click "Add New Source"
   - Select "GitHub"

2. **Configure GitHub App**:
   - App Name: "Coolify Preview Environments"
   - Homepage URL: `http://your-server-ip:8000`
   - Callback URL: (auto-filled by Coolify)
   - Click "Create GitHub App"

3. **Install GitHub App**:
   - Select your account
   - Choose "Only select repositories"
   - Select `coolify-test-app` repository
   - Click "Install & Authorize"

### 3.2 Verify Connection

Back in Coolify:
- You should see "GitHub" source listed
- Status should show "Connected" (green)

✅ **Checkpoint**: GitHub source shows as connected

---

## Step 4: Create Project and Application (15 minutes)

### 4.1 Create New Project

1. **In Coolify Dashboard**:
   - Click "Projects" in sidebar
   - Click "+ New Project"
   - Name: "Coolify Test App"
   - Description: "Testing PR preview environments"
   - Click "Create"

### 4.2 Add Application

1. **Inside Project**:
   - Click "+ New Resource"
   - Select "Docker Compose"
   - Click "Continue"

2. **Configure Application**:
   - **Source**: Select your GitHub source
   - **Repository**: `your-username/coolify-test-app`
   - **Branch**: `main` (or your default branch)
   - **Build Pack**: Docker Compose
   - **Name**: `coolify-test-app-main`
   - Click "Continue"

3. **Docker Compose Settings**:
   - **Compose File**: `docker-compose.yml`
   - **Base Directory**: Leave empty (root)
   - Click "Save"

### 4.3 Configure Environment Variables

1. **In Application Settings**:
   - Click "Environment Variables" tab
   - Click "+ Add Variable"

2. **Add Required Variables**:

```bash
# Database
POSTGRES_USER=testuser
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=testdb

# Backend
DATABASE_URL=postgresql://testuser:your-secure-password-here@postgres:5432/testdb
JWT_SECRET_KEY=your-very-long-secret-key-min-32-characters-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
NEXT_PUBLIC_API_URL=http://pr-main.preview.yourdomain.com

# Environment
ENVIRONMENT=production
```

**Important**: Click "Save" after adding all variables

### 4.4 Configure Domain

1. **In Application Settings**:
   - Click "Domains" tab
   - Add domain: `pr-main.preview.yourdomain.com`
   - Click "Add"

✅ **Checkpoint**: Application configured with environment variables and domain

---

## Step 5: Deploy Main Application (20 minutes)

### 5.1 Start Deployment

1. **In Application View**:
   - Click "Deploy" button (top right)
   - Select "Force Rebuild"
   - Click "Deploy"

2. **Monitor Deployment**:
   - Watch logs in real-time
   - Look for "Deployment successful" message
   - **Expected time**: 10-15 minutes (first build)

### 5.2 Check Deployment Status

```bash
# SSH into server
ssh user@your-server-ip

# List containers
docker ps --filter "name=coolify-test"

# Should see 3 containers:
# - coolify-test-frontend
# - coolify-test-backend
# - coolify-test-postgres
```

### 5.3 Run Database Migrations

```bash
# Find backend container name
docker ps --filter "name=backend" --format "{{.Names}}"

# Run migrations
docker exec -it [backend-container-name] alembic upgrade head

# Expected output: "Running upgrade -> 20250125_0001"
```

### 5.4 Seed Test Data

```bash
# Seed database with test users and todos
docker exec -it [backend-container-name] python seed_data.py

# Expected output: "✅ Database seeded successfully!"
```

### 5.5 Test Application

1. **Open in Browser**:
   ```
   http://pr-main.preview.yourdomain.com
   ```

2. **Test Backend Health**:
   ```bash
   curl http://pr-main.preview.yourdomain.com/health

   # Expected: {"status":"healthy","database":"connected","message":"API is running"}
   ```

3. **Test Login**:
   - Click "Login" button
   - Email: `test@example.com`
   - Password: `password123`
   - Should redirect to todos page

✅ **Checkpoint**: Main application is running and accessible

---

## Step 6: Enable PR Preview Deployments (10 minutes)

**CRITICAL STEP** - This is what we're testing!

### 6.1 Configure Preview Deployments

1. **In Application Settings**:
   - Click "Preview Deployments" tab
   - Toggle "Enable Preview Deployments" → **ON**

2. **Configure Settings**:
   - **Maximum Previews**: `10`
   - **Auto-Deploy**: ✅ Enabled
   - **Auto-Delete on PR Close**: ✅ Enabled
   - **Domain Pattern**: `pr-{pr_number}.preview.yourdomain.com`
   - **Labels** (optional): Leave empty or add `preview-ready`
   - Click "Save"

### 6.2 Configure GitHub Webhook

Coolify should have auto-configured this, but verify:

1. **In GitHub Repository**:
   - Go to Settings → Webhooks
   - Should see webhook for Coolify
   - Recent Deliveries should show "200 OK"

2. **If Missing**:
   - Copy webhook URL from Coolify
   - Add manually in GitHub with these events:
     - Pull requests
     - Push
     - Pull request reviews

✅ **Checkpoint**: Preview deployments enabled

---

## Step 7: Test PR Preview (30 minutes)

**THE CRITICAL TEST** - Does Coolify actually work?

### 7.1 Create Test Branch

```bash
# In your local repository
cd coolify-test-app

# Create test branch
git checkout -b test-preview-1

# Make a visible change
echo "<!-- Test Preview 1 -->" >> frontend/src/app/page.tsx

# Commit and push
git add .
git commit -m "Test: First Coolify preview deployment"
git push origin test-preview-1
```

### 7.2 Open Pull Request

1. **On GitHub**:
   - Go to repository
   - Click "Compare & pull request"
   - Title: "[TEST] Coolify Preview Deployment #1"
   - Description: "Testing preview environment creation"
   - Base: `main` (or your default branch)
   - Click "Create pull request"

2. **Monitor Coolify**:
   - Go to Coolify dashboard
   - Click on your project
   - Should see new deployment starting: `coolify-test-app-pr-X`

### 7.3 Wait for Preview Deployment

**Expected Timeline**:
- Coolify detects PR: ~10 seconds
- Build starts: immediately
- Build completes: 10-15 minutes
- Preview ready: 15-20 minutes total

**Monitor in Coolify**:
- Watch deployment logs
- Look for "Deployment successful"
- Check if preview URL is generated

### 7.4 Verify Preview URL

1. **Check PR Comments**:
   - Coolify should post comment with preview URL
   - Format: `pr-X.preview.yourdomain.com`

2. **If No Comment**:
   - Check Coolify dashboard for preview URL
   - Manually construct: `http://pr-[number].preview.yourdomain.com`

### 7.5 Test Preview Functionality

```bash
# 1. Test backend health
curl http://pr-[number].preview.yourdomain.com/health

# 2. Open in browser
http://pr-[number].preview.yourdomain.com

# 3. Run migrations in preview
ssh user@your-server-ip
docker ps --filter "name=backend-pr"
docker exec -it [backend-pr-container] alembic upgrade head
docker exec -it [backend-pr-container] python seed_data.py

# 4. Test login
# Email: test@example.com
# Password: password123
```

### 7.6 **CRITICAL TEST**: Check Container Names

```bash
# SSH into server
ssh user@your-server-ip

# List all containers
docker ps --filter "name=coolify-test"

# CRITICAL QUESTION:
# Are container names:
#   - coolify-test-backend-pr123  (WITH pr number)
# OR
#   - coolify-test-backend  (WITHOUT pr number)

# If WITH pr number, test service communication:
docker exec -it [backend-container] ping postgres

# Does it resolve? Or fail with "unknown host"?
```

**THIS IS THE TEST WE CARE ABOUT FOR EPRLIVE24!**

### 7.7 Test Multiple Previews

```bash
# Create second test branch
git checkout main
git pull
git checkout -b test-preview-2

# Make different change
echo "<!-- Test Preview 2 -->" >> frontend/src/app/page.tsx

# Push and create PR
git add .
git commit -m "Test: Second concurrent preview"
git push origin test-preview-2

# Open second PR on GitHub
# Monitor Coolify for second preview deployment
```

**Verify**:
- Both previews running simultaneously?
- No container name conflicts?
- Both accessible at different URLs?

### 7.8 Test Preview Update

```bash
# Make change to test-preview-1 branch
git checkout test-preview-1

# Add change
echo "<!-- Updated -->" >> frontend/src/app/page.tsx

# Push update
git add .
git commit -m "Test: Preview update"
git push origin test-preview-1

# Check Coolify - should auto-rebuild preview
```

### 7.9 Test Preview Cleanup

```bash
# On GitHub: Close or merge PR #1

# Monitor Coolify:
# - Should detect PR close
# - Should stop preview deployment
# - Should remove containers

# Verify on server:
docker ps --filter "name=pr-1"
# Should show no containers
```

✅ **Checkpoint**: All preview tests completed

---

## Step 8: Document Results

### 8.1 Fill Out Test Results

Copy `COOLIFY_TEST_RESULTS.md.template` to `COOLIFY_TEST_RESULTS.md` and fill in all sections.

**Key Things to Document**:
1. Container names observed (WITH or WITHOUT pr number?)
2. Service communication results (ping test, API calls)
3. Authentication flow success/failure
4. Any workarounds applied
5. Final recommendation

### 8.2 Take Screenshots

Capture:
- Coolify dashboard showing multiple previews
- PR comments with preview URLs
- `docker ps` output showing container names
- Any error messages

---

## Common Issues and Solutions

### Issue 1: Build Fails

**Symptom**: Deployment fails during build

**Debug**:
```bash
# Check Coolify logs
# Look for specific error (missing dependency, syntax error, etc.)
```

**Common Fixes**:
- Environment variables not set correctly
- Docker Compose file syntax error
- Network issues pulling images

### Issue 2: Containers Start but Crash

**Symptom**: Containers start then immediately exit

**Debug**:
```bash
# Check container logs
docker logs [container-name]
```

**Common Fixes**:
- Database not ready (backend crashes waiting for postgres)
- Missing environment variables
- Port conflicts

### Issue 3: Service Communication Fails

**Symptom**: Backend can't reach database

**Debug**:
```bash
# Check if containers renamed
docker ps --filter "name=coolify-test"

# Test DNS resolution
docker exec -it [backend] ping postgres
```

**Fix**:
- If containers renamed, update DATABASE_URL to use actual container name
- Or use environment variable: `DB_HOST=postgres-pr-123`

### Issue 4: Preview Doesn't Create

**Symptom**: PR opened but no preview deployment

**Debug**:
1. Check GitHub webhook deliveries (Settings → Webhooks)
2. Check Coolify logs
3. Verify preview deployments enabled

**Fix**:
- Re-save preview deployment settings
- Manually trigger deployment from Coolify
- Check webhook secret matches

### Issue 5: Frontend Can't Reach Backend

**Symptom**: API calls fail with 404 or connection error

**Debug**:
```bash
# Check NEXT_PUBLIC_API_URL
docker logs [frontend-container] | grep API_URL
```

**Fix**:
- Update `NEXT_PUBLIC_API_URL` to use preview URL
- Ensure Coolify routing configured correctly

---

## Next Steps

### If Tests PASS ✅

1. Document all working configuration
2. Share results with CTO
3. Begin adapting EPRLive24 for Coolify
4. Keep this test project as reference

### If Tests FAIL ❌

1. Document all issues encountered
2. Evaluate severity of failures
3. Consider PullPreview alternative
4. Share findings with CTO

---

## Quick Reference

### Useful Commands

```bash
# List all Coolify containers
docker ps --filter "name=coolify-test"

# View logs
docker logs -f [container-name]

# Execute command in container
docker exec -it [container-name] [command]

# Run migrations
docker exec -it [backend-container] alembic upgrade head

# Seed data
docker exec -it [backend-container] python seed_data.py

# Restart container
docker restart [container-name]

# Remove all test containers (cleanup)
docker rm -f $(docker ps -a --filter "name=coolify-test" -q)
```

### Important URLs

- **Coolify Dashboard**: `http://your-server-ip:8000`
- **Main App**: `http://pr-main.preview.yourdomain.com`
- **Preview Pattern**: `http://pr-{number}.preview.yourdomain.com`
- **API Docs**: `http://pr-main.preview.yourdomain.com/docs`

---

## Support

If you encounter issues:

1. Check `README.md` for troubleshooting
2. Review `coolify-testing-plan.md` for detailed test procedures
3. Consult Coolify documentation: https://coolify.io/docs
4. Check Coolify Discord: https://discord.gg/coolify

---

**Good luck with testing!** Remember: this is about finding issues BEFORE committing EPRLive24 to Coolify.
