# JobBot - AI-Powered Job Application Assistant

JobBot is a web application that helps job seekers streamline their job application process by analyzing job postings and optimizing resumes with AI-powered suggestions.

## Features

- **Job Posting Analysis**: Upload or paste job descriptions to extract key requirements, responsibilities, and skills
- **Resume Analysis**: Compare your resume against job requirements to identify gaps and areas for improvement
- **Resume Editor**: Edit your resume with AI-powered suggestions tailored to specific job requirements
- **Export Options**: Download your optimized resume as DOCX or PDF

## New Feature: Resume Editor

The new Resume Editor feature allows users to:

1. Upload their existing resume in DOCX format
2. Edit the resume directly in the browser with a WYSIWYG editor
3. Receive AI-powered suggestions based on job requirements
4. Accept or reject suggestions with a single click
5. Export the optimized resume in DOCX or PDF format

## Technologies Used

### Frontend
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Backend
- Flask (Python)
- OpenAI API
- Mammoth.js for DOCX parsing
- python-docx for DOCX generation

## Project Structure

```
jobbot/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service functions
│   │   └── ...
│   └── ...
├── backend/                 # Flask backend
│   ├── server.py            # Main API endpoints
│   ├── resumeEditor.py      # Resume editor API endpoints
│   ├── aiSummary.py         # AI integration
│   └── scraper.py           # Job posting scraper
└── ...
```

## Setup and Installation

### Backend

1. Clone the repository
2. Navigate to the backend directory
3. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```
   pip install flask flask-cors openai python-docx mammoth PyPDF2 reportlab
   ```
5. Set up environment variables (create a `.env` file in the backend directory):
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```
6. Update server.py with the resume editor routes (see instructions in resumeEditor.py)
7. Start the Flask server:
   ```
   python server.py
   ```

### Frontend

1. Navigate to the frontend directory
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Access the application at http://localhost:5173

## Backend Implementation Details

To fully implement the resume editor functionality, you need to:

1. Install additional dependencies:
   ```
   pip install python-docx mammoth reportlab
   ```

2. Add the routes from resumeEditor.py to server.py
3. For full DOCX formatting preservation, you may need a more sophisticated HTML-to-DOCX converter

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 