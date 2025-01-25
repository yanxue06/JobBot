import re 
import os 
import pandas as pd

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
from openpyxl.styles import Alignment


def configure_driver(): 
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    )
    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
    return driver 


def scrape(url):
    driver = configure_driver()
    driver.get(url)  # Open the single job link

    # Parse page content
    soup = BeautifulSoup(driver.page_source, "html.parser")

    driver.quit()

    # Extract job details
    try:
        #Attempts to find the <h1> element that has the HTML attribute data-testid="jobsearch-JobInfoHeader-title" (this is specific to Indeed’s page structure).
        job_title = soup.find('h1', {'data-testid': 'jobsearch-JobInfoHeader-title'}).text.strip()
    except AttributeError:
        job_title = None

    try:
        company_element = soup.find('div', {'data-testid': 'inlineHeader-companyName'})
        if company_element:
            company = company_element.find('a').get_text(strip=True) 
    except AttributeError:
        company = None
        print("no company value")

    try:    
        # First, try the primary way to find location with data-testid
        location_element = soup.find('div', {'data-testid': 'inlineHeader-companyLocation'})
        if location_element:
            location = location_element.get_text(strip=True)
        else:
            # If not found, try another approach using the specific class
            location_element = soup.find('div', class_='css-16tkvfy')
            location = location_element.get_text(strip=True) if location_element else "Unknown Location"
    except AttributeError:
        location = None 

 
    try:
        salary = "unknown"
        salary_element = soup.find('div', {'id': 'salaryInfoAndJobType'})
        if salary_element:
            salary_text = salary_element.find('span').get_text(strip=True)  # Extract the full text
            pattern = r'\$\S+'  # Match from $ to the first space
            match = re.search(pattern, salary_text)  # Search for the pattern in the extracted text
            salary = match.group() if match else None  # Get the matched salary or set to None
    except AttributeError:
        salary = None

    # Extract paragraphs for the job description
    description = ' '.join([p.get_text(strip=True) for p in soup.find_all('p')])

    # Extract any listed benefits or responsibilities
    bullet_points = [f"- {li.get_text(strip=True)}" for li in soup.find_all('li')]

    list = "\n".join(bullet_points)

    # Create and clean a DataFrame for the results
    job_data = {
        "Job Title": [job_title],
        "Company": [company],
        "Location": [location],
        "Salary": [salary],
        "Description": [description],
        "Responsibilities, Qualifications and/or Benefits": [list], # Usually will include Job Qualifications, Extract info etc. 
        "url": [url]
    }

    df = pd.DataFrame(job_data)

    #lets save it to a CSV file 
    save_csv(df, company, job_title)

    #for testing
    print(df.to_dict(orient="records"))

    return df


def save_csv(df, company, title): 
    def path_to_desktop(): 
        home_dir = os.path.expanduser("~")
        desktop_path = os.path.join(home_dir, "Desktop/JobMatcher/Files")
        return desktop_path

    # Handling no company or title 
    if not company:
        company = "Unknown_Company"
    if not title:
        title = "Unknown_Title"

    # Ensure the filename is valid for a file system, so replace all non-alphanumeric
    # with an underscore 
    sanitized_company = ''.join(c if c.isalnum() else '_' for c in company)
    sanitized_title = ''.join(c if c.isalnum() else '_' for c in title)

    # Create the file path with a proper extension
    file_name = f'{sanitized_company}_{sanitized_title}.xlsx'
    file_path = os.path.join(path_to_desktop(), file_name)

    # Save the DataFrame to an Excel file
    try:
        # Save the initial file using pandas
        df.to_excel(file_path, index=False)

        # Adjust column widths and enable text wrapping using openpyxl
        workbook = load_workbook(file_path)
        sheet = workbook.active

        for column_index, column_cells in enumerate(sheet.columns, start=1):
            max_length = 0
            column_letter = get_column_letter(column_index)
            column_name = sheet.cell(row=1, column=column_index).value  # Get the column name

            for cell in column_cells:
                # Ensure the value is treated as a string for length calculation
                if cell.value:
                    cell_value = str(cell.value)
                    max_length = max(max_length, len(cell_value))

                # Enable text wrapping for all cells
                cell.alignment = Alignment(wrap_text=True)

            if column_name in ['Description', 'Lists']:
                sheet.column_dimensions[column_letter].width = 50  # Wider for longer text
            else:
                # Adjust other columns based on content
                adjusted_width = max_length + 2  # Add some padding
                sheet.column_dimensions[column_letter].width = adjusted_width
        # Save the formatted Excel file
        workbook.save(file_path)
        print(f"File saved successfully with formatting to {file_path}")
    except Exception as e:
        print(f"Error saving file: {e}")

    
    
