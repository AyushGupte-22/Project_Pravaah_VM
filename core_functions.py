# core_functions.py
from PIL import Image
import pytesseract
import fitz  # PyMuPDF
import google.generativeai as genai
import re
from datetime import datetime

# --- 1. OCR AND PRE-PROCESSING ---

def process_uploaded_file(file_path):
    """
    Processes a file from a local path (PDF or Image) and returns the extracted text.
    """
    full_text = ""
    try:
        if file_path.lower().endswith('.pdf'):
            doc = fitz.open(file_path)
            for page in doc:
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                full_text += pytesseract.image_to_string(img) + "\n"
        else:
            image = Image.open(file_path)
            full_text = pytesseract.image_to_string(image)
        return full_text
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        raise Exception(f"OCR Error: {e}")

def preprocess_text_for_amount(text):
    """
    Uses RegEx to find and clean the total amount line from OCR'd text.
    """
    pattern = re.compile(r'(?i)(total|amount|total amount|net amount)[\s:₹]*([\d,]+\.\d{2})')
    match = pattern.search(text)
    if match:
        amount_value = match.group(2)
        clean_line = f"\nTOTAL AMOUNT: {amount_value}\n"
        return text + clean_line
    return text

# --- 2. AI CLASSIFICATION ---

def classify_document_with_confidence(text):
    """
    Simulates a classifier that returns a document type and a confidence score.
    """
    text_lower = text.lower()
    if "invoice number" in text_lower and "total amount" in text_lower: return "Invoice", 0.98
    if "claim form" in text_lower and "policy number" in text_lower: return "Claim Form", 0.97
    if "inspection report" in text_lower and "vehicle details" in text_lower: return "Inspection Report", 0.96
    if "invoice" in text_lower or "bill" in text_lower: return "Invoice", 0.85
    if "claim" in text_lower: return "Claim Form", 0.82
    if "inspection report" in text_lower or "vehicle inspection" in text_lower: return "Inspection Report", 0.86
    return "Unknown Document", 0.40

# --- 3. AI EXTRACTION (WITH THE FIX) ---

def extract_data_with_gemini(text, doc_type):
    """
    Uses Google Gemini to extract structured data based on the document type.
    """
    prompt = ""
    if doc_type == "Invoice":
        prompt = f"""
        You are a highly efficient data extraction robot. Your only function is to extract information from the text below and return it as a JSON object.
        Do not include any conversational text, preamble, or markdown formatting.
        
        From the following invoice text, extract these fields:
        - Invoice Number
        - Vendor Name
        - Invoice Date (in YYYY-MM-DD format if possible)
        - Total Amount (as a number, no currency symbols). IMPORTANT: Search for a labeled 'Total Amount'. If you cannot find one, search for the largest clear monetary value. If no clear value can be found, you MUST return `null`. Do not invent a number.
        - GSTIN (if present)

        Text:
        ---
        {text}
        ---
        """
    elif doc_type == "Inspection Report":
        prompt = f"""
        You are a data extraction robot. Extract the following from the inspection report.
        Return ONLY a JSON object. Use `null` for missing fields.

        - Report ID
        - Policy Number
        - Make
        - Model
        - Registration No
        - VIN
        - Damages Observed (as a list of strings)

        Text:
        ---
        {text}
        ---
        """
    else:
        # For "Claim Form" or "Unknown Document", return an empty JSON.
        return "{}"

    try:
        model = genai.GenerativeModel('models/gemini-pro-latest')
        generation_config = genai.types.GenerationConfig(temperature=0)
        response = model.generate_content(prompt, generation_config=generation_config)
        
        # --- THIS IS THE FIX ---
        # Clean the AI's response to remove markdown fences
        raw_text = response.text
        if not raw_text:
            return '{"error": "AI returned an empty response."}'
        
        # Strip leading/trailing whitespace, then remove the markdown tags
        cleaned_text = raw_text.strip().replace("```json", "").replace("```", "")
        
        return cleaned_text
        # --- END OF FIX ---
        
    except Exception as e:
        print(f"AI API Error: {e}")
        raise Exception(f"Gemini API Error: {e}")

# --- 4. AI VALIDATION & RISK ANALYSIS ---

def validate_extracted_data(data):
    """
    Applies business rules to validate the extracted data from an invoice.
    """
    validation_results = {}
    if not data: return validation_results
    if "GSTIN" in data and data.get("GSTIN"):
        gstin_pattern = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
        if re.match(gstin_pattern, str(data["GSTIN"])): validation_results["GSTIN Format"] = "✅ OK"
        else: validation_results["GSTIN Format"] = "❌ Invalid"
    if "Total Amount" in data and data.get("Total Amount") is not None:
        try:
            amount_str = str(data["Total Amount"]).replace("₹", "").replace("Rs.", "").replace(",", "").strip()
            amount = float(amount_str)
            if 0 < amount < 1000000: validation_results["Amount Sanity Check"] = "✅ OK"
            else: validation_results["Amount Sanity Check"] = "❌ Amount seems unusually high or low."
        except (ValueError, TypeError): validation_results["Amount Sanity Check"] = "⚠️ Could not parse amount."
    return validation_results

def get_ai_risk_analysis(data):
    """
    Uses Gemini to perform a contextual risk analysis on the invoice amount.
    """
    if "Total Amount" not in data or "Vendor Name" not in data or data.get("Total Amount") is None:
        return "N/A - Insufficient data for analysis."
    try:
        amount_str = str(data["Total Amount"]).replace(",", "")
        amount = float(amount_str)
        vendor = data["Vendor Name"]

        prompt = f"""
        Analyze the following invoice data for financial risk. Your entire response must be one of three labels, followed by a single-sentence justification. Do not add any conversational text.

        - Invoice Vendor: "{vendor}"
        - Invoice Amount: ₹ {amount:,.2f}
        - Location Context: Nagpur, India

        Based on these details, assess the risk of the amount being unreasonable.

        Choose one of these three labels for your entire output:
        - ✅ Reasonable
        - ⚠️ Suspiciously High
        - ❓ Potentially Low
        """
        model = genai.GenerativeModel('models/gemini-pro-latest')
        generation_config = genai.types.GenerationConfig(temperature=0)
        response = model.generate_content(prompt, generation_config=generation_config)
        return response.text.strip()
    except (ValueError, TypeError, Exception) as e:
        print(f"Error during AI analysis: {e}")
        return "Error: Could not perform AI analysis."