import re 
import os 
import pandas as pd
import time

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
from openpyxl.styles import Alignment

# for the summarizer 
import requests
import os
from dotenv import load_dotenv
import json 


WORDS_TO_FILTER = [
    "Home",
    "Company reviews",
    "Salary guide",
    "Employers",
    "Create your resume",
    "Resume services",
    "Change country",
    "Help",
    "Privacy Centre",
    "Part-time",
    "Full-time",
    "Hiring Lab",
    "Career advice",
    "Browse jobs",
    "Browse companies",
    "Salaries",
    "Indeed Events",
    "Work at Indeed",
    "Countries",
    "About",
    "Help",
    "ESG at Indeed",
    "© 2025 Indeed",
    "Accessibility at Indeed",
    "Privacy Centre and Ad Choices",
    "Terms"
]

def configure_driver():
    options = webdriver.ChromeOptions()
    
    # Canadian specific user agent
    options.add_argument(f'user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Additional headers for Canadian Indeed
    options.add_argument('--lang=en-CA,en')
    options.add_argument('--accept-language=en-CA,en;q=0.9')
    
    # Standard stealth options
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--disable-notifications')
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
    
    # Additional stealth
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def summarize(soup): 
    try:
        load_dotenv() 
        api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not api_key:
            print("Error: HUGGINGFACE_API_KEY environment variable is not set")
            return "No summary available - API key missing"
        
        API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
        headers = {"Authorization": f"Bearer {api_key}"}

        content = soup.get_text()
        
        # Debug print statements
        print(f"Content length: {len(content)}")
        print("API Key present:", bool(api_key))
        print("API URL:", API_URL)

        text_to_summarize = f"Summarize this job posting with key details. User proper punctuation. The following is the content you are to summarize: {content[:3000]}"

        data = {
            "inputs": text_to_summarize,
            "parameters": {
                "min_length": 30,
                "max_length": 100,
                "temperature": 0.3,
                "top_p": 0.9,
            }
        }

        print("Sending request to API...")
        print("Request headers:", headers)
        print("Request data length:", len(str(data)))
        
        response = requests.post(API_URL, headers=headers, json=data, timeout=300)
        
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response content: {response.text[:500]}")  # First 500 chars of response

        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and result[0].get("summary_text"):
                return result[0]["summary_text"]
            else:
                print(f"Unexpected response format: {result}")
                return "No summary available - unexpected response format"
        else:
            error_message = f"API Error: Status {response.status_code}"
            try:
                error_details = response.json()
                error_message += f", Details: {error_details}"
            except:
                error_message += f", Raw response: {response.text}"
            print(error_message)
            return "No summary available - " + error_message

    except requests.exceptions.RequestException as e:
        print(f"Request error: {str(e)}")
        return f"No summary available - request error: {str(e)}"
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return f"No summary available - unexpected error: {str(e)}"
    

def extract_from_summary(summary):
    """Extract job details from the summary when primary scraping fails"""
    info = {
        'title': None,
        'company': None,
        'salary': None
    }
    
    # Look for salary patterns including "from" and "per hour" formats
    salary_pattern = r'(?:From |starting at )?\$[\d,]+(?:\.?\d{2})?(?:\s*-\s*\$[\d,]+(?:\.?\d{2})?)?(?:\s*(?:per hour|an hour))?'
    salary_match = re.search(salary_pattern, summary)
    if salary_match:
        info['salary'] = salary_match.group(0)
    
    # Look for job title at the start of summary or after specific phrases
    title_pattern = r'(?:^|\bis looking for |seeking |hiring )(?:a |an )?([A-Z][A-Za-z\s-]+?)(?=\s+to|\s+who|\s+that|\s+in|\s+at|\s+with|\.|,)'
    title_match = re.search(title_pattern, summary)
    if title_match:
        info['title'] = title_match.group(1).strip()
    
    # Look for company name patterns
    company_pattern = r'(?:at|for|with|join)\s+([A-Z][A-Za-z\s&.-]+?)(?=\s+to|\s+is|\s+in|\s+seeks|\s+requires|\s+team|\.|,)'
    company_match = re.search(company_pattern, summary)
    if company_match:
        info['company'] = company_match.group(1).strip()
    
    return info

def scrape(url):
    driver = None
    try:
        print(f"\nStarting scrape for URL: {url}")
        driver = configure_driver()
        
        print("Driver configured, loading page...")
        driver.get(url)
        time.sleep(3)  # Short initial wait
        
        # Wait for the main content to load
        if "indeed.com" not in driver.current_url:
            print("⚠️ Redirect detected - waiting for page to stabilize...")
            time.sleep(2)
            
        soup = BeautifulSoup(driver.page_source, "html.parser")
        
        # Look for specific Canadian Indeed elements
        job_title = "Unknown Title"
        title_element = soup.find('h1', {'data-testid': 'jobsearch-JobInfoHeader-title'})
        if title_element:
            job_title = title_element.text.strip()
            print(f"✅ Found job title: {job_title}")
        else:
            print("❌ Could not find job title")
            
        company = "unknown"
        company_element = soup.find('div', {'data-testid': 'inlineHeader-companyName'})
        if company_element and company_element.find('a'):
            company = company_element.find('a').get_text(strip=True)
            print(f"✅ Found company: {company}")
        else:
            print("❌ Could not find company")
            
        location = "Unknown Location"
        location_element = soup.find('div', {'data-testid': 'inlineHeader-companyLocation'})
        if location_element:
            location = location_element.get_text(strip=True)
            print(f"✅ Found location: {location}")
        else:
            print("❌ Could not find location")
            
        description = ""
        description_div = soup.find('div', {'id': 'jobDescriptionText'})
        if description_div:
            description = description_div.get_text(strip=True)
            print(f"✅ Found description (length: {len(description)})")
        else:
            print("❌ Could not find description")
            
        # Create job data dictionary
        job_data = {
            "Job Title": [job_title],
            "Company": [company],
            "Location": [location],
            "Salary": ["unknown"],  # Simplified salary handling for now
            "Description": [description],
            "Responsibilities, Qualifications and/or Benefits": [""],
            "url": [url]
        }
        
        print("\nScraping completed successfully!")
        
        df = pd.DataFrame(job_data)
        save_csv(df, company, job_title)
        return df
        
    except Exception as e:
        print(f"❌ Error during scraping: {str(e)}")
        raise
    finally:
        if driver:
            driver.quit()
            print("Driver closed")

def save_csv(df, company, title): 

    # eventually can get user to prompt where to save to 
    def path_to_file(): 
        home_dir = os.path.expanduser("~")
        file_path = os.path.join(home_dir, "Desktop/jobs.xlsx")
        return file_path

    # Handling no company or title 
    if not company:
        company = "Unknown_Company"
    if not title:
        title = "Unknown_Title"

    file_path = path_to_file() # gets the file path 

    if os.path.exists(file_path):
        existing_df = pd.read_excel(file_path)
        combined_df = pd.concat([existing_df, df])
    else: 
        combined_df = df 

    #2 write the combined dataframe back to excel 
    combined_df.to_excel(file_path, index=False)
    # Save the DataFrame to an Excel file
    try:
        workbook = load_workbook(file_path)
        sheet = workbook.active

        for column_index, column_cells in enumerate(sheet.columns, start=1):
            max_length = 0
            column_letter = get_column_letter(column_index)
            column_name = sheet.cell(row=1, column=column_index).value  # Get the column name

            for cell in column_cells:
                if cell.value:
                    cell_value = str(cell.value)
                    max_length = max(max_length, len(cell_value))
                     
                # Enable text wrapping for all cells
                cell.alignment = Alignment(wrap_text=True)

            # Set specific widths for each column type
            if column_name == "Description":
                sheet.column_dimensions[column_letter].width = 50
            elif column_name == "Responsibilities, Qualifications and/or Benefits":
                sheet.column_dimensions[column_letter].width = 50
            elif column_name == "Summary":
                sheet.column_dimensions[column_letter].width = 35  # Reduced from default
            elif column_name == "Job Title":
                sheet.column_dimensions[column_letter].width = 15
            elif column_name in ["Company", "Location", "Salary"]:
                sheet.column_dimensions[column_letter].width = 15
            elif column_name == "url":
                sheet.column_dimensions[column_letter].width = 20
            else:
                adjusted_width = max_length + 2  # add padding
                sheet.column_dimensions[column_letter].width = adjusted_width
        # Save the formatted Excel file
        workbook.save(file_path)
        print(f"File saved successfully with formatting to {file_path}")
    except Exception as e:
        print(f"Error saving file: {e}")

    
    
