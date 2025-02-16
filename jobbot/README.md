# Job Data Extraction System

An automated job data extraction system that scrapes job postings from Indeed.com, summarizes job descriptions using AI, and generates structured Excel reports.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Contributing](#contributing)
- [License](#license)

## Features
- Automated extraction of job postings from Indeed.com
- Intelligent job description summarization using Hugging Face's BART model
- Regex-based fallback systems to ensure high data capture rates
- Scalable data pipeline that generates structured Excel reports
- Real-time scraping status updates through a responsive React frontend

## Technologies Used
- **Frontend**: 
  - React
  - Material-UI
- **Backend**: 
  - Flask
  - Python
  - Selenium
  - BeautifulSoup
  - Pandas
- **AI Integration**: 
  - Hugging Face API
- **Data Handling**: 
  - Excel (openpyxl)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/job-data-extraction.git
   cd job-data-extraction
   ```

2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Install the required Node.js packages for the frontend:
   ```bash
   cd frontend
   npm install
   ```

4. Set up your environment variables:
   - Create a `.env` file in the backend directory and add your Hugging Face API key:
     ```
     HUGGINGFACE_API_KEY=your_api_key_here
     ```

## Usage

1. Start the Flask backend server:
   ```bash
   cd backend
   python server.py
   ```

2. Start the React frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to access the application.

4. Enter the job links in the input box and click "SCRAPE AND SAVE!" to start the extraction process.

## API Integration

The application integrates with Hugging Face's BART model via their REST API for intelligent job summarization. The API is called during the scraping process to generate concise job descriptions.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
