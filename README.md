# 🧠 JobBot

JobBot is a smart, resume-aware job matching assistant designed to help job seekers tailor their applications to specific job descriptions. Built using React, Flask, and OpenAI APIs, JobBot compares a user's resume against job postings and provides AI-powered suggestions for improvement.

---

## ✨ Features

- 🔍 **Resume Analysis**
  - Upload your resume in PDF or DOCX format
  - Get AI-generated suggestions to improve your resume
  - Keyword matching, skill gap detection, and score breakdown

- 📄 **Job Description Parsing**
  - Paste job descriptions or extract them from URLs
  - Automatically identifies role responsibilities and required qualifications

- 🤝 **Compatibility Scoring**
  - Computes a compatibility score between your resume and the job posting
  - Highlights missing and matched keywords

- 🌙 **Modern UI**
  - Built with TailwindCSS + ShadCN components
  - Fully responsive and supports dark mode


## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/jobbot.git
cd jobbot
```

### 2. Install dependencies and Run! 
```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py  # Starts server at http://localhost:5317

cd ..
cd frontend
npm install
npm run dev
```

Note: you must also get an OpenRouter API key and add it in a .env file in the backend folder


