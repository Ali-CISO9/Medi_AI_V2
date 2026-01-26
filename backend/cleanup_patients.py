#!/usr/bin/env python3

from database import get_db
from models import Patient, MedicalReport, LabTest

def cleanup_patients():
    try:
        db = next(get_db())

        print("Current patients:")
        patients = db.query(Patient).all()
        for p in patients:
            print(f"  DB ID: {p.id}, Patient ID: {p.patient_id}, Name: {p.name}")

        print("\nCurrent medical reports:")
        reports = db.query(MedicalReport).all()
        for r in reports:
            print(f"  Report ID: {r.id}, Patient ID: {r.patient_id}, Diagnosis: {r.diagnosis}")

        print("\nCurrent lab tests:")
        lab_tests = db.query(LabTest).all()
        for lt in lab_tests:
            print(f"  Lab Test ID: {lt.id}, Patient ID: {lt.patient_id}, Test: {lt.test_name}")

        print("\nDeleting ALL patients and their associated data...")
        patients_to_delete = db.query(Patient).all()

        deleted_count = 0
        for patient in patients_to_delete:
            print(f"Deleting: {patient.name} (Patient ID: {patient.patient_id}, DB ID: {patient.id})")

            # The cascade delete should handle associated reports and lab tests
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

        print("\nRemaining lab tests:")
        lab_tests = db.query(LabTest).all()
        for lt in lab_tests:
            print(f"  Lab Test ID: {lt.id}, Patient ID: {lt.patient_id}, Test: {lt.test_name}")

    except Exception as e:
        print(f"Error during cleanup: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    cleanup_patients()