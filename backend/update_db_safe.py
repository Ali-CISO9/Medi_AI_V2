from sqlalchemy import text
from database import engine

def add_detailed_results_column():
    try:
        with engine.connect() as conn:
            # Check if column already exists to avoid errors
            result = conn.execute(text("PRAGMA table_info(medical_reports)"))
            columns = [row[1] for row in result.fetchall()]
            if 'detailed_results' in columns:
                print("Column 'detailed_results' already exists.")
                return

            # Add the new column
            conn.execute(text("ALTER TABLE medical_reports ADD COLUMN detailed_results TEXT"))
            conn.commit()
            print("Successfully added 'detailed_results' column to medical_reports table.")
    except Exception as e:
        print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_detailed_results_column()