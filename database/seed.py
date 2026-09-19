"""
Standalone Database Seeder for WhatsAI
Can be run via: python -m database.seed
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database import SessionLocal, Base, engine
from app.main import seed_initial_data

def run_seed():
    print("Creating database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding database data...")
        seed_initial_data(db)
        print("Database seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
