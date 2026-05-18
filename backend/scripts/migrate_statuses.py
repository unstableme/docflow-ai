import sys
import os

# Add the project root to sys.path to allow imports from 'app'
sys.path.append(os.getcwd())

from app.db.connection import SessionLocal
from app.db.tables import Document

def migrate():
    db = SessionLocal()
    try:
        # Find all documents
        docs = db.query(Document).all()
        updated_count = 0
        
        mapping = {
            "Processing": "processing",
            "Completed": "processed",
            "Failed": "error"
        }
        
        for doc in docs:
            if doc.status in mapping:
                old_status = doc.status
                doc.status = mapping[old_status]
                print(f"Updating Doc {doc.id}: {old_status} -> {doc.status}")
                updated_count += 1
        
        db.commit()
        print(f"Successfully migrated {updated_count} documents.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
