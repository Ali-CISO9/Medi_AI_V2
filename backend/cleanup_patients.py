#!/usr/bin/env python3

from database import get_db
from models import Patient, MedicalReport

def cleanup_patients():
    try:
        db = next(get_db())

        print("Current patients:")
        patients = db.query(Patient).all()
        for p in patients:
            print(f"  DB ID: {p.id}, Patient ID: {p.patient_id}, Name: {p.name}")

        print("\nDeleting patients except ID 11...")
        patients_to_delete = db.query(Patient).filter(Patient.patient_id != '11').all()

        deleted_count = 0
        for patient in patients_to_delete:
            print(f"Deleting: {patient.name} (Patient ID: {patient.patient_id})")

            # Delete associated reports first
            reports = db.query(MedicalReport).filter(MedicalReport.patient_id == patient.id).all()
            for report in reports:
                print(f"  Deleting associated report ID {report.id}")
                db.delete(report)

            db.delete(patient)
            deleted_count += 1

        db.commit()
        print(f"\nSuccessfully deleted {deleted_count} patients")

        print("\nRemaining patients:")
        remaining = db.query(Patient).all()
        for p in remaining:
            print(f"  DB ID: {p.id}, Patient ID: {p.patient_id}, Name: {p.name}")

        print("\nRemaining reports:")
        reports = db.query(MedicalReport).all()
        for r in reports:
            print(f"  Report ID: {r.id}, Patient ID: {r.patient_id}, Diagnosis: {r.diagnosis}")

    except Exception as e:
        print(f"Error during cleanup: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    cleanup_patients()