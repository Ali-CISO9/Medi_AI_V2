from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Optional, List
import json
import requests
from datetime import datetime
import numpy as np

# Load environment variables
load_dotenv()

from diagnosis_engine import DiagnosisEngine
from database import get_db, engine, Base
from models import Patient, LabTest, MedicalReport, User
from sqlalchemy.orm import Session
from sqlalchemy import desc

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

# Initialize DiagnosisEngine
diagnosis_engine = DiagnosisEngine()

print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
print("Backend server starting with updated analysis saving functionality...")

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Medical AI Backend", version="1.0.0")

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

# Initialize Hugging Face API
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")

@app.get("/")
async def root():
    return {"message": "Medical AI Backend API", "status": "running"}

@app.post("/analyze")
async def analyze_patient(user_profile: dict, db: Session = Depends(get_db)):
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
                advice = model_results['hepatitis']['status_advice']
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
                        diagnosis=diagnosis,
                        confidence=confidence,
                        advice=advice,
                        risk_level=db_risk_level
                    )
                    db.add(medical_report)
                    db.commit()
                    db.refresh(medical_report)
                    print(f"Saved analysis for patient {patient.name} (ID: {patient.id}) - Risk: {db_risk_level}")
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


@app.get("/patient-data")
async def get_patient_data(db: Session = Depends(get_db)):
    try:
        print(f"DATABASE_URL in endpoint: {os.getenv('DATABASE_URL')}")
        # Get the first patient (for demo purposes)
        patient = db.query(Patient).first()
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
async def get_lab_tests(patientId: str, db: Session = Depends(get_db)):
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
async def get_patients(request: Request, db: Session = Depends(get_db)):
    try:
        # Parse query parameters manually
        query_params = dict(request.query_params)
        status = query_params.get('status', 'active')

        # Filter patients by status (default to active)
        query = db.query(Patient)
        if status != "all":
            query = query.filter(Patient.status == status)

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

@app.put("/patients/{patient_id}")
async def update_patient(patient_id: str, patient_data: dict = None, db: Session = Depends(get_db)):
    try:
        # Find patient by patient_id (string field)
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Track if status is being changed from archived to active
        old_status = patient.status
        new_status = patient_data.get("status", old_status)

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
        if "status" in patient_data:
            patient.status = patient_data["status"]

        # If restoring patient from archived to active, also restore their analyses
        if old_status == "archived" and new_status == "active":
            analyses_to_restore = db.query(MedicalReport).filter(
                MedicalReport.patient_id == patient.id,
                MedicalReport.status == "archived"
            ).all()
            for analysis in analyses_to_restore:
                analysis.status = "active"
            restored_count = len(analyses_to_restore)
        else:
            restored_count = 0

        db.commit()
        db.refresh(patient)

        message = "Patient updated successfully"
        if restored_count > 0:
            message += f" and {restored_count} analyses restored"

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
        }, "message": message}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in update_patient: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.delete("/patients/{patient_id}")
async def archive_patient(patient_id: str, db: Session = Depends(get_db)):
    try:
        # Find patient by patient_id (string field)
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Archive the patient instead of deleting
        patient.status = "archived"

        # Also archive all analyses for this patient
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

@app.post("/patients")
async def create_or_update_patient(patient_data: dict, db: Session = Depends(get_db)):
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

        # Create new patient
        new_patient = Patient(
            name=name,
            birth_date=birth_date,
            patient_id=patient_id,
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
async def get_patient_analyses(request: Request, db: Session = Depends(get_db)):
    try:
        # Parse query parameters manually
        query_params = dict(request.query_params)
        include_archived = query_params.get('include_archived', 'false').lower() == 'true'
        patient_id_filter = query_params.get('patient_id')

        # Get medical reports - filter out archived by default unless specifically requested
        query = db.query(MedicalReport)
        if not include_archived:
            query = query.filter(MedicalReport.status != "archived")

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

            patient_data = {
                "id": analysis.id,
                "patient_id": analysis.patient_id,
                "diagnosis": analysis.diagnosis,
                "confidence": analysis.confidence,
                "advice": analysis.advice,
                "status": analysis.status,
                "is_finalized": bool(analysis.is_finalized),
                "risk_level": risk_level,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
                "updated_at": analysis.updated_at.isoformat() if analysis.updated_at else analysis.created_at.isoformat() if analysis.created_at else None,
                "patient_name": patient.name if patient else "Unknown",
                "patient_id_display": patient.patient_id if patient else "Unknown",
                "birth_date": patient.birth_date if patient else None,
                "email": patient.email if patient else None,
                "phone": patient.phone if patient else None,
                "profile_picture": patient.profile_picture if patient else None,
                "department": patient.department if patient else None,
                "doctor_name": patient.doctor_name if patient else None,
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
async def update_patient_analysis(analysis_id: int, analysis_data: dict, db: Session = Depends(get_db)):
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
async def delete_patient_analysis(analysis_id: int, db: Session = Depends(get_db)):
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)