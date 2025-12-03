# log_manager.py
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os
import pandas as pd

# --- This assumes your firebase-key.json is in the same folder ---
key_path = "firebase-key.json" 

if not os.path.exists(key_path):
    print("WARNING: 'firebase-key.json' not found. Logging will fail.")
else:
    if not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)

# Get the Firestore client
db = firestore.client()

def log_data(doc_type, extracted_data):
    """Logs the details of a processed document to Firestore."""
    try:
        total_amount = 0.0
        if "Total Amount" in extracted_data and extracted_data.get("Total Amount") is not None:
            try:
                total_amount = float(str(extracted_data["Total Amount"]).replace(",", ""))
            except (ValueError, TypeError):
                total_amount = 0.0

        log_entry = {
            'timestamp': datetime.now(),
            'doc_type': doc_type,
            'vendor_name': extracted_data.get('Vendor Name', 'N/A'),
            'total_amount': total_amount,
            'invoice_date': extracted_data.get('Invoice Date', 'N/A')
        }
        db.collection('processed_logs').add(log_entry)
        print(f"Successfully logged to Firestore: {log_entry['vendor_name']}")
        
    except Exception as e:
        print(f"Error logging to Firestore: {e}")

def get_log():
    """Reads all logs from Firestore for the dashboard."""
    try:
        docs = db.collection('processed_logs').stream()
        log_list = [doc.to_dict() for doc in docs]
        if not log_list:
            return pd.DataFrame()
        
        df = pd.DataFrame(log_list)
        
        # Data Cleaning
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce').fillna(0)
        return df
    except Exception as e:
        print(f"Error reading from Firestore: {e}")
        return pd.DataFrame()