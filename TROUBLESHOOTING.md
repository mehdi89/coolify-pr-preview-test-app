# Coolify Deployment Troubleshooting

## Issue: "Port is already allocated" Error Persists

### Symptoms
```
Error: Bind for 0.0.0.0:8000 failed: port is already allocated
```

Even after commenting out `ports:` in docker-compose.yml and pushing changes.

### Root Cause
The Coolify server has old containers or services still using port 8000.

---

## Solution Steps

### Step 1: Access Your Coolify Server

SSH into your Coolify server:
```bash
ssh your-user@your-coolify-server
```

### Step 2: Check What's Using Port 8000

```bash
# Check if any containers are using port 8000
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 8000

# Or check all processes using port 8000
sudo lsof -i :8000
```

### Step 3: Stop Old Containers

If you see old containers from your app:

```bash
# List all containers with your app name
docker ps -a | grep "coolify-test\|backend-iokgsok\|frontend-iokgsok"

# Stop and remove them
docker rm -f $(docker ps -aq --filter "name=coolify-test")
docker rm -f $(docker ps -aq --filter "name=iokgsok")

# Clean up networks and volumes
docker network prune -f
docker volume prune -f
```

### Step 4: Force Rebuild in Coolify

In Coolify UI:
1. Go to your application
2. Click "Stop" to stop the current deployment
3. Wait for all containers to stop
4. Click "Deploy" → "Force Rebuild"
5. Enable "No Cache" option
6. Start deployment

### Step 5: Verify docker-compose.yml Has No Port Mappings

On Coolify server, check the deployed compose file:
```bash
# Find your app's deployment directory
cd /data/coolify/applications/

# Search for your docker-compose.yml
find . -name "docker-compose.yml" -exec grep -l "coolify-test" {} \;

# Check if ports are commented
cat path/to/docker-compose.yml | grep -A 2 "ports:"
```

---

## Alternative Solution: Use Container Names Without Port Mappings

If the issue persists, ensure your `docker-compose.yml` looks like this:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    # NO ports: section at all - completely removed
    expose:
      - "5432"
    networks:
      - app-network

  backend:
    build: ./backend
    # NO ports: section at all - completely removed
    expose:
      - "8000"
    networks:
      - app-network
    labels:
      - "coolify.domain=https://api.madeindhaka.com"  # Coolify routing label

  frontend:
    build: ./frontend
    # NO ports: section at all - completely removed
    expose:
      - "3000"
    networks:
      - app-network
    labels:
      - "coolify.domain=https://app.madeindhaka.com"  # Coolify routing label

networks:
  app-network:
    driver: bridge
```

---

## How Coolify Routing Works

```
Internet
    │
    ▼
Coolify Server (Traefik Reverse Proxy)
├── Port 80/443 (HTTPS)
│
├── https://api.madeindhaka.com
│   └─▶ backend container:8000 (internal)
│
└── https://app.madeindhaka.com
    └─▶ frontend container:3000 (internal)
```

**Key Points**:
- Coolify's Traefik listens on ports 80/443 externally
- Routes traffic to containers based on domain labels
- Containers communicate internally via Docker network
- **No need to expose ports to host (0.0.0.0)**

---

## Verification Checklist

After cleaning up and redeploying:

- [ ] No containers show port mappings: `docker ps` should show only internal ports
- [ ] Backend accessible via domain: `curl https://api.madeindhaka.com/health`
- [ ] Frontend accessible via domain: `curl https://app.madeindhaka.com`
- [ ] Containers can communicate: `docker exec backend ping postgres`
- [ ] No port conflicts in logs

---

## Still Not Working?

### Check Coolify Proxy Status

```bash
# Check if Coolify's proxy is running
docker ps | grep coolify-proxy

# Check proxy logs
docker logs coolify-proxy
```

### Check for Port Conflicts on Host

```bash
# See what's listening on ports 8000 and 3000
sudo netstat -tulpn | grep -E ':8000|:3000'
```

### Restart Coolify Services

```bash
# Restart Coolify completely
sudo systemctl restart coolify

# Or restart Docker
sudo systemctl restart docker
```

---

## For Preview Deployments

Preview deployments should work the same way:
- Each preview gets unique container names (e.g., `backend-pr-123`)
- Each preview gets unique subdomains (e.g., `pr-123.api.madeindhaka.com`)
- No port conflicts because containers don't bind to host ports

---

## Contact Support

If issues persist:
1. Check Coolify logs: `/data/coolify/logs/`
2. Join Coolify Discord: https://coollabs.io/discord
3. Report issue: https://github.com/coollabsio/coolify/issues
