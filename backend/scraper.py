import re 
import os 
import time
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

def configure_driver():
    """Configure and return a Selenium Chrome driver with anti-detection settings"""
    try:
        options = webdriver.ChromeOptions()
        options.add_argument(f'user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        options.add_argument('--lang=en-CA,en')
        options.add_argument('--accept-language=en-CA,en;q=0.9')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-notifications')
        options.add_experimental_option('excludeSwitches', ['enable-automation'])
        options.add_experimental_option('useAutomationExtension', False)
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        # Try headless first, but if it fails we'll try again with headless disabled
        options.add_argument('--headless=new')  # Use the newer headless mode
        
        # Add these options to prevent common Chrome issues
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-software-rasterizer')
        options.add_argument('--remote-debugging-port=9222')
        
        print("Setting up Chrome WebDriver...")
        
        try:
            # Try with ChromeDriverManager first
            driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
        except Exception as driver_error:
            print(f"Error using ChromeDriverManager: {str(driver_error)}")
            
            # If that fails, try direct path (common locations)
            try:
                print("Trying direct ChromeDriver path...")
                import platform
                system = platform.system()
                
                if system == "Darwin":  # macOS
                    driver_path = "/usr/local/bin/chromedriver"
                elif system == "Linux":
                    driver_path = "/usr/bin/chromedriver"
                else:  # Windows
                    driver_path = "C:\\Program Files\\chromedriver.exe"
                
                driver = webdriver.Chrome(service=ChromeService(driver_path), options=options)
            except Exception as path_error:
                print(f"Error using direct path: {str(path_error)}")
                
                # Try one more time without headless mode
                print("Trying without headless mode...")
                options.remove_argument('--headless=new')
                options.add_argument('--window-size=1200,800')
                
                try:
                    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
                except Exception as final_error:
                    print(f"All Chrome WebDriver attempts failed: {str(final_error)}")
                    raise Exception("Failed to initialize Chrome WebDriver after multiple attempts")
        
        # Set up anti-detection script
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        print("Chrome WebDriver initialized successfully")
        return driver
    except Exception as e:
        print(f"Fatal error in configure_driver: {str(e)}")
        raise

def analyze_with_gemini(url, page_content):
    """
    Complete fallback using Gemini API to analyze the job posting
    Returns a structured job data dictionary
    """
    from aiSummary import client
    
    try:
        # Create a system prompt to extract structured data
        system_prompt = """
        You are an expert job posting analyzer. Given a job posting,
        extract the following information and format it as a JSON object:
        
        {
          "title": "job title",
          "company": "company name",
          "location": "job location",
          "salary": "salary if mentioned",
          "requirements": ["list of requirements"],
          "responsibilities": ["list of responsibilities"],
          "keywords": ["important skills and keywords"]
        }
        
        Ensure all arrays contain at least 3-5 items. Be concise but accurate.
        """
        
        # Format the user prompt with the job information
        user_prompt = f"""
        Here is a job posting from {url}:
        
        {page_content}
        
        Please analyze this job posting and extract the structured information.
        """
        
        # Call Gemini API
        response = client.chat.completions.create(
            model="google/gemini-2.0-flash-lite-001",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
        )
        
        # Parse the response
        result = json.loads(response.choices[0].message.content)
        print("Successfully analyzed job with Gemini API")
        return result
    except Exception as e:
        print(f"Error analyzing with Gemini API: {str(e)}")
        # Return a basic job data structure
        return {
            "title": "Job Title (Error in analysis)",
            "company": "Company",
            "location": "Location",
            "salary": "Not specified",
            "description": page_content[:500] + "..." if len(page_content) > 500 else page_content,
            "requirements": ["Unable to extract requirements automatically."],
            "responsibilities": ["Unable to extract responsibilities automatically."],
            "keywords": ["Skills", "Experience"]
        }

def scrape_job_posting(url):
    """
    Scrape a job posting from the given URL and return the structured data
    Returns a dictionary with job details
    """
    driver = None
    try:
        print(f"Scraping job posting from: {url}")
        
        # First, try with Selenium
        try:
            driver = configure_driver()
            driver.get(url)
            time.sleep(3)  # Wait for page to load
            
            soup = BeautifulSoup(driver.page_source, "html.parser")
            page_content = soup.get_text()
        except Exception as selenium_error:
            print(f"Selenium error: {str(selenium_error)}")
            print("Falling back to requests library...")
            
            # Fall back to requests if Selenium fails
            soup = fetch_with_requests(url)
            if soup is None:
                raise Exception("Failed to fetch page with both Selenium and requests")
            
            page_content = soup.get_text()
        
        # Job posting data dictionary
        job_data = {
            "title": "Unknown Title",
            "company": "Unknown Company",
            "location": "Unknown Location",
            "salary": "Not specified",
            "description": "",
            "requirements": [],
            "responsibilities": [],
            "keywords": []
        }
        
        # Extract job details based on common patterns across job sites
        # Try to get the job title
        title_candidates = [
            soup.find('h1', {'data-testid': 'jobsearch-JobInfoHeader-title'}),  # Indeed
            soup.find('h1', {'class': 'top-card-layout__title'}),  # LinkedIn
            soup.find('h1', {'class': 'jobsearch-JobInfoHeader-title'}),  # Indeed alternative
            soup.find('h1'),  # Generic fallback
        ]
        
        for candidate in title_candidates:
            if candidate and candidate.text.strip():
                job_data["title"] = candidate.text.strip()
                break
        
        # Try to get the company name
        company_candidates = [
            soup.find('div', {'data-testid': 'inlineHeader-companyName'}),  # Indeed
            soup.find('a', {'class': 'topcard__org-name-link'}),  # LinkedIn
            soup.find('div', {'class': 'company-name'}),  # Generic
            soup.find('div', {'class': 'JobInfoHeader-company-location'}),  # Alternative
        ]
        
        for candidate in company_candidates:
            if candidate:
                if candidate.find('a'):
                    job_data["company"] = candidate.find('a').get_text(strip=True)
                    break
                elif candidate.text.strip():
                    job_data["company"] = candidate.text.strip()
                    break
        
        # Try to get the location
        location_candidates = [
            soup.find('div', {'data-testid': 'inlineHeader-companyLocation'}),  # Indeed
            soup.find('span', {'class': 'topcard__flavor--bullet'}),  # LinkedIn
            soup.find('div', {'class': 'location'}),  # Generic
        ]
        
        for candidate in location_candidates:
            if candidate and candidate.text.strip():
                job_data["location"] = candidate.text.strip()
                break
        
        # Try to get the job description
        description_candidates = [
            soup.find('div', {'id': 'jobDescriptionText'}),  # Indeed
            soup.find('div', {'class': 'description__text'}),  # LinkedIn
            soup.find('div', {'class': 'jobDetailsHeader-descriptionDetails'}),  # Other
        ]
        
        description_text = ""
        for candidate in description_candidates:
            if candidate:
                description_text = candidate.get_text(strip=True)
                if description_text:
                    job_data["description"] = description_text
                    break
        
        # If we couldn't get a proper description, use the full page text
        if not job_data["description"] and page_content:
            print("Using full page content as description")
            # Take first 5000 characters as description to avoid overwhelming the AI
            job_data["description"] = page_content[:5000] + "..." if len(page_content) > 5000 else page_content
        
        # For salary, we'll use regex to search in the full text
        salary_pattern = r'\$[\d,.]+\s*(?:to|–|-)\s*\$[\d,.]+|\$[\d,.]+\s*(?:per|an?|/)\s*(?:hour|year|month|annum|yr)'
        salary_match = re.search(salary_pattern, str(soup))
        if salary_match:
            job_data["salary"] = salary_match.group(0)
        
        # Extract full page text for parsing requirements and responsibilities
        full_text = soup.get_text()
        
        # Look for requirements sections
        requirements_section = None
        for section in ["Requirements", "Qualifications", "What You'll Need", "Skills"]:
            pattern = re.compile(f"{section}:?.*?(?=\n\n|\Z)", re.DOTALL | re.IGNORECASE)
            match = pattern.search(full_text)
            if match:
                requirements_section = match.group(0)
                break
        
        if requirements_section:
            # Extract bullet points or numbered items
            requirements = re.findall(r'[•\-\*\d+\.]\s*(.*?)(?=\n[•\-\*\d+\.]|\Z)', requirements_section)
            if requirements:
                job_data["requirements"] = [req.strip() for req in requirements if req.strip()]
        
        # Look for responsibilities sections
        responsibilities_section = None
        for section in ["Responsibilities", "Duties", "What You'll Do", "The Role"]:
            pattern = re.compile(f"{section}:?.*?(?=\n\n|\Z)", re.DOTALL | re.IGNORECASE)
            match = pattern.search(full_text)
            if match:
                responsibilities_section = match.group(0)
                break
        
        if responsibilities_section:
            # Extract bullet points or numbered items
            responsibilities = re.findall(r'[•\-\*\d+\.]\s*(.*?)(?=\n[•\-\*\d+\.]|\Z)', responsibilities_section)
            if responsibilities:
                job_data["responsibilities"] = [resp.strip() for resp in responsibilities if resp.strip()]
        
        # Extract keywords/skills from description
        common_skills = [
            "Python", "Java", "JavaScript", "HTML", "CSS", "SQL", "React", "Angular",
            "Node.js", "PHP", "C#", "C++", "Ruby", "Swift", "Kotlin", "AWS", "Azure",
            "Docker", "Kubernetes", "Excel", "Word", "PowerPoint", "Tableau", "Power BI",
            "Agile", "Scrum", "Project Management", "Marketing", "Sales", "Communication",
            "Leadership", "Management", "Customer Service", "Accounting", "Finance"
        ]
        
        keywords = []
        for skill in common_skills:
            if re.search(r'\b' + re.escape(skill) + r'\b', full_text, re.IGNORECASE):
                keywords.append(skill)
        
        job_data["keywords"] = keywords
        
        # Check if we got meaningful data from scraping
        if (job_data["title"] == "Unknown Title" or 
            job_data["company"] == "Unknown Company" or 
            not job_data["requirements"] or 
            not job_data["responsibilities"]):
            
            print("Scraping didn't yield complete results, using Gemini API as complete fallback...")
            # Ensure we have at least a partial description to send to the API
            if not job_data["description"] and page_content:
                job_data["description"] = page_content[:5000] + "..." if len(page_content) > 5000 else page_content
                
            gemini_data = analyze_with_gemini(url, job_data["description"])
            
            # Fill in missing data
            for key in gemini_data:
                if key in job_data:
                    if isinstance(job_data[key], list) and len(job_data[key]) == 0:
                        job_data[key] = gemini_data[key]
                    elif isinstance(job_data[key], str) and (not job_data[key] or job_data[key] in ["Unknown Title", "Unknown Company", "Unknown Location", "Not specified"]):
                        job_data[key] = gemini_data[key]
        
        return job_data
        
    except Exception as e:
        print(f"Error in primary scraping: {str(e)}")
        
        # Complete fallback: try to at least get the page content and use Gemini
        try:
            page_content = ""
            
            # Try to get content from Selenium if driver exists
            if driver:
                try:
                    page_content = BeautifulSoup(driver.page_source, "html.parser").get_text()
                except:
                    pass
            
            # If we couldn't get content from Selenium, try requests
            if not page_content:
                soup = fetch_with_requests(url)
                if soup:
                    page_content = soup.get_text()
            
            # If we got any content, try Gemini
            if page_content:
                print("Using Gemini API complete fallback...")
                return analyze_with_gemini(url, page_content)
            else:
                # Last resort - send a minimal description to Gemini
                minimal_content = f"This is a job posting from {url}. Please extract as much information as possible."
                return analyze_with_gemini(url, minimal_content)
                
        except Exception as inner_e:
            print(f"Complete fallback also failed: {str(inner_e)}")
            # Return empty structure if absolutely everything fails
            return {
                "title": "Could not analyze job posting",
                "company": "Unknown",
                "location": "Unknown",
                "salary": "Not specified",
                "description": f"Failed to scrape job posting from {url}. Error: {str(e)}",
                "requirements": ["Could not extract requirements automatically."],
                "responsibilities": ["Could not extract responsibilities automatically."],
                "keywords": ["Skills", "Experience"]
            }
    finally:
        if driver:
            try:
                driver.quit()
            except:
                print("Error closing WebDriver")

def fetch_with_requests(url):
    """
    Fallback method to fetch a webpage using the requests library
    Returns the page content as BeautifulSoup object
    """
    try:
        print(f"Fetching {url} using requests library...")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            print("Successfully fetched page with requests")
            return BeautifulSoup(response.text, 'html.parser')
        else:
            print(f"Failed to fetch with requests: Status code {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching with requests: {str(e)}")
        return None
