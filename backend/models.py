import json as _json
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# ─────────────────────────────────────────────────────────
# Permission Defaults
# ─────────────────────────────────────────────────────────
DEFAULT_PERMISSIONS = {
    "can_view_dashboard":  True,
    "can_run_analysis":    False,
    "can_use_chatbot":     True,
    "can_view_reports":    False,
    "can_view_patients":   True,
    "can_create_patients": False,
    "can_edit_patients":   False,
    "can_delete_patients": False,
    "can_view_records":    False,
    "can_manage_users":    False,
    "can_view_audit_logs": False,
    "can_access_admin":    False,
}

ALL_PERMISSIONS = {k: True for k in DEFAULT_PERMISSIONS}

DOCTOR_PRESET_PERMISSIONS = {
    "can_view_dashboard":  True,
    "can_run_analysis":    True,
    "can_use_chatbot":     True,
    "can_view_reports":    True,
    "can_view_patients":   True,
    "can_create_patients": True,
    "can_edit_patients":   True,
    "can_delete_patients": False,
    "can_view_records":    True,
    "can_manage_users":    False,
    "can_view_audit_logs": False,
    "can_access_admin":    False,
}

# ─────────────────────────────────────────────────────────
# Existing Models (UNCHANGED)
# ─────────────────────────────────────────────────────────

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    patient_id = Column(String(50), unique=True, nullable=False)
    birth_date = Column(String(10), nullable=True)  # Store as string YYYY-MM-DD
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    profile_picture = Column(String(500), nullable=True)  # URL or path to profile picture
    department = Column(String(100), nullable=True)  # Medical department
    doctor_name = Column(String(255), nullable=True)  # Attending physician/supervisor
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Owning doctor
    status = Column(String(20), nullable=False, default="active")  # active, archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="patients")
    lab_tests = relationship("LabTest", back_populates="patient", cascade="all, delete-orphan")
    medical_reports = relationship("MedicalReport", back_populates="patient", cascade="all, delete-orphan")

class LabTest(Base):
    __tablename__ = "lab_tests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    test_name = Column(String(255), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    normal_range = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)  # normal, high, low, critical
    date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="lab_tests")

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Owning doctor
    diagnosis = Column(String(500), nullable=False)
    confidence = Column(Float, nullable=False)  # 0-100
    advice = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="active")  # active, archived, finalized
    is_finalized = Column(Integer, nullable=False, default=0)  # 0=false, 1=true
    risk_level = Column(String(20), nullable=True)  # high, medium, low
    detailed_results = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="medical_reports")
    patient = relationship("Patient", back_populates="medical_reports")

# ─────────────────────────────────────────────────────────
# Auth Models
# ─────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(50), unique=True, nullable=False)
    email           = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name       = Column(String(255), nullable=True)
    role            = Column(String(20), nullable=False, default="user")  # label only
    is_active       = Column(Integer, nullable=False, default=1)  # 0=disabled, 1=active
    permissions     = Column(Text, nullable=False, default=_json.dumps(DEFAULT_PERMISSIONS))
    last_login      = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    patients = relationship("Patient", back_populates="doctor", foreign_keys="Patient.doctor_id")
    medical_reports = relationship("MedicalReport", back_populates="doctor", foreign_keys="MedicalReport.doctor_id")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def get_permissions(self) -> dict:
        """Parse the JSON permissions column, merging with defaults for any missing keys."""
        try:
            perms = _json.loads(self.permissions) if self.permissions else {}
        except (ValueError, TypeError):
            perms = {}
        # Ensure all known keys exist (forward-compatible)
        merged = {**DEFAULT_PERMISSIONS, **perms}
        return merged

    def has_permission(self, perm: str) -> bool:
        """Check if the user has a specific permission."""
        return bool(self.get_permissions().get(perm, False))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    action      = Column(String(100), nullable=False)   # e.g. "LOGIN", "CREATE_PATIENT"
    resource    = Column(String(100), nullable=True)     # e.g. "patients"
    resource_id = Column(Integer, nullable=True)
    details     = Column(Text, nullable=True)            # JSON string with extra info
    ip_address  = Column(String(45), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="audit_logs")