#!/bin/bash

# Local Testing Script for Coolify Test App
# Run this before pushing to GitHub to ensure everything works

set -e  # Exit on error

echo "🧪 Coolify Test App - Local Validation"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Testing: $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "Step 1: Checking Prerequisites"
echo "--------------------------------"
run_test "Docker installed" "docker --version"
run_test "Docker Compose installed" "docker compose version"
run_test ".env.example exists" "[ -f .env.example ]"
run_test "docker-compose.yml exists" "[ -f docker-compose.yml ]"
echo ""

echo "Step 2: Copying Environment File"
echo "---------------------------------"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example${NC}"
else
    echo -e "${YELLOW}ℹ .env already exists${NC}"
fi
echo ""

echo "Step 3: Starting Services"
echo "-------------------------"
echo "Starting Docker Compose services..."
docker compose up -d

echo "Waiting for services to be healthy (60 seconds)..."
sleep 60
echo ""

echo "Step 4: Checking Service Health"
echo "--------------------------------"
run_test "PostgreSQL is running" "docker compose ps postgres | grep -q 'Up'"
run_test "Backend is running" "docker compose ps backend | grep -q 'Up'"
run_test "Frontend is running" "docker compose ps frontend | grep -q 'Up'"
echo ""

echo "Step 5: Running Database Migrations"
echo "------------------------------------"
echo "Running Alembic migrations..."
docker compose exec -T backend alembic upgrade head
run_test "Migrations completed" "[ $? -eq 0 ]"
echo ""

echo "Step 6: Seeding Test Data"
echo "-------------------------"
echo "Seeding database with test users and todos..."
docker compose exec -T backend python seed_data.py
run_test "Seed data created" "[ $? -eq 0 ]"
echo ""

echo "Step 7: Testing API Endpoints"
echo "------------------------------"
run_test "Backend health check" "curl -sf http://localhost:8000/health"
run_test "API test endpoint" "curl -sf http://localhost:8000/api/test"
run_test "Frontend is accessible" "curl -sf http://localhost:3000"
echo ""

echo "Step 8: Testing Authentication"
echo "-------------------------------"
# Test registration
echo -n "Testing user registration... "
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"testuser@test.com","username":"testuser","password":"test123"}')

if echo "$REGISTER_RESPONSE" | grep -q '"id"'; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⊙ SKIP (user may already exist)${NC}"
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test login
echo -n "Testing user login... "
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"access_token"'; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    # Use jq for reliable token extraction if available, otherwise fallback to grep
    if command -v jq &> /dev/null; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
    else
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    fi
else
    echo -e "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TOKEN=""
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

echo "Step 9: Testing Todo Endpoints"
echo "-------------------------------"
if [ -n "$TOKEN" ]; then
    # Test creating todo
    echo -n "Testing create todo... "
    TODO_RESPONSE=$(curl -s -X POST http://localhost:8000/api/todos/ \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"title":"Test Todo","description":"Testing API","completed":false}')

    if echo "$TODO_RESPONSE" | grep -q '"id"'; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))

    # Test getting todos
    echo -n "Testing get todos... "
    TODOS_RESPONSE=$(curl -s -X GET http://localhost:8000/api/todos/ \
        -H "Authorization: Bearer $TOKEN")

    if echo "$TODOS_RESPONSE" | grep -q '\['; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
else
    echo -e "${YELLOW}⊙ SKIPPED (no auth token)${NC}"
fi
echo ""

echo "Step 10: Testing Service Communication"
echo "---------------------------------------"
echo -n "Testing backend → database connection... "
DB_TEST=$(docker compose exec -T backend python -c "from app.database import engine; engine.connect(); print('OK')" 2>&1)
if echo "$DB_TEST" | grep -q "OK"; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Summary
echo "========================================"
echo "Test Results Summary"
echo "========================================"
echo "Total tests run: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
else
    echo -e "Failed: 0"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Ready to deploy to Coolify.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push code to GitHub: git push origin main"
    echo "2. Follow COOLIFY_DEPLOYMENT_GUIDE.md to deploy"
    echo "3. Test PR preview functionality"
    echo ""
    echo "Test credentials:"
    echo "  - test@example.com / password123"
    echo "  - admin@example.com / admin123"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Fix issues before deploying.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Wait longer for services to start (increase sleep time)"
    echo "- Check docker compose logs: docker compose logs"
    echo "- Ensure ports 3000, 8000, 5432 are not in use"
    exit 1
fi
