#!/usr/bin/env python3
"""
Script to check APRI scores in existing database records.
"""

import sys
import os
import json

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from database import get_db, engine, Base
from models import MedicalReport, Patient
from sqlalchemy.orm import Session
from sqlalchemy import desc

def check_apri_scores():
    """Check APRI scores in existing database records."""

    print("=" * 70)
    print("Checking APRI Scores in Database")
    print("=" * 70)

    # Create database session
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(os.getenv('DATABASE_URL', 'sqlite:///medical_ai.db'))
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Get all medical reports
        reports = db.query(MedicalReport).order_by(desc(MedicalReport.created_at)).all()

        print(f"\nFound {len(reports)} analyses in database\n")

        issues_found = 0

        for report in reports:
            # Get patient info
            patient = db.query(Patient).filter(Patient.id == report.patient_id).first()

            # Check if detailed_results contains APRI score
            if report.detailed_results:
                try:
                    detailed = json.loads(report.detailed_results)

                    # Check hepatitis results for APRI
                    if 'hepatitis' in detailed:
                        hepatitis = detailed['hepatitis']
                        if 'apri_score' in hepatitis:
                            apri_score = hepatitis['apri_score']

                            # Check if APRI score is suspiciously high
                            if apri_score > 10:
                                issues_found += 1
                                print(f"[ISSUE #{issues_found}] Analysis ID: {report.id}")
                                print(f"  Patient: {patient.name if patient else 'Unknown'}")
                                print(f"  APRI Score: {apri_score} (SUSPICIOUSLY HIGH!)")
                                print(f"  Diagnosis: {report.diagnosis}")
                                print(f"  Created: {report.created_at}")
                                print(f"  Status: {report.status}")
                                print()

                            elif apri_score > 5:
                                issues_found += 1
                                print(f"[WARNING #{issues_found}] Analysis ID: {report.id}")
                                print(f"  Patient: {patient.name if patient else 'Unknown'}")
                                print(f"  APRI Score: {apri_score} (Potentially incorrect)")
                                print(f"  Diagnosis: {report.diagnosis}")
                                print()

                except json.JSONDecodeError:
                    print(f"[ERROR] Could not parse detailed_results for Analysis ID: {report.id}")
                    print()

        if issues_found == 0:
            print("[OK] No suspicious APRI scores found in database.")
            print("All APRI scores appear to be in valid range (< 10).")
        else:
            print(f"\n[SUMMARY] Found {issues_found} analyses with potentially incorrect APRI scores.")
            print("\nTo fix these issues, you have two options:")
            print("\nOption 1: Re-run analysis for affected patients")
            print("  - This will create new analyses with correct APRI scores")
            print("  - Old analyses can be archived or deleted")
            print("\nOption 2: Manually update detailed_results in database")
            print("  - Requires recalculating APRI scores from original lab values")
            print("  - More complex, but preserves existing analysis records")

    except Exception as e:
        print(f"Error checking database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_apri_scores()
