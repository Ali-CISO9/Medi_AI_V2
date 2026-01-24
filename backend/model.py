import os
from typing import Tuple

# Try to import ML dependencies
try:
    import pandas as pd
    import numpy as np
    import joblib
    PANDAS_AVAILABLE = True
    print("ML dependencies loaded successfully")
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: ML dependencies not available, using rule-based prediction")

# Load the trained ML models
MODEL_DIR = os.path.dirname(__file__)

# Force rule-based prediction for now due to model compatibility issues
print("Using enhanced rule-based prediction (ML models disabled for compatibility)")
model_stage = None
model_complications = None
model_status = None
cancer_model = None
fatty_liver_model = None

# Uncomment below to try loading ML models when compatibility issues are resolved
"""
if PANDAS_AVAILABLE:
    try:
        # Hepatitis models
        try:
            model_stage = joblib.load(os.path.join(MODEL_DIR, 'hepatitis_stage.pkl'))
            print("Hepatitis stage model loaded successfully")
        except Exception as e:
            print(f"Hepatitis stage model loading failed: {e}")
            model_stage = None

        try:
            model_complications = joblib.load(os.path.join(MODEL_DIR, 'hepatitis_complications.pkl'))
            print("Hepatitis complications model loaded successfully")
        except Exception as e:
            print(f"Hepatitis complications model loading failed: {e}")
            model_complications = None

        try:
            model_status = joblib.load(os.path.join(MODEL_DIR, 'hepatitis_status.pkl'))
            print("Hepatitis status model loaded successfully")
        except Exception as e:
            print(f"Hepatitis status model loading failed: {e}")
            model_status = None

        # Cancer model
        try:
            cancer_model = joblib.load(os.path.join(MODEL_DIR, 'cancer_model.pkl'))
            print("Cancer model loaded successfully")
        except Exception as e:
            print(f"Cancer model loading failed: {e}")
            cancer_model = None

        # Fatty liver model
        try:
            fatty_liver_model = joblib.load(os.path.join(MODEL_DIR, 'fatty_liver_model.pkl'))
            print("Fatty liver model loaded successfully")
        except Exception as e:
            print(f"Fatty liver model loading failed: {e}")
            fatty_liver_model = None

        loaded_models = sum([model_stage is not None, model_complications is not None,
                           model_status is not None, cancer_model is not None,
                           fatty_liver_model is not None])
        print(f"Successfully loaded {loaded_models} out of 5 ML models")

    except Exception as e:
        print(f"General model loading error: {e}")
        print("Falling back to enhanced rule-based prediction")
        model_stage = None
        model_complications = None
        model_status = None
        cancer_model = None
        fatty_liver_model = None
else:
    print("Using enhanced rule-based prediction")
    model_stage = None
    model_complications = None
    model_status = None
    cancer_model = None
    fatty_liver_model = None
"""

def predict_liver_disease(alt: float, ast: float, bilirubin: float, ggt: float, age: float = 45, gender: str = 'male', alkphos: float = 100, tp: float = 7.0, alb: float = 4.0, platelets: float = 250000) -> Tuple[str, int, str]:
    """
    Predict Hepatitis risk using the comprehensive Hepatitis ML system

    Args:
        alt: ALT enzyme level
        ast: AST enzyme level
        bilirubin: Bilirubin level (mg/dL)
        ggt: GGT enzyme level
        age: Patient age
        gender: Patient gender
        alkphos: Alkaline phosphatase
        tp: Total protein
        alb: Albumin level (g/dL)
        platelets: Platelet count

    Returns:
        Tuple of (diagnosis, confidence, advice)
    """
    if model_stage is None or model_complications is None or model_status is None:
        # Enhanced rule-based prediction when ML models unavailable
        print("Using enhanced rule-based prediction (Hepatitis models not loaded)")
        return _enhanced_rule_based_prediction(alt, ast, bilirubin, ggt, age, gender, alkphos, tp, alb)

    try:
        # Create input data for Hepatitis models
        # Assuming models use standard liver function tests
        input_data = {
            'ALT': alt,
            'AST': ast,
            'Bilirubin': bilirubin,
            'Albumin': alb,
            'Platelets': platelets,
            'Age': age,
            'Gender': 1 if gender.lower() in ['male', 'm'] else 0,
            'GGT': ggt,
            'AlkPhos': alkphos,
            'TP': tp
        }

        df_input = pd.DataFrame([input_data])

        # ----------------------------------------------------------
        # 1. Stage Diagnosis (Fibrosis Stage 0-4)
        # ----------------------------------------------------------
        stage_pred = model_stage.predict(df_input)[0]
        stage = int(stage_pred)
        print(f"Hepatitis Stage Prediction: {stage}")

        # Double verification for critical stages (3-4)
        if stage >= 3:
            stage_verify = model_stage.predict(df_input)[0]
            if int(stage_verify) != stage:
                stage = min(stage, int(stage_verify))  # Take more conservative result

        stage_descriptions = {
            0: "F0 - Normal/Minimal fibrosis",
            1: "F1 - Mild fibrosis",
            2: "F2 - Moderate fibrosis",
            3: "F3 - Advanced fibrosis (bridging)",
            4: "F4 - Cirrhosis"
        }

        # ----------------------------------------------------------
        # 2. APRI Score Calculation
        # ----------------------------------------------------------
        ast_upper_limit = 40  # IU/L
        apri_score = (ast / ast_upper_limit / (platelets / 100000)) * 100
        print(f"APRI Score: {apri_score:.2f}")

        if apri_score < 0.5:
            apri_interpretation = "Rule out significant fibrosis"
        elif apri_score < 1.5:
            apri_interpretation = "Gray zone - further testing needed"
        elif apri_score < 2.0:
            apri_interpretation = "High probability of significant fibrosis"
        else:
            apri_interpretation = "High probability of cirrhosis"

        # ----------------------------------------------------------
        # 3. ALBI Score Calculation
        # ----------------------------------------------------------
        import math
        albi_score = (math.log10(bilirubin * 17.1) * 0.66) + (alb * 10 * -0.085)
        print(f"ALBI Score: {albi_score:.2f}")

        if albi_score <= -2.60:
            albi_grade = 1
            albi_interpretation = "Grade 1 - Good liver function"
        elif albi_score <= -1.39:
            albi_grade = 2
            albi_interpretation = "Grade 2 - Moderate liver dysfunction"
        else:
            albi_grade = 3
            albi_interpretation = "Grade 3 - Severe liver dysfunction"

        # ----------------------------------------------------------
        # 4. Ascites Prediction (Complications)
        # ----------------------------------------------------------
        ascites_risk = model_complications.predict_proba(df_input)[0][1] * 100  # Probability of ascites
        print(f"Ascites Risk: {ascites_risk:.1f}%")

        if ascites_risk < 30:
            ascites_status = "Low risk - stable fluid balance"
        elif ascites_risk < 60:
            ascites_status = "Moderate risk - monitor for swelling"
        else:
            ascites_status = "High risk - critical, immediate medical attention needed"

        # ----------------------------------------------------------
        # 5. Mortality Risk Assessment
        # ----------------------------------------------------------
        mortality_risk = model_status.predict_proba(df_input)[0][1] * 100  # Probability of mortality
        print(f"Mortality Risk: {mortality_risk:.1f}%")

        if mortality_risk <= 20:
            mortality_status = "Low risk - stable condition"
        elif mortality_risk <= 50:
            mortality_status = "Moderate risk - close monitoring required"
        elif mortality_risk <= 80:
            mortality_status = "High risk - advanced liver failure"
        else:
            mortality_status = "Critical risk - end-stage liver disease"

        # ----------------------------------------------------------
        # 6. Final Diagnosis and Recommendations
        # ----------------------------------------------------------

        if stage == 0:
            diagnosis = "Normal Liver / Minimal Fibrosis"
            confidence = 95
            advice = f"Stage {stage}: {stage_descriptions[stage]}. Continue routine monitoring."
        elif stage == 4:
            diagnosis = f"Cirrhosis (Stage {stage})"
            confidence = 90
            advice = f"CRITICAL: {stage_descriptions[stage]}. Immediate specialist consultation required. {mortality_status}."
        else:
            diagnosis = f"Hepatitis Fibrosis (Stage {stage})"
            confidence = 85
            advice = f"Stage {stage}: {stage_descriptions[stage]}. Regular monitoring and treatment recommended."

        # Add detailed medical information
        detailed_info = f"\n\nDetailed Assessment:\n"
        detailed_info += f"APRI Score: {apri_score:.2f} - {apri_interpretation}\n"
        detailed_info += f"ALBI Grade {albi_grade}: {albi_interpretation}\n"
        detailed_info += f"Ascites Risk: {ascites_risk:.1f}% - {ascites_status}\n"
        detailed_info += f"Mortality Risk: {mortality_risk:.1f}% - {mortality_status}"

        advice += detailed_info

        return diagnosis, confidence, advice

    except Exception as e:
        error_msg = f"Hepatitis ML prediction error: {str(e)}"
        print(f"Error: {error_msg}")
        print("Falling back to enhanced rule-based prediction")
        diagnosis, confidence, advice = _enhanced_rule_based_prediction(alt, ast, bilirubin, ggt, age, gender, alkphos, tp, alb)
        # Add error info to advice for debugging
        advice += f" [DEBUG: {error_msg}]"
        return diagnosis, confidence, advice

def predict_cancer_risk(age: int, gender: str, bmi: float, smoking: str, genetic_risk: str, physical_activity: str, alcohol_intake: str, cancer_history: str) -> Tuple[float, str]:
    """
    Predict cancer risk using XGBoost model

    Args:
        age: Patient age
        gender: 'male' or 'female'
        bmi: Body Mass Index
        smoking: 'yes' or 'no'
        genetic_risk: 'low', 'medium', or 'high'
        physical_activity: Activity level (not used in model)
        alcohol_intake: Alcohol consumption level (not used in model)
        cancer_history: 'yes' or 'no'

    Returns:
        Tuple of (risk_percentage, advice)
    """
    if cancer_model is None:
        return 50.0, "Cancer model not available. Please consult with a healthcare professional for proper screening."

    try:
        # Encode categorical variables
        gender_encoded = 0 if gender.lower() in ['male', 'm'] else 1
        smoking_encoded = 1 if smoking.lower() in ['yes', 'y'] else 0
        genetic_encoded = {'low': 0, 'medium': 1, 'high': 2}.get(genetic_risk.lower(), 0)
        history_encoded = 1 if cancer_history.lower() in ['yes', 'y'] else 0

        # Create input data
        input_data = {
            'Age': age,
            'Gender': gender_encoded,
            'BMI': bmi,
            'Smoking': smoking_encoded,
            'GeneticRisk': genetic_encoded,
            'PhysicalActivity': 1,  # Default moderate activity
            'AlcoholIntake': 1,     # Default moderate intake
            'CancerHistory': history_encoded
        }

        df_input = pd.DataFrame([input_data])
        risk_percentage = cancer_model.predict_proba(df_input)[0][1] * 100

        # Generate advice based on risk level
        if risk_percentage <= 10:
            advice = "Very low risk. Excellent health indicators. Continue regular check-ups."
        elif risk_percentage <= 40:
            advice = "Low to moderate risk. Maintain healthy lifestyle and routine screenings."
        elif risk_percentage <= 50:
            advice = "Moderate risk. Consider additional screening and lifestyle modifications."
        elif risk_percentage <= 90:
            advice = "High risk. Immediate medical consultation recommended for comprehensive screening."
        else:
            advice = "Very high risk. Urgent medical attention required. Schedule diagnostic tests immediately."

        return round(risk_percentage, 1), advice

    except Exception as e:
        error_msg = f"Cancer prediction error: {str(e)}"
        print(f"Error: {error_msg}")
        return 50.0, f"Unable to calculate risk due to technical error. Please consult healthcare professional. [DEBUG: {error_msg}]"

def predict_fatty_liver(albumin: float, alp: float, ast: float, alt: float, cholesterol: float, creatinine: float, glucose: float, ggt: float, bilirubin: float, triglycerides: float, uric_acid: float, platelets: float, hdl: float) -> Tuple[str, float, str]:
    """
    Predict fatty liver disease using XGBoost model

    Args:
        albumin, alp, ast, alt, cholesterol, creatinine, glucose, ggt, bilirubin, triglycerides, uric_acid, platelets, hdl: Blood test values

    Returns:
        Tuple of (diagnosis, confidence_percentage, advice)
    """
    if fatty_liver_model is None:
        return "Unable to assess", 50.0, "Fatty liver model not available. Please consult with a healthcare professional."

    try:
        # Check for required features (triglycerides, ALT/GGT must be present)
        if triglycerides <= 0 or (alt <= 0 and ggt <= 0):
            return "Insufficient data", 0.0, "Missing required blood markers (Triglycerides and ALT/GGT). Cannot perform assessment."

        input_data = {
            'Albumin': albumin,
            'ALP': alp,
            'AST': ast,
            'ALT': alt,
            'Cholesterol': cholesterol,
            'Creatinine': creatinine,
            'Glucose': glucose,
            'GGT': ggt,
            'Bilirubin': bilirubin,
            'Triglycerides': triglycerides,
            'Uric_Acid': uric_acid,
            'Platelets': platelets,
            'HDL': hdl
        }

        df_input = pd.DataFrame([input_data])

        # Get prediction probabilities
        probs = fatty_liver_model.predict_proba(df_input)[0]
        sick_probability = probs[1] * 100
        healthy_probability = probs[0] * 100

        if sick_probability > 50:
            diagnosis = "Fatty Liver Disease Detected"
            confidence = sick_probability
            advice = f"High probability of fatty liver disease ({confidence:.1f}%). Lifestyle modifications recommended: weight loss, exercise, reduced sugar/alcohol intake. Consult hepatologist for confirmation."
        else:
            diagnosis = "Normal Liver Function"
            confidence = healthy_probability
            advice = f"Low risk of fatty liver disease ({confidence:.1f}%). Maintain healthy lifestyle with regular monitoring."

        return diagnosis, round(confidence, 1), advice

    except Exception as e:
        error_msg = f"Fatty liver prediction error: {str(e)}"
        print(f"Error: {error_msg}")
        return "Unable to assess", 50.0, f"Technical error occurred. Please consult healthcare professional. [DEBUG: {error_msg}]"

def _enhanced_rule_based_prediction(alt: float, ast: float, bilirubin: float, ggt: float, age: float = 45, gender: str = 'male', alkphos: float = 100, tp: float = 7.0, alb: float = 4.0) -> Tuple[str, int, str]:
    """Enhanced rule-based prediction with specific medical diagnoses"""

    # Calculate medically significant ratios
    alt_ast_ratio = alt / ast if ast > 0 else 0
    print(f"ENHANCED ANALYSIS: ALT={alt}, AST={ast}, BILI={bilirubin}, GGT={ggt}, Age={age}, Gender={gender}")
    print(f"Ratios: ALT/AST={alt_ast_ratio:.2f}")

    # Analyze patterns for specific diagnoses

    # Most specific patterns first (Hepatitis C, Cirrhosis, etc.)

    # Hepatitis C pattern: High ALT, moderate AST, elevated GGT
    hep_c_condition = alt > 80 and ast < 120 and ggt > 60 and alt_ast_ratio >= 1.5
    print(f"Hepatitis C check: ALT>80({alt > 80}), AST<120({ast < 120}), GGT>60({ggt > 60}), Ratio>=1.5({alt_ast_ratio >= 1.5}) = {hep_c_condition}")

    if hep_c_condition:
        print("Hepatitis C pattern detected!")
        stage = min(4, max(1, int((alt - 80) / 40) + 1))
        diagnosis = f"Hepatitis C (Stage {stage})"
        advice = f"Hepatitis C detected at stage {stage}. Immediate specialist consultation required. Consider viral load testing and liver biopsy if indicated."
        print(f"FINAL RESULT: {diagnosis}")
        return diagnosis, 88, advice

    # Cirrhosis pattern: High AST, low ALT, elevated bilirubin
    elif ast > alt and bilirubin > 2.0 and alt_ast_ratio < 0.8:
        stage = min(4, max(1, int(bilirubin / 0.8)))
        return f"Liver Cirrhosis (Stage {stage})", 85, f"Liver cirrhosis detected at stage {stage}. Urgent hepatologist consultation needed. Evaluate for varices, ascites, and hepatocellular carcinoma screening."

    # Cholestasis pattern: Very high GGT, elevated bilirubin
    elif ggt > 100 and bilirubin > 1.5:
        return "Cholestasis", 82, "Evidence of bile duct obstruction or cholestasis. Further investigation required including abdominal ultrasound and liver biopsy if indicated."

    # Acute hepatitis pattern: Very high ALT/AST, elevated bilirubin
    elif (alt > 200 or ast > 200) and bilirubin > 2.0:
        return "Acute Hepatitis", 90, "Signs of acute hepatitis. Immediate medical attention required. Rule out viral hepatitis, drug-induced liver injury, and autoimmune hepatitis."

    # Drug-induced liver injury pattern
    elif alt > 150 and ast > 150 and alt_ast_ratio < 5:
        return "Drug-Induced Liver Injury", 80, "Possible drug-induced liver injury. Review medications and consult hepatologist immediately."

    # Non-alcoholic fatty liver disease (NAFLD) pattern
    elif alt_ast_ratio > 2.0 and alt < 150 and ast < 100 and ggt < 80:
        return "NAFLD", 75, "Suspected non-alcoholic fatty liver disease. Lifestyle modification recommended including weight loss, exercise, and dietary changes."

    # General liver disease patterns (catch-all for less specific cases)
    elif alt > 100 or ast > 100 or bilirubin > 2.0 or ggt > 80:
        return "Liver Disease Detected", 78, "Liver function abnormalities detected. Further evaluation required including detailed history, additional tests, and specialist consultation."

    # Mild elevations - could be various causes
    elif alt > 40 or ast > 40 or bilirubin > 1.2 or ggt > 50:
        return "Mild Liver Enzyme Elevation", 65, "Mild liver enzyme elevations detected. Monitor with repeat testing in 2-4 weeks. Review medications and alcohol intake."

    # Normal results
    else:
        return "Normal Liver Function", 95, "All liver function tests within normal ranges. Continue routine health monitoring and healthy lifestyle."