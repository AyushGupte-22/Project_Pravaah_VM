# 🚀 Project Pravaah: Cognitive Document Processing Engine

Project **Pravaah** is an enterprise-grade, AI-powered platform that automates the processing of complex insurance documents. It transforms traditional manual workflows into a secure, intelligent, and scalable document-processing ecosystem using **Generative AI**.

## 🌟 Key Features

### 📄 Cognitive Document Pipeline
- Automatically ingests PDFs and images.
- Performs OCR → classification → entity extraction.
- Handles unstructured and semi-structured documents with precision.

### 🧠 AI Risk Analysis
- AI functions as a **Risk Analyst** to detect anomalies.
- Flags suspicious claim values, mismatched repair costs, and potential fraud.
- Confidence scoring built-in for automated routing.

### ✅ Human-in-the-Loop Review
- Documents with low AI confidence scores move to a **Review Queue**.
- Experts validate, override, and correct AI output.
- Improves model precision over time.

### 📊 Real-Time Analytics Dashboard
- Built on Firestore for real-time updates.
- Tracks:
  - Total claims processed
  - Value & volume trends
  - Vendor-wise performance
  - System efficiency metrics

### 🔒 Enterprise-Grade Security
- **Firebase Authentication + Role-Based Access**
- Secure API communication (HTTPS)
- Access control for Admin, Reviewer, Supervisor, and Viewer roles

## 🛠️ Tech Stack

### **Frontend**
- Next.js 14 (React + TypeScript)
- Material UI (MUI)
- Recharts
- Axios

### **Backend**
- FastAPI (Python)
- Google Gemini Pro
- Tesseract OCR + PyMuPDF
- Firebase Firestore + Auth

## 🚀 Getting Started

### 🔧 Prerequisites
- Node.js + npm
- Python 3.9+
- Tesseract OCR
- Google Gemini API Key
- Firebase Service Account (`firebase-key.json`)

## 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/project-pravaah.git
cd project-pravaah
```

## 2️⃣ Backend Setup
```bash
cd project_pravaah_backend
python -m venv venv

# Windows
.env\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Add `.env` file:
```
GOOGLE_API_KEY=your_gemini_api_key
```

Add your `firebase-key.json`.

## 3️⃣ Frontend Setup
```bash
cd ../project_pravaah_frontend
npm install
```

Update Firebase config:
```
src/app/firebaseConfig.ts
```

## 4️⃣ Run the Application

### ▶️ Backend
```bash
uvicorn main:app --reload
```

### ▶️ Frontend
```bash
npm run dev
```

App URL: **http://localhost:3000**  
API URL: **http://127.0.0.1:8000**

## 📸 Screenshots
```
/screenshots
 ├── dashboard.png
 ├── upload_page.png
 └── review_queue.png
```

## 🧩 Architecture (High-Level)
```
User → Next.js UI → FastAPI Backend → Gemini Pro (AI)
                                    ↘
                                      Firebase (Auth + Firestore)
OCR Engine → Tesseract + PyMuPDF
```

## 👤 Author
Built by **Ayush Gupte** 
        **Aman Tiwari**
        **Ayush Warulkar**

## 🤝 Contributing
Pull requests are welcome.

## 📄 License
MIT License © 2025
