#!/usr/bin/env python3
"""
Test script to verify all 6 XGBoost models can be loaded successfully.
This ensures compatibility with the current environment before implementing DiagnosisEngine.
"""

import os
import sys
import joblib
import pandas as pd
import numpy as np

def test_model_loading():
    """Test loading all 6 models and return success status."""
    model_dir = os.path.dirname(__file__)

    models_to_test = [
        'gate_model.pkl',
        'cancer_model.pkl',
        'fatty_liver_model.pkl',
        'hepatitis_stage.pkl',
        'hepatitis_complications.pkl',
        'hepatitis_status.pkl'
    ]

    loaded_models = {}
    failed_models = []

    print("Testing model loading...")
    print("=" * 50)

    for model_name in models_to_test:
        model_path = os.path.join(model_dir, model_name)
        try:
            print(f"Loading {model_name}...")
            model = joblib.load(model_path)
            loaded_models[model_name] = model
            print(f"[OK] {model_name} loaded successfully")
        except Exception as e:
            print(f"[FAIL] Failed to load {model_name}: {str(e)}")
            failed_models.append((model_name, str(e)))

    print("=" * 50)
    print(f"Loaded {len(loaded_models)} out of {len(models_to_test)} models")

    if failed_models:
        print("\nFailed models:")
        for name, error in failed_models:
            print(f"  - {name}: {error}")
        return False, loaded_models

    print("All models loaded successfully!")
    return True, loaded_models

def test_basic_predictions(loaded_models):
    """Test basic predictions with dummy data to ensure models work."""
    print("\nTesting basic predictions...")
    print("=" * 50)

    # Dummy data for testing (will be replaced with proper mappings later)
    dummy_data = pd.DataFrame({
        'feature1': [1.0],
        'feature2': [2.0],
        'feature3': [3.0]
    })

    success = True

    for model_name, model in loaded_models.items():
        try:
            print(f"Testing prediction for {model_name}...")
            if hasattr(model, 'predict'):
                pred = model.predict(dummy_data)
                print(f"[OK] {model_name} prediction successful: {pred}")
            else:
                print(f"[FAIL] {model_name} has no predict method")
                success = False
        except Exception as e:
            print(f"[FAIL] {model_name} prediction failed: {str(e)}")
            success = False

    return success

if __name__ == "__main__":
    print("Model Compatibility Test")
    print("Current environment:")
    try:
        import sklearn
        import xgboost
        print(f"  scikit-learn: {sklearn.__version__}")
        print(f"  XGBoost: {xgboost.__version__}")
        print(f"  pandas: {pd.__version__}")
        print(f"  numpy: {np.__version__}")
        print(f"  joblib: {joblib.__version__}")
    except ImportError as e:
        print(f"Import error: {e}")
        sys.exit(1)

    print()

    # Test loading
    load_success, loaded_models = test_model_loading()

    if not load_success:
        print("\n[ERROR] Model loading failed. Please check version compatibility.")
        sys.exit(1)

    # Skip prediction testing for now - will be tested with proper data in DiagnosisEngine
    print("\n[INFO] Skipping prediction tests (dummy data). Models loaded successfully.")
    print("\n[SUCCESS] All models loaded! Ready for DiagnosisEngine implementation.")