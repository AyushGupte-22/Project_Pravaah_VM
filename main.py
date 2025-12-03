# main.py
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import core_functions
import log_manager
import queue_manager
import json
import os
import pandas as pd
from dotenv import load_dotenv
import google.generativeai as genai
import pytesseract
import firebase_admin
from firebase_admin import credentials

# --- CONFIGURATION ---
try:
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
except Exception:
    print("Tesseract not found.")

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("Google API Key not found in .env file.")
genai.configure(api_key=api_key)

# --- FIREBASE (Database only, for Auth & Logging) ---
key_path = "firebase-key.json"
if not os.path.exists(key_path):
    print("WARNING: 'firebase-key.json' not found. Logging will fail.")
else:
    if not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)

app = FastAPI(
    title="Project Pravaah API",
    description="Handles all document processing and risk analysis.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API ENDPOINTS ---

@app.post("/process-document/")
async def process_document_endpoint(file: UploadFile = File(...)):
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await file.read())

        extracted_text = core_functions.process_uploaded_file(temp_file_path)
        if not extracted_text:
            raise HTTPException(status_code=400, detail="OCR failed.")
        
        cleaned_text = core_functions.preprocess_text_for_amount(extracted_text)
        doc_type, confidence_score = core_functions.classify_document_with_confidence(cleaned_text)
        
        CONFIDENCE_THRESHOLD = 0.80
        
        response_data = {
            "filename": file.filename, "ocr_text": extracted_text,
            "doc_type": doc_type, "confidence": confidence_score,
            "status": "", "extracted_data": None,
            "validation_results": None, "risk_analysis": None
        }

        if confidence_score < CONFIDENCE_THRESHOLD:
            queue_manager.add_to_queue(
                filename=file.filename,
                doc_type_guess=doc_type,
                confidence=confidence_score
            )
            response_data["status"] = "Sent to Review Queue"
        
        else:
            response_data["status"] = "Processing Complete"
            
            # --- THIS IS THE CRITICAL SECTION ---
            json_string = core_functions.extract_data_with_gemini(cleaned_text, doc_type)
            
            # This 'try' block will catch the error if json_string is still bad
            try:
                data = json.loads(json_string) 
            except json.JSONDecodeError:
                print(f"CRITICAL: Failed to decode JSON from AI. String was: {json_string}")
                raise HTTPException(status_code=500, detail="AI failed to return valid JSON.")

            response_data["extracted_data"] = data
            
            validation_results = core_functions.validate_extracted_data(data)
            risk_analysis_result = core_functions.get_ai_risk_analysis(data)
            response_data["validation_results"] = validation_results
            response_data["risk_analysis"] = risk_analysis_result
            
            log_manager.log_data(doc_type, data) # Log to Firestore

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/review-document/")
async def review_document_endpoint(
    file: UploadFile = File(...),
    correct_doc_type: str = File(...),
    filename_to_remove: str = File(...)
):
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        extracted_text = core_functions.process_uploaded_file(temp_file_path)
        if not extracted_text:
            raise HTTPException(status_code=400, detail="OCR failed.")
        
        cleaned_text = core_functions.preprocess_text_for_amount(extracted_text)
        data = json.loads(core_functions.extract_data_with_gemini(cleaned_text, correct_doc_type))
        
        log_manager.log_data(correct_doc_type, data)
        queue_manager.remove_from_queue(filename_to_remove)
        
        return {"status": "success", "extracted_data": data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/dashboard-data/")
def get_dashboard_data():
    df = log_manager.get_log() # Reads from Firestore
    if df.empty: return {"kpis": {}, "charts": {}}
    kpis = {"total_docs": int(len(df)), "total_invoices": int(df[df['doc_type'] == 'Invoice'].shape[0]), "total_value": float(df['total_amount'].sum())}
    doc_type_counts = df['doc_type'].value_counts()
    vendor_totals = df.groupby('vendor_name')['total_amount'].sum().nlargest(5)
    charts = {"doc_distribution": doc_type_counts.to_dict(), "top_vendors": vendor_totals.to_dict()}
    return {"kpis": kpis, "charts": charts}

@app.get("/review-queue/")
def get_review_queue():
    df = queue_manager.get_queue() # Reads from CSV
    return df.to_dict(orient="records")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)