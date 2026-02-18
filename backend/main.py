from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Optional, List, Union, Any, Dict
import json
import requests
from datetime import datetime
import numpy as np

# Load environment variables
load_dotenv()

from diagnosis_engine import DiagnosisEngine
from database import get_db, engine, Base
from models import Patient, LabTest, MedicalReport, User, AuditLog, ALL_PERMISSIONS, DEFAULT_PERMISSIONS, DOCTOR_PRESET_PERMISSIONS
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    set_auth_cookies, clear_auth_cookies,
    get_current_user, require_permission,
    log_audit, verify_csrf,
)

def make_serializable(obj):
    """Recursively convert NumPy types to Python native types for JSON."""
    if isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_serializable(i) for i in obj]
    elif hasattr(obj, 'dtype') and hasattr(obj, 'item'):
        # NumPy scalar (works for all NumPy versions)
        return obj.item()
    elif isinstance(obj, (int, float, bool)):
        return obj
    elif hasattr(obj, 'tolist'):
        # NumPy array
        return make_serializable(obj.tolist())
    return obj


def _is_admin(user: User) -> bool:
    """Check if a user has admin-level access (bypasses doctor scoping)."""
    return user.role == "admin" or user.has_permission("can_access_admin")


# Initialize DiagnosisEngine
diagnosis_engine = DiagnosisEngine()

print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
print("Backend server starting with updated analysis saving functionality...")

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Medical AI Backend", version="1.0.0")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"VALIDATION ERROR DETAILS: {exc.errors()}") # Prints exact failure to console
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class LabValues(BaseModel):
    ALT: Optional[float] = None
    AST: Optional[float] = None
    Bilirubin: Optional[float] = None
    GGT: Optional[float] = None


class PatientData(BaseModel):
    id: str
    name: str
    age: int
    gender: str

class LabTestResponse(BaseModel):
    testName: str
    value: float
    unit: str
    normalRange: str
    status: str
    date: str

class Visit(BaseModel):
    date: str
    type: str
    doctor: str

class PatientResponse(BaseModel):
    success: bool
    patient: PatientData
    labTests: List[LabTestResponse]
    recentVisits: List[Visit]

class SaveReportRequest(BaseModel):
    patient_id: Any
    diagnosis: Any
    confidence: Any
    advice: Any
    risk_level: Any
    detailed_results: Any

# Initialize Hugging Face API
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")

@app.get("/")
async def root():
    return {"message": "Medical AI Backend API", "status": "running"}

@app.post("/analyze")
async def analyze_patient(user_profile: dict, db: Session = Depends(get_db), current_user: User = require_permission("can_run_analysis")):
    try:
        print(f"DEBUG: Received Profile: {user_profile}")

        # Get analysis mode, default to 'full' for backward compatibility
        mode = user_profile.get('mode', 'full')

        # Extract the actual profile data (nested under 'user_profile' if present)
        profile = user_profile.get('user_profile', user_profile)

        # 1. Run Logic based on mode
        if mode == 'gate':
            raw_result = diagnosis_engine.predict_gate_only(profile)
        elif mode == 'cancer':
            raw_result = diagnosis_engine.predict_cancer_only(profile)
        elif mode == 'fatty_liver':
            raw_result = diagnosis_engine.predict_fatty_liver_only(profile)
        elif mode == 'hepatitis':
            raw_result = diagnosis_engine.predict_hepatitis_only(profile)
        else:
            # Default to 'full' for backward compatibility
            raw_result = diagnosis_engine.predict_full_diagnosis(profile)

        # 2. Sanitize for JSON (The Fix)
        clean_result = make_serializable(raw_result)

        # 3. Handle individual model results vs full diagnosis results
        if 'analysis_type' in clean_result:
            # Individual model result (cancer, fatty_liver, hepatitis)
            analysis_type = clean_result['analysis_type']
            model_results = clean_result['results']

            # Extract diagnosis info from the specific model result
            if analysis_type == 'cancer':
                diagnosis = f"Cancer Risk: {model_results['cancer']['risk_level']}"
                confidence = int(model_results['cancer']['risk_percentage'])
                advice = model_results['cancer']['advice']
                risk_level = 'high' if model_results['cancer']['risk_percentage'] > 70 else 'moderate'
            elif analysis_type == 'fatty_liver':
                diagnosis = model_results['fatty_liver']['diagnosis']
                confidence = model_results['fatty_liver']['sick_probability']
                advice = model_results['fatty_liver']['advice']
                risk_level = 'high' if model_results['fatty_liver']['has_fatty_liver'] else 'low'
            elif analysis_type == 'hepatitis':
                diagnosis = f"Hepatitis Stage {model_results['hepatitis']['stage']}"
                confidence = int(model_results['hepatitis']['mortality_risk'])
                advice = model_results['hepatitis']['advice']
                risk_level = model_results['hepatitis']['risk_level']

            detailed_results = model_results
            gate_prediction = 0  # Not applicable for individual models
        else:
            # Full diagnosis or gate result
            diagnosis = clean_result['diagnosis']
            confidence = clean_result['confidence']
            advice = clean_result['advice']
            risk_level = clean_result['risk_level']
            detailed_results = clean_result.get('detailed_results', {})
            gate_prediction = clean_result.get('detailed_results', {}).get('gate', {}).get('prediction', 0)

        # 4. Save to database if patient_id provided (only for full/gate results)
        patient_id_in_data = user_profile.get('patient_id')
        if patient_id_in_data and 'analysis_type' not in clean_result:
            try:
                # Find the patient by database ID (not patient_id string)
                patient = db.query(Patient).filter(Patient.id == patient_id_in_data).first()
                if patient:
                    # Map risk level from DiagnosisEngine to database format
                    risk_level_map = {'low': 'low', 'moderate': 'medium', 'high': 'high'}
                    db_risk_level = risk_level_map.get(risk_level, 'medium')

                    # Save the analysis to database
                    medical_report = MedicalReport(
                        patient_id=patient.id,
                        doctor_id=current_user.id,
                        diagnosis=diagnosis,
                        confidence=confidence,
                        advice=advice,
                        risk_level=db_risk_level
                    )
                    db.add(medical_report)
                    db.commit()
                    db.refresh(medical_report)
                    print(f"Saved analysis for patient {patient.name} (ID: {patient.id}) - Risk: {db_risk_level}")

                    # ─────────────────────────────────────────────────────
                    # NEW: Save Lab Parameters
                    # ─────────────────────────────────────────────────────
                    try:
                        # Define keys to exclude (demographics, mode, etc.)
                        exclude_keys = {'mode', 'user_profile', 'patient_id', 'age', 'gender', 'name', 'department', 'doctor_id'}
                        
                        # Iterate through input profile data
                        for key, value in profile.items():
                            if key not in exclude_keys and value is not None:
                                # Determine status based on value (simplified logic)
                                # In a real app, you'd compare against specific ranges for each test
                                status = "normal" 
                                normal_range = "N/A"
                                unit = "N/A"

                                # Create LabTest record
                                lab_test = LabTest(
                                    patient_id=patient.id,
                                    test_name=key.replace('_', ' ').title(),
                                    value=float(value) if isinstance(value, (int, float, str)) and str(value).replace('.','',1).isdigit() else 0.0,
                                    unit=unit,
                                    normal_range=normal_range,
                                    status=status,
                                    date=func.now()
                                )
                                db.add(lab_test)
                        
                        db.commit()
                        print(f"Saved lab tests for patient {patient.name}")
                    except Exception as lab_error:
                        print(f"Error saving lab tests: {lab_error}")
                        db.rollback() # Rollback only the lab test part if it fails, though report is already committed
                else:
                    print(f"Patient with ID {patient_id_in_data} not found, analysis not saved")
            except Exception as save_error:
                print(f"Error saving analysis: {save_error}")
                # Don't fail the analysis if saving fails, just log it

        # 5. Return sanitized result
        return {
            "success": True,
            "gate_prediction": gate_prediction,
            "results": detailed_results,
            "diagnosis": diagnosis,
            "confidence": confidence,
            "advice": advice,
            "risk_level": risk_level,
            # Legacy fields for backward compatibility
            "analysis": {
                "diagnosis": diagnosis,
                "confidence": confidence,
                "advice": advice,
                "overallAssessment": f"Risk Level: {risk_level.title()}",
                "recommendations": [advice],
                "detailedAnalyses": detailed_results,
                "scanType": "AI-Powered Multi-Stage Liver Disease Analysis",
                "findings": [
                    {
                        "region": "Liver",
                        "condition": diagnosis,
                        "confidence": confidence / 100.0,
                        "description": advice
                    }
                ],
                "timestamp": datetime.now().isoformat(),
            }
        }

    except Exception as e:
        error_message = str(e)
        # Sanitize error message to remove emojis and problematic characters
        import re
        clean_error = re.sub(r'[^\x00-\x7F]+', '', error_message)  # Remove non-ASCII characters
        print(f"CRITICAL BACKEND CRASH:\n{clean_error}")
        # Return a 400 so the Frontend sees the actual error message
        raise HTTPException(status_code=400, detail=error_message)

@app.post("/reports")
async def create_report(report: SaveReportRequest, db: Session = Depends(get_db), current_user: User = require_permission("can_run_analysis")):
    try:
        print(f"DEBUG: Received Report Payload: {report}")
        # Check if patient exists
        patient_id = report.patient_id
        if not patient_id:
            raise HTTPException(status_code=400, detail="Patient ID required")
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Sanitize the inputs to remove NumPy types
        clean_results = make_serializable(report.detailed_results)

        print("DEBUG: Attempting to add to DB session...")
        # Create new report
        new_report = MedicalReport(
            patient_id=patient_id,
            doctor_id=current_user.id,
            diagnosis=report.diagnosis,
            confidence=float(report.confidence),  # Explicit cast to float
            advice=report.advice,
            risk_level=report.risk_level,
            detailed_results=json.dumps(clean_results)  # Save the SANITIZED version
        )
        db.add(new_report)
        print("DEBUG: Committing to Database...")
        try:
            db.commit()
        except Exception as e:
            print(f"DB ERROR: {str(e)}")
            raise
        db.refresh(new_report)

        return {"success": True, "report_id": new_report.id}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR SAVING REPORT: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Database error")


@app.get("/patient-data")
async def get_patient_data(db: Session = Depends(get_db), current_user: User = require_permission("can_view_patients")):
    try:
        print(f"DATABASE_URL in endpoint: {os.getenv('DATABASE_URL')}")
        # Get the first patient scoped to this doctor
        query = db.query(Patient)
        if not _is_admin(current_user):
            query = query.filter(Patient.doctor_id == current_user.id)
        patient = query.first()
        print(f"Patient found: {patient}")
        print(f"Patient name: {patient.name if patient else 'None'}")
        print(f"Patient ID: {patient.id if patient else 'None'}")

        if not patient:
            # Return mock data if no patients in database
            return {
                "success": True,
                "patient": {
                    "id": "P-2024-001",
                    "name": "John Smith",
                    "age": 45,
                    "gender": "Male",
                },
                "labTests": [
                    {
                        "testName": "Blood Glucose",
                        "value": 95,
                        "unit": "mg/dL",
                        "normalRange": "70-100",
                        "status": "normal",
                        "date": "2024-01-15",
                    },
                    {
                        "testName": "Cholesterol",
                        "value": 185,
                        "unit": "mg/dL",
                        "normalRange": "< 200",
                        "status": "normal",
                        "date": "2024-01-15",
                    },
                ],
                "recentVisits": [
                    {
                        "date": "2024-01-15",
                        "type": "Routine Checkup",
                        "doctor": "Dr. Sarah Ahmed",
                    },
                ],
            }

        # Get lab tests for the patient
        lab_tests = db.query(LabTest).filter(LabTest.patient_id == patient.id).order_by(desc(LabTest.date)).limit(10).all()

        # Convert to response format
        lab_tests_response = [
            {
                "testName": test.test_name,
                "value": test.value,
                "unit": test.unit,
                "normalRange": test.normal_range,
                "status": test.status,
                "date": test.date.isoformat() if test.date else None,
            }
            for test in lab_tests
        ]

        return {
            "success": True,
            "patient": {
                "id": patient.patient_id,
                "name": patient.name,
                "birth_date": patient.birth_date,
            },
            "labTests": lab_tests_response,
            "recentVisits": [
                {
                    "date": "2024-01-15",  # This would come from a visits table in a real implementation
                    "type": "Routine Checkup",
                    "doctor": "Dr. Sarah Ahmed",
                },
            ],
        }
    except Exception as e:
        print(f"Database error in get_patient_data: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/lab-tests")
async def get_lab_tests(patientId: str, db: Session = Depends(get_db), current_user: User = require_permission("can_view_patients")):
    try:
        # Find patient by patient ID
        patient = db.query(Patient).filter(Patient.patient_id == patientId).first()

        if not patient:
            return {"success": False, "message": "Patient not found"}

        # Get lab tests for the patient
        lab_tests = db.query(LabTest).filter(LabTest.patient_id == patient.id).order_by(desc(LabTest.date)).all()

        # Convert to response format
        lab_tests_response = [
            {
                "testName": test.test_name,
                "value": test.value,
                "unit": test.unit,
                "normalRange": test.normal_range,
                "status": test.status,
                "date": test.date.isoformat() if test.date else None,
            }
            for test in lab_tests
        ]

        return {
            "success": True,
            "labTests": lab_tests_response,
        }
    except Exception as e:
        print(f"Database error in get_lab_tests: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/patients")
async def get_patients(request: Request, db: Session = Depends(get_db), current_user: User = require_permission("can_view_patients")):
    try:
        # Parse query parameters manually
        query_params = dict(request.query_params)
        status = query_params.get('status', 'active')

        # Filter patients by status (default to active)
        query = db.query(Patient)
        if status != "all":
            query = query.filter(Patient.status == status)

        # Doctor scoping: non-admin users only see their own patients
        if not _is_admin(current_user):
            query = query.filter(Patient.doctor_id == current_user.id)

        patients = query.order_by(desc(Patient.created_at)).all()

        patients_response = [
            {
                "id": patient.id,
                "name": patient.name,
                "patient_id": patient.patient_id,
                "birth_date": patient.birth_date,
                "email": patient.email,
                "phone": patient.phone,
                "profile_picture": patient.profile_picture,
                "department": patient.department,
                "doctor_name": patient.doctor_name,
                "status": patient.status,
                "created_at": patient.created_at.isoformat() if patient.created_at else None,
                "updated_at": patient.updated_at.isoformat() if patient.updated_at else None,
            }
            for patient in patients
        ]

        return {
            "success": True,
            "patients": patients_response,
        }
    except Exception as e:
        print(f"Database error in get_patients: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.put("/patients/{patient_id}/archive")
async def archive_patient(patient_id: str, db: Session = Depends(get_db), current_user: User = require_permission("can_edit_patients")):
    try:
        # Find the patient by database ID (integer)
        patient_id_int = int(patient_id)
        patient = db.query(Patient).filter(Patient.id == patient_id_int).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Ownership check
        if not _is_admin(current_user) and patient.doctor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your patient")

        if patient.status == "archived":
            raise HTTPException(status_code=400, detail="Patient is already archived")

        # Archive the patient and analyses
        patient.status = "archived"
        analyses_to_archive = db.query(MedicalReport).filter(MedicalReport.patient_id == patient.id).all()
        for analysis in analyses_to_archive:
            analysis.status = "archived"

        db.commit()

        return {"success": True, "message": f"Patient and {len(analyses_to_archive)} analyses archived successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in archive_patient: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.put("/patients/{patient_id}/restore")
async def restore_patient(patient_id: str, db: Session = Depends(get_db), current_user: User = require_permission("can_edit_patients")):
    try:
        # Find the patient by database ID (integer)
        patient_id_int = int(patient_id)
        patient = db.query(Patient).filter(Patient.id == patient_id_int).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Ownership check
        if not _is_admin(current_user) and patient.doctor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your patient")

        if patient.status == "active":
            raise HTTPException(status_code=400, detail="Patient is already active")

        # Restore the patient and analyses
        patient.status = "active"
        analyses_to_restore = db.query(MedicalReport).filter(
            MedicalReport.patient_id == patient.id,
            MedicalReport.status == "archived"
        ).all()
        for analysis in analyses_to_restore:
            analysis.status = "active"

        db.commit()

        return {"success": True, "message": f"Patient and {len(analyses_to_restore)} analyses restored successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in restore_patient: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.put("/patients/{patient_id}")
async def update_patient(patient_id: str, patient_data: dict = None, db: Session = Depends(get_db), current_user: User = require_permission("can_edit_patients")):
    try:
        # Find patient by database ID (integer)
        patient_id_int = int(patient_id)
        patient = db.query(Patient).filter(Patient.id == patient_id_int).first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Ownership check
        if not _is_admin(current_user) and patient.doctor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your patient")

        # Update patient fields
        if "name" in patient_data:
            patient.name = patient_data["name"]
        if "patient_id" in patient_data:
            patient.patient_id = patient_data["patient_id"]
        if "birth_date" in patient_data:
            patient.birth_date = patient_data["birth_date"]
        if "email" in patient_data:
            patient.email = patient_data["email"]
        if "phone" in patient_data:
            patient.phone = patient_data["phone"]
        if "profile_picture" in patient_data:
            patient.profile_picture = patient_data["profile_picture"]
        if "department" in patient_data:
            patient.department = patient_data["department"]
        if "doctor_name" in patient_data:
            patient.doctor_name = patient_data["doctor_name"]

        db.commit()
        db.refresh(patient)

        return {"success": True, "patient": {
            "id": patient.id,
            "name": patient.name,
            "patient_id": patient.patient_id,
            "birth_date": patient.birth_date,
            "email": patient.email,
            "phone": patient.phone,
            "profile_picture": patient.profile_picture,
            "department": patient.department,
            "doctor_name": patient.doctor_name,
            "status": patient.status
        }, "message": "Patient updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in update_patient: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str, db: Session = Depends(get_db), current_user: User = require_permission("can_delete_patients")):
    try:
        # Find the patient by database ID (integer)
        patient_id_int = int(patient_id)
        patient = db.query(Patient).filter(Patient.id == patient_id_int).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Ownership check
        if not _is_admin(current_user) and patient.doctor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your patient")

        if patient.status == "active":
            raise HTTPException(status_code=400, detail="Cannot delete active patient. Archive first.")

        # Permanently delete the patient and analyses
        # CASCADE DELETE: Remove reports first
        db.query(MedicalReport).filter(MedicalReport.patient_id == patient.id).delete()
        # NOW delete the patient
        db.delete(patient)

        db.commit()

        return {"success": True, "message": "Patient and all associated analyses permanently deleted"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in delete_patient: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.post("/patients")
async def create_or_update_patient(patient_data: dict, db: Session = Depends(get_db), current_user: User = require_permission("can_create_patients")):
    try:
        patient_id = patient_data.get("patient_id")
        name = patient_data.get("name")
        birth_date_str = patient_data.get("birth_date")

        if not patient_id or not name:
            raise HTTPException(status_code=400, detail="Patient ID and name are required")

        # Check if patient already exists
        existing_patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

        if existing_patient:
            # Return error for duplicate patient ID
            raise HTTPException(status_code=400, detail="ID is Currently used")

        # birth_date is now stored as string
        birth_date = birth_date_str if birth_date_str else None

        # Create new patient (auto-assign to creating doctor)
        new_patient = Patient(
            name=name,
            birth_date=birth_date,
            patient_id=patient_id,
            doctor_id=current_user.id,
            email=patient_data.get("email"),
            phone=patient_data.get("phone"),
            profile_picture=patient_data.get("profile_picture"),
            department=patient_data.get("department"),
            doctor_name=patient_data.get("doctor_name")
        )

        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)

        return {"success": True, "patient": {
            "id": new_patient.id,
            "name": new_patient.name,
            "patient_id": new_patient.patient_id,
            "birth_date": new_patient.birth_date,
            "email": new_patient.email,
            "phone": new_patient.phone,
            "profile_picture": new_patient.profile_picture,
            "department": new_patient.department,
            "doctor_name": new_patient.doctor_name
        }}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in create_or_update_patient: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/patient-analyses")
async def get_patient_analyses(request: Request, db: Session = Depends(get_db), current_user: User = require_permission("can_view_reports")):
    try:
        # Parse query parameters manually
        query_params = dict(request.query_params)
        include_archived = query_params.get('include_archived', 'false').lower() == 'true'
        patient_id_filter = query_params.get('patient_id')

        # Get medical reports - filter out archived by default unless specifically requested
        query = db.query(MedicalReport)
        if not include_archived:
            query = query.filter(MedicalReport.status != "archived")

        # Doctor scoping: non-admin users only see analyses for their own patients
        if not _is_admin(current_user):
            doctor_patient_ids = [
                p.id for p in db.query(Patient.id).filter(Patient.doctor_id == current_user.id).all()
            ]
            query = query.filter(MedicalReport.patient_id.in_(doctor_patient_ids))

        # Filter by patient_id if provided (matches patient.patient_id string field)
        if patient_id_filter:
            # Find patient by patient_id string
            patient = db.query(Patient).filter(Patient.patient_id == patient_id_filter).first()
            if patient:
                query = query.filter(MedicalReport.patient_id == patient.id)

        analyses = query.order_by(desc(MedicalReport.created_at)).all()

        print(f"Found {len(analyses)} analyses (include_archived={include_archived})")

        # Convert to response format
        analyses_response = []
        for analysis in analyses:
            # Explicitly fetch the patient
            patient = db.query(Patient).filter(Patient.id == analysis.patient_id).first()

            print(f"Analysis {analysis.id}: patient_id={analysis.patient_id}, patient_found={patient is not None}")
            if patient:
                print(f"  Patient: {patient.name}, dept={patient.department}, doctor={patient.doctor_name}")

            # Calculate risk level if not set
            risk_level = analysis.risk_level
            if not risk_level:
                if analysis.confidence >= 80:
                    risk_level = "low"
                elif analysis.confidence >= 60:
                    risk_level = "medium"
                else:
                    risk_level = "high"

            # Look up doctor full name from User table
            doctor_display_name = patient.doctor_name if patient else None
            if patient and patient.doctor_id:
                doctor_user = db.query(User).filter(User.id == patient.doctor_id).first()
                if doctor_user and doctor_user.full_name:
                    doctor_display_name = doctor_user.full_name

            patient_data = {
                "id": analysis.id,
                "patient_id": analysis.patient_id,
                "diagnosis": analysis.diagnosis,
                "confidence": analysis.confidence,
                "advice": analysis.advice,
                "status": analysis.status,
                "is_finalized": bool(analysis.is_finalized),
                "risk_level": risk_level,
                "detailed_results": analysis.detailed_results,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
                "updated_at": analysis.updated_at.isoformat() if analysis.updated_at else analysis.created_at.isoformat() if analysis.created_at else None,
                "patient_name": patient.name if patient else "Unknown",
                "patient_id_display": patient.patient_id if patient else "Unknown",
                "birth_date": patient.birth_date if patient else None,
                "email": patient.email if patient else None,
                "phone": patient.phone if patient else None,
                "profile_picture": patient.profile_picture if patient else None,
                "department": patient.department if patient else None,
                "doctor_name": doctor_display_name,
            }
            analyses_response.append(patient_data)

        return {
            "success": True,
            "analyses": analyses_response,
        }
    except Exception as e:
        print(f"Database error in get_patient_analyses: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.put("/patient-analyses/{analysis_id}")
async def update_patient_analysis(analysis_id: int, analysis_data: dict, db: Session = Depends(get_db), current_user: User = require_permission("can_edit_patients")):
    try:
        analysis = db.query(MedicalReport).filter(MedicalReport.id == analysis_id).first()

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        # Update fields
        if "diagnosis" in analysis_data:
            analysis.diagnosis = analysis_data["diagnosis"]
        if "confidence" in analysis_data:
            analysis.confidence = analysis_data["confidence"]
        if "advice" in analysis_data:
            analysis.advice = analysis_data["advice"]
        if "patient_id" in analysis_data:
            # Verify that the patient exists
            patient = db.query(Patient).filter(Patient.id == analysis_data["patient_id"]).first()
            if not patient:
                raise HTTPException(status_code=400, detail="Patient not found")
            analysis.patient_id = analysis_data["patient_id"]

        db.commit()
        db.refresh(analysis)

        return {"success": True, "analysis": {
            "id": analysis.id,
            "patient_id": analysis.patient_id,
            "diagnosis": analysis.diagnosis,
            "confidence": analysis.confidence,
            "advice": analysis.advice
        }}

    except Exception as e:
        print(f"Database error in update_patient_analysis: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.delete("/patient-analyses/{analysis_id}")
async def delete_patient_analysis(analysis_id: int, db: Session = Depends(get_db), current_user: User = require_permission("can_delete_patients")):
    try:
        analysis = db.query(MedicalReport).filter(MedicalReport.id == analysis_id).first()

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        db.delete(analysis)
        db.commit()

        return {"success": True, "message": "Analysis deleted successfully"}

    except Exception as e:
        print(f"Database error in delete_patient_analysis: {e}")
        raise HTTPException(status_code=500, detail="Database error")

# ═══════════════════════════════════════════════════════════
# AUTH ROUTES
# ═══════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "user"
    permissions: Optional[Dict[str, bool]] = None


@app.post("/auth/login")
async def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate user, set JWT cookies, return user info + permissions."""
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Create tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Update last_login
    user.last_login = datetime.utcnow()
    db.commit()

    # Audit log
    client_ip = request.client.host if request.client else None
    log_audit(db, user.id, "LOGIN", ip_address=client_ip)

    # Build response with cookies
    response = JSONResponse(content={
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "fullName": user.full_name or user.username,
            "role": user.role,
            "permissions": user.get_permissions(),
        },
    })
    set_auth_cookies(response, access_token, refresh_token)
    return response


@app.post("/auth/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    """Clear auth cookies."""
    response = JSONResponse(content={"success": True, "message": "Logged out"})
    clear_auth_cookies(response)

    # Try to log audit if user was authenticated
    try:
        token = request.cookies.get("access_token")
        if token:
            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                client_ip = request.client.host if request.client else None
                log_audit(db, int(user_id), "LOGOUT", ip_address=client_ip)
    except Exception:
        pass  # Don't fail logout if audit logging fails

    return response


@app.post("/auth/refresh")
async def refresh_token(request: Request, db: Session = Depends(get_db)):
    """Refresh access token using refresh token cookie."""
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or deactivated")

    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})

    response = JSONResponse(content={"success": True})
    set_auth_cookies(response, new_access, new_refresh)
    return response


@app.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's info + permissions."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "fullName": current_user.full_name or current_user.username,
        "role": current_user.role,
        "permissions": current_user.get_permissions(),
    }


@app.post("/auth/register")
async def register_user(
    body: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = require_permission("can_manage_users"),
):
    """Admin-only: create a new user account."""
    # Check duplicates
    existing = db.query(User).filter(
        (User.username == body.username) | (User.email == body.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # Pick the right default permissions based on role
    if body.permissions:
        perms = body.permissions
    elif body.role == "doctor":
        perms = DOCTOR_PRESET_PERMISSIONS.copy()
    else:
        perms = DEFAULT_PERMISSIONS.copy()

    # Safety: only admin role may have can_access_admin
    if (body.role or "user") != "admin":
        perms["can_access_admin"] = False

    new_user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role or "user",
        is_active=1,
        permissions=json.dumps(perms),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit
    client_ip = request.client.host if request.client else None
    log_audit(db, current_user.id, "CREATE_USER", resource="users",
              resource_id=new_user.id, ip_address=client_ip)

    return {
        "success": True,
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "fullName": new_user.full_name,
            "role": new_user.role,
            "permissions": new_user.get_permissions(),
        },
    }


# ═══════════════════════════════════════════════════════════
# ADMIN ROUTES
# ═══════════════════════════════════════════════════════════

@app.get("/admin/users")
async def admin_list_users(
    db: Session = Depends(get_db),
    current_user: User = require_permission("can_manage_users"),
):
    """List all users with their permissions."""
    users = db.query(User).order_by(desc(User.created_at)).all()
    return {
        "success": True,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "fullName": u.full_name,
                "role": u.role,
                "isActive": bool(u.is_active),
                "permissions": u.get_permissions(),
                "lastLogin": u.last_login.isoformat() if u.last_login else None,
                "createdAt": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


@app.put("/admin/users/{user_id}")
async def admin_update_user(
    user_id: int,
    user_data: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = require_permission("can_manage_users"),
):
    """Update a user's profile, role, active status, or permissions."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deactivating themselves
    if user.id == current_user.id and "is_active" in user_data and not user_data["is_active"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    if "full_name" in user_data:
        user.full_name = user_data["full_name"]
    if "email" in user_data:
        user.email = user_data["email"]
    if "role" in user_data:
        user.role = user_data["role"]
    if "is_active" in user_data:
        user.is_active = 1 if user_data["is_active"] else 0
    if "permissions" in user_data:
        user.permissions = json.dumps(user_data["permissions"])
    if "password" in user_data and user_data["password"]:
        user.hashed_password = hash_password(user_data["password"])

    db.commit()
    db.refresh(user)

    # Audit
    client_ip = request.client.host if request.client else None
    log_audit(db, current_user.id, "UPDATE_USER", resource="users",
              resource_id=user.id, ip_address=client_ip)

    return {
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "isActive": bool(user.is_active),
            "permissions": user.get_permissions(),
        },
    }


@app.delete("/admin/users/{user_id}")
async def admin_deactivate_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = require_permission("can_manage_users"),
):
    """Deactivate a user (soft delete)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user.is_active = 0
    db.commit()

    client_ip = request.client.host if request.client else None
    log_audit(db, current_user.id, "DEACTIVATE_USER", resource="users",
              resource_id=user.id, ip_address=client_ip)

    return {"success": True, "message": f"User {user.username} deactivated"}


@app.get("/admin/stats")
async def admin_stats(
    db: Session = Depends(get_db),
    current_user: User = require_permission("can_access_admin"),
):
    """Dashboard overview statistics."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == 1).count()
    total_patients = db.query(Patient).filter(Patient.status == "active").count()
    total_analyses = db.query(MedicalReport).filter(MedicalReport.status != "archived").count()

    # Recent logins (last 10)
    recent_logs = (
        db.query(AuditLog)
        .filter(AuditLog.action == "LOGIN")
        .order_by(desc(AuditLog.created_at))
        .limit(10)
        .all()
    )
    recent_logins = []
    for log in recent_logs:
        u = db.query(User).filter(User.id == log.user_id).first()
        recent_logins.append({
            "username": u.username if u else "unknown",
            "timestamp": log.created_at.isoformat() if log.created_at else None,
            "ip": log.ip_address,
        })

    return {
        "success": True,
        "stats": {
            "totalUsers": total_users,
            "activeUsers": active_users,
            "totalPatients": total_patients,
            "totalAnalyses": total_analyses,
            "recentLogins": recent_logins,
        },
    }


@app.get("/admin/audit-logs")
async def admin_audit_logs(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = require_permission("can_view_audit_logs"),
):
    """Paginated audit log listing."""
    query_params = dict(request.query_params)
    page = int(query_params.get("page", "1"))
    per_page = int(query_params.get("per_page", "20"))
    action_filter = query_params.get("action")
    user_filter = query_params.get("user_id")

    query = db.query(AuditLog)
    if action_filter:
        query = query.filter(AuditLog.action == action_filter)
    if user_filter:
        query = query.filter(AuditLog.user_id == int(user_filter))

    total = query.count()
    logs = (
        query.order_by(desc(AuditLog.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    logs_response = []
    for log in logs:
        u = db.query(User).filter(User.id == log.user_id).first()
        logs_response.append({
            "id": log.id,
            "userId": log.user_id,
            "username": u.username if u else "unknown",
            "action": log.action,
            "resource": log.resource,
            "resourceId": log.resource_id,
            "details": log.details,
            "ipAddress": log.ip_address,
            "createdAt": log.created_at.isoformat() if log.created_at else None,
        })

    return {
        "success": True,
        "total": total,
        "page": page,
        "perPage": per_page,
        "logs": logs_response,
    }


@app.get("/admin/permission-presets")
async def get_permission_presets(
    current_user: User = require_permission("can_manage_users"),
):
    """Return available permission presets for the Admin UI."""
    return {
        "success": True,
        "presets": {
            "default": DEFAULT_PERMISSIONS,
            "doctor": DOCTOR_PRESET_PERMISSIONS,
            "admin": ALL_PERMISSIONS,
        },
    }


# ═══════════════════════════════════════════════════════════
# ADMIN – PATIENT ASSIGNMENT
# ═══════════════════════════════════════════════════════════

@app.get("/admin/patients")
async def admin_list_patients(
    db: Session = Depends(get_db),
    current_user: User = require_permission("can_access_admin"),
):
    """List all patients with their assigned doctor info (admin only)."""
    patients = db.query(Patient).order_by(desc(Patient.created_at)).all()
    patients_response = []
    for p in patients:
        doctor = None
        if p.doctor_id:
            doctor = db.query(User).filter(User.id == p.doctor_id).first()
        patients_response.append({
            "id": p.id,
            "name": p.name,
            "patient_id": p.patient_id,
            "status": p.status,
            "email": p.email,
            "phone": p.phone,
            "doctor_id": p.doctor_id,
            "doctor_username": doctor.username if doctor else None,
            "doctor_full_name": doctor.full_name if doctor else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return {"success": True, "patients": patients_response}


@app.put("/admin/patients/{patient_id}/assign")
async def admin_assign_patient(
    patient_id: int,
    body: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = require_permission("can_manage_users"),
):
    """Assign or reassign a patient (and their reports) to a doctor."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_doctor_id = body.get("doctor_id")  # None means unassign
    if new_doctor_id is not None:
        doctor = db.query(User).filter(User.id == new_doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

    old_doctor_id = patient.doctor_id
    patient.doctor_id = new_doctor_id

    # Also reassign all medical reports for this patient
    db.query(MedicalReport).filter(
        MedicalReport.patient_id == patient.id
    ).update({"doctor_id": new_doctor_id})

    db.commit()

    # Audit
    client_ip = request.client.host if request.client else None
    log_audit(
        db, current_user.id, "ASSIGN_PATIENT",
        resource="patients", resource_id=patient.id,
        details={"old_doctor_id": old_doctor_id, "new_doctor_id": new_doctor_id},
        ip_address=client_ip,
    )

    return {"success": True, "message": f"Patient {patient.name} assigned to doctor {new_doctor_id}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)