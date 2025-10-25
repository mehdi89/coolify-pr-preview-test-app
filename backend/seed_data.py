"""Seed database with dummy data for testing"""
from app.database import SessionLocal
from app.models import User, Todo
from app.auth import get_password_hash


def seed_data():
    """Seed the database with test users and todos"""
    db = SessionLocal()

    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Database already has {existing_users} users. Skipping seed.")
            return

        print("Seeding database with test data...")

        # Create test users
        users_data = [
            {
                "email": "test@example.com",
                "username": "testuser",
                "password": "password123"
            },
            {
                "email": "admin@example.com",
                "username": "admin",
                "password": "admin123"
            },
            {
                "email": "john@example.com",
                "username": "johndoe",
                "password": "john123"
            }
        ]

        users = []
        for user_data in users_data:
            user = User(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=get_password_hash(user_data["password"]),
                is_active=True
            )
            db.add(user)
            users.append(user)
            print(f"Created user: {user.email}")

        db.commit()

        # Refresh users to get IDs
        for user in users:
            db.refresh(user)

        # Create todos for each user
        todos_data = [
            # Test user todos
            {"title": "Complete Coolify testing", "description": "Test preview environments with this app", "completed": False, "user_idx": 0},
            {"title": "Review PR preview docs", "description": "Check documentation for accuracy", "completed": True, "user_idx": 0},
            {"title": "Test authentication flow", "description": "Ensure login/register works in preview", "completed": False, "user_idx": 0},

            # Admin user todos
            {"title": "Configure Coolify settings", "description": "Set max preview deployments to 10", "completed": False, "user_idx": 1},
            {"title": "Setup DNS records", "description": "Create wildcard A record for *.preview.domain.com", "completed": True, "user_idx": 1},
            {"title": "Monitor server resources", "description": "Check CPU/RAM usage with multiple previews", "completed": False, "user_idx": 1},

            # John's todos
            {"title": "Buy groceries", "description": "Milk, eggs, bread, coffee", "completed": False, "user_idx": 2},
            {"title": "Finish project report", "description": "Due by end of week", "completed": False, "user_idx": 2},
            {"title": "Call dentist", "description": "Schedule cleaning appointment", "completed": True, "user_idx": 2},
        ]

        for todo_data in todos_data:
            todo = Todo(
                title=todo_data["title"],
                description=todo_data["description"],
                completed=todo_data["completed"],
                owner_id=users[todo_data["user_idx"]].id
            )
            db.add(todo)
            print(f"Created todo: {todo.title} for {users[todo_data['user_idx']].username}")

        db.commit()

        print("\n✅ Database seeded successfully!")
        print("\nTest accounts:")
        print("  - test@example.com / password123")
        print("  - admin@example.com / admin123")
        print("  - john@example.com / john123")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
