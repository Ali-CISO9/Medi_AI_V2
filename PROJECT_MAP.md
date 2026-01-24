# Medical AI Application - Comprehensive Project Map

## Overview
This document provides a detailed, updatable map of the Medical AI Application, a full-stack healthcare system with AI-powered medical analysis capabilities. The application specializes in liver disease diagnosis and includes patient management, AI analysis, and an intelligent chatbot.

**Last Updated:** 2025-12-11
**Version:** 1.0.0
**Project Type:** Healthcare AI Application
**Architecture:** Full-Stack (Next.js + FastAPI)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Frontend Structure](#frontend-structure)
4. [Backend Structure](#backend-structure)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Components Overview](#components-overview)
8. [Workflows & Operational Flows](#workflows--operational-flows)
9. [Dependencies & Environment](#dependencies--environment)
10. [Security & Privacy](#security--privacy)
11. [Future Enhancements](#future-enhancements)
12. [Update Procedures](#update-procedures)

---

## Project Overview

### Purpose
A graduate thesis project for medical AI analysis, focusing on liver disease diagnosis using machine learning models and providing healthcare professionals with AI-assisted diagnostic tools.

### Key Features
- **AI Analysis**: ML-powered liver disease prediction using lab values
- **Medical Chatbot**: Groq-powered assistant for liver health questions (moonshotai/kimi-k2-instruct-0905)
- **Patient Management**: CRUD operations for patient records
- **Dashboard**: Comprehensive healthcare dashboard with visualizations
- **Reports**: Advanced reporting with medical tools and analytics

### Target Users
- Healthcare professionals (doctors, nurses)
- Medical researchers
- Healthcare administrators

---

## Architecture & Technology Stack

### Overall Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ - React 18      │    │ - Python 3.8+   │    │ - SQLAlchemy    │
│ - TypeScript    │    │ - ML Models     │    │ - Alembic       │
│ - Tailwind CSS  │    │ - Google Gemini │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Technologies
- **Framework**: Next.js 15.2.4
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9 + shadcn/ui components
- **State Management**: React hooks + Context API
- **Charts**: Recharts 2.15.4
- **Icons**: Lucide React 0.454.0
- **Forms**: React Hook Form 7.60.0 + Zod validation
- **UI Components**: Radix UI primitives

### Backend Technologies
- **Framework**: FastAPI 0.104.1
- **Language**: Python 3.8+
- **Database**: SQLAlchemy 2.0.35 + SQLite
- **Migrations**: Alembic 1.12.1
- **AI/ML**: Scikit-learn + Groq API (moonshotai/kimi-k2-instruct-0905)
- **CORS**: FastAPI middleware
- **Environment**: python-dotenv 1.0.0

### External Services
- **Groq API**: For chatbot functionality (llama-3.1-8b-instant model)
- **Hugging Face Hub**: For potential ML model hosting

---

## Frontend Structure

### Directory Structure
```
app/
├── globals.css                 # Global styles
├── layout.tsx                  # Root layout component
├── page.tsx                    # Main dashboard page
├── ai-analysis/
│   └── page.tsx               # AI analysis page
├── api/
│   └── chatbot/
│       └── route.ts           # Chatbot API route
│   └── analyze/
│       └── route.ts           # Analysis API route
├── chatbot/
│   └── page.tsx               # Chatbot page
├── dashboard/
│   └── page.tsx               # Dashboard page
├── patients/
│   └── page.tsx               # Patient management page
└── settings/
    └── page.tsx               # Settings page

components/
├── ui/                        # Reusable UI components (shadcn)
├── layout/                    # Layout components
├── common/                    # Common utilities
├── ai-chatbot.tsx             # Main chatbot component
├── ai-analysis-result.tsx     # Analysis results display
├── ai-radiology-scan.tsx      # Radiology scan interface
├── advanced-reports.tsx       # Advanced reporting component
├── dashboard-layout.tsx       # Main dashboard layout
├── patient-data-visualization.tsx  # Data visualization
├── patient-management.tsx     # Patient CRUD interface
└── welcome-header.tsx         # Welcome header component

lib/
├── utils.ts                   # Utility functions
├── language-context.tsx       # Language context
├── analysis-context.tsx       # Analysis context
└── i18n.ts                    # Internationalization

hooks/
├── use-mobile.ts              # Mobile detection hook
└── use-toast.ts               # Toast notifications hook
```

### Key Components

#### Core Components
- **AiChatbot**: Main chatbot interface with message history, search, and export functionality
- **AiRadiologyScan**: File upload and manual lab value input for AI analysis
- **AiAnalysisResult**: Displays analysis results with patient form integration
- **AdvancedReports**: Comprehensive reporting with medical tools and analytics
- **PatientManagement**: CRUD operations for patient records
- **PatientDataVisualization**: Charts and graphs for patient data

#### Layout Components
- **DashboardLayout**: Main application layout with navigation and header
- **WelcomeHeader**: Welcome message and branding

#### UI Components (shadcn/ui)
- Buttons, Cards, Dialogs, Forms, Tables, Charts, etc.

### Routing Structure
- `/` - Main dashboard with tabbed interface
- `/ai-analysis` - AI analysis page
- `/chatbot` - Chatbot interface
- `/patients` - Patient management
- `/settings` - Application settings

---

## Backend Structure

### Directory Structure
```
backend/
├── main.py                    # FastAPI application
├── database.py                # Database configuration
├── models.py                  # SQLAlchemy models
├── model.py                   # ML model loading/training
├── requirements.txt           # Python dependencies
├── alembic/                   # Database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/              # Migration files
├── seed.py                    # Database seeding
├── test_*.py                  # Test files
└── *.pkl                      # Trained ML models
```

### Core Modules

#### main.py
- FastAPI application instance
- CORS middleware configuration
- API route definitions
- ML model integration
- Database session management

#### database.py
- SQLAlchemy engine configuration
- Session management
- Base model class

#### models.py
- Patient model
- LabTest model
- MedicalReport model
- User model (future auth)

#### model.py
- ML model loading and prediction functions
- Liver disease classification logic

### API Endpoints Structure
```
GET  /                    # Health check
POST /analyze             # AI analysis (lab values/images)
POST /chatbot             # Chatbot interaction
GET  /patient-data        # Get patient information
GET  /lab-tests           # Get lab tests for patient
GET  /patients            # List all patients
POST /patients            # Create new patient
PUT  /patients/{id}       # Update patient
DELETE /patients/{id}     # Delete patient
GET  /patient-analyses    # Get all analyses
PUT  /patient-analyses/{id} # Update analysis
DELETE /patient-analyses/{id} # Delete analysis
```

---

## Database Schema

### Tables Overview

#### patients
```sql
CREATE TABLE patients (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    birth_date VARCHAR(10),
    email VARCHAR(255),
    phone VARCHAR(20),
    profile_picture VARCHAR(500),
    department VARCHAR(100),
    doctor_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### lab_tests
```sql
CREATE TABLE lab_tests (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    normal_range VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

#### medical_reports
```sql
CREATE TABLE medical_reports (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    diagnosis VARCHAR(500) NOT NULL,
    confidence FLOAT NOT NULL,
    advice TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

#### users (Future Implementation)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships
- Patient → LabTest (One-to-Many)
- Patient → MedicalReport (One-to-Many)

### Indexes
- patients.patient_id (UNIQUE)
- lab_tests.patient_id
- medical_reports.patient_id

---

## API Endpoints

### Backend Endpoints (FastAPI)

#### Health & Status
- `GET /` - Application health check

#### AI Analysis
- `POST /analyze`
  - **Input**: File upload or lab values JSON
  - **Output**: Analysis results with diagnosis, confidence, and advice
  - **ML Integration**: Uses trained liver disease model

#### Chatbot (Note: Currently handled by frontend)
- `POST /chatbot` - Would handle chatbot interactions

#### Patient Data
- `GET /patient-data` - Get sample patient data
- `GET /lab-tests?patientId={id}` - Get lab tests for specific patient

#### Patient Management
- `GET /patients` - List all patients
- `POST /patients` - Create new patient
- `PUT /patients/{patient_id}` - Update patient
- `DELETE /patients/{patient_id}` - Delete patient

#### Medical Reports
- `GET /patient-analyses` - Get all medical reports
- `PUT /patient-analyses/{analysis_id}` - Update analysis
- `DELETE /patient-analyses/{analysis_id}` - Delete analysis

### Frontend API Routes (Next.js)

#### Chatbot
- `POST /api/chatbot`
  - **Purpose**: Handle chatbot interactions
  - **Integration**: Groq API (moonshotai/kimi-k2-instruct-0905 model)
  - **Features**: Specialized liver disease expertise

#### Analysis
- `POST /api/analyze`
  - **Purpose**: Proxy analysis requests to backend
  - **Features**: File upload and lab value processing

---

## Components Overview

### Main Components

#### AiChatbot (`components/ai-chatbot.tsx`)
- **Purpose**: Interactive AI chatbot for medical questions
- **Features**:
  - Message history with search
  - Export chat functionality
  - Arabic text support
  - Error handling and timeouts
  - Real-time responses via Gemini API

#### AiRadiologyScan (`components/ai-radiology-scan.tsx`)
- **Purpose**: Interface for AI analysis input
- **Features**:
  - File upload for medical images
  - Manual lab value entry
  - Dynamic form fields
  - Real-time validation

#### AdvancedReports (`components/advanced-reports.tsx`)
- **Purpose**: Comprehensive reporting dashboard
- **Features**:
  - Medical calculators (BMI, GFR, fluid balance)
  - Patient analytics and charts
  - Task and appointment management
  - PDF export functionality
  - Real-time data updates

#### PatientManagement (`components/patient-management.tsx`)
- **Purpose**: CRUD operations for patient records
- **Features**:
  - Create/edit/delete patients
  - Form validation
  - Real-time updates

### UI Component Library
- **shadcn/ui**: 50+ reusable components
- **Radix UI**: Accessible primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Consistent iconography

---

## Workflows & Operational Flows

### AI Analysis Workflow
1. **Input Collection**
   - User uploads medical image or enters lab values
   - Frontend validates input data

2. **Data Processing**
   - Frontend sends data to backend API
   - Backend processes image or lab values

3. **ML Prediction**
   - Backend loads trained ML model
   - Model predicts liver disease probability
   - Generates diagnosis and recommendations

4. **Result Display**
   - Frontend displays results with confidence scores
   - User can save results to patient record

### Patient Management Workflow
1. **Patient Creation**
   - User fills patient information form
   - Frontend validates data
   - Backend creates patient record

2. **Data Updates**
   - User modifies patient information
   - Changes sync with database
   - Real-time UI updates

3. **Analysis Integration**
   - AI analysis results link to patient records
   - Historical data tracking

### Chatbot Interaction Flow
1. **User Input**
   - User types medical question
   - Frontend sends to Google Gemini API

2. **AI Processing**
    - Groq moonshotai/kimi-k2-instruct-0905 processes with specialized medical prompt
    - Generates evidence-based response

3. **Response Display**
   - Frontend displays formatted response
   - Message history maintained

### Reporting Workflow
1. **Data Aggregation**
   - Fetch patient data and analyses
   - Calculate metrics and insights

2. **Visualization**
   - Generate charts and graphs
   - Display medical calculators

3. **Export**
   - Generate PDF reports
   - Export data in various formats

---

## Dependencies & Environment

### Frontend Dependencies (package.json)
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "groq-sdk": "^0.7.0",
    "@radix-ui/react-*": "Various versions",
    "next": "15.2.4",
    "react": "^18.3.1",
    "tailwindcss": "^4.1.9",
    "recharts": "2.15.4",
    "lucide-react": "^0.454.0"
  }
}
```

### Backend Dependencies (requirements.txt)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pydantic==2.8.0
sqlalchemy==2.0.35
alembic==1.12.1
python-dotenv==1.0.0
google-generativeai==0.8.3
requests==2.31.0
scikit-learn==1.3.0
```

### Environment Variables
```bash
# Backend
GEMINI_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///./medical_ai.db
HUGGINGFACE_API_TOKEN=your_token_here

# Frontend
GROQ_API_KEY=your_groq_api_key_here
BACKEND_URL=http://localhost:8000
```

### Development Setup
1. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python model.py  # Train ML model
   python main.py   # Start server
   ```

2. **Frontend Setup**:
   ```bash
   npm install
   npm run dev
   ```

3. **Database**:
   ```bash
   cd backend
   python seed.py  # Populate sample data
   ```

---

## Security & Privacy

### Current Security Measures
- **CORS Configuration**: Restricted to localhost origins
- **Input Validation**: Frontend and backend validation
- **API Rate Limiting**: Not implemented (future enhancement)
- **Authentication**: Not implemented (future enhancement)

### Privacy Considerations
- **Medical Data**: PHI handling requirements
- **Data Encryption**: Not implemented for database
- **Audit Logging**: Not implemented
- **Access Control**: Not implemented

### Compliance
- **HIPAA**: Not fully compliant (development only)
- **GDPR**: Basic considerations for data handling

---

## Future Enhancements

### Planned Features
- User authentication and authorization
- PostgreSQL database migration
- Advanced ML models for image analysis
- Real-time notifications
- Cloud deployment (AWS/GCP)
- Mobile application
- Multi-language support
- Advanced analytics and reporting

### Technical Improvements
- Implement proper error handling
- Add comprehensive testing
- Performance optimization
- Security hardening
- API documentation (Swagger/OpenAPI)

---

## Update Procedures

### How to Update This Document
1. **Code Changes**: Update relevant sections when modifying code
2. **New Features**: Add new sections for major features
3. **Dependencies**: Update dependency lists when packages change
4. **Architecture Changes**: Update architecture diagrams and descriptions

### Version Control
- Keep version history in document header
- Update "Last Updated" date with each change
- Reference commit hashes for major changes

### Review Process
- Technical review for accuracy
- Update cross-references when sections change
- Validate all links and references

---

## Quick Reference

### Development Commands
```bash
# Backend
cd backend && python main.py

# Frontend
npm run dev

# Database
cd backend && python seed.py
```

### Key Files
- `app/page.tsx` - Main dashboard
- `backend/main.py` - API server
- `backend/models.py` - Database models
- `components/ai-chatbot.tsx` - Chatbot component

### Ports
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

*This document is automatically maintained and should be updated with any changes to the codebase or architecture.*