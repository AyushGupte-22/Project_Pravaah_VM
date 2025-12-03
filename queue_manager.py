# queue_manager.py
import pandas as pd
import os

QUEUE_FILE = 'review_queue.csv'
QUEUE_COLUMNS = ['filename', 'ai_guess', 'confidence'] # Removed file_url

def add_to_queue(filename, doc_type_guess, confidence):
    """Adds a new document to the review queue CSV."""
    try:
        new_item = pd.DataFrame([{
            'filename': filename,
            'ai_guess': doc_type_guess,
            'confidence': f"{confidence:.0%}"
        }])
        
        if not os.path.exists(QUEUE_FILE):
            new_item.to_csv(QUEUE_FILE, index=False)
        else:
            new_item.to_csv(QUEUE_FILE, mode='a', header=False, index=False)
        
        print(f"Successfully added to queue: {filename}")
        
    except Exception as e:
        print(f"Error adding to queue CSV: {e}")

def get_queue():
    """Reads the review queue CSV into a DataFrame."""
    if not os.path.exists(QUEUE_FILE):
        return pd.DataFrame(columns=QUEUE_COLUMNS)
    
    try:
        df = pd.read_csv(QUEUE_FILE)
        # Ensure correct columns even if file is empty
        if df.empty:
            return pd.DataFrame(columns=QUEUE_COLUMNS)
        return df
    except pd.errors.EmptyDataError:
        return pd.DataFrame(columns=QUEUE_COLUMNS)
    except Exception as e:
        print(f"Error reading queue CSV: {e}")
        return pd.DataFrame() 

def remove_from_queue(filename_to_remove):
    """Removes a document from the queue after it's been reviewed."""
    if os.path.exists(QUEUE_FILE):
        try:
            df = pd.read_csv(QUEUE_FILE)
            df = df[df['filename'] != filename_to_remove]
            df.to_csv(QUEUE_FILE, index=False)
            print(f"Successfully removed from queue: {filename_to_remove}")
        except Exception as e:
            print(f"Error removing from queue CSV: {e}")