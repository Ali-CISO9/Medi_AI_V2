#!/usr/bin/env python3

import os
from database import get_db
from models import Patient, LabTest, MedicalReport

def list_all():
    print("Listing all patients and analyses...")

    try:
        db = next(get_db())

        # All patients
        patients = db.query(Patient).all()
        print(f"\n=== PATIENTS ({len(patients)}) ===")
        for patient in patients:
            print(f"ID: {patient.id}, Patient ID: {patient.patient_id}, Name: {patient.name}, Status: {patient.status}, Dept: {patient.department}, Doctor: {patient.doctor_name}")

        # All medical reports
        reports = db.query(MedicalReport).all()
        print(f"\n=== MEDICAL REPORTS ({len(reports)}) ===")
        for report in reports:
            print(f"ID: {report.id}, Patient ID: {report.patient_id}, Diagnosis: {report.diagnosis[:50]}..., Status: {report.status}, Risk: {report.risk_level}")

        print("\nDone!")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    list_all()