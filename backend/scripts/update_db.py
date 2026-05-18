import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv, find_dotenv

def migrate():
    load_dotenv(find_dotenv())
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found")
        return

    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking for source_type column...")
        # Check if column exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='documents' AND column_name='source_type';
        """)
        result = conn.execute(check_query).fetchone()
        
        if not result:
            print("Adding source_type column to documents table...")
            conn.execute(text("ALTER TABLE documents ADD COLUMN source_type VARCHAR DEFAULT 'upload' NOT NULL;"))
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column source_type already exists.")

if __name__ == "__main__":
    migrate()
