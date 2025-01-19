import json

import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager


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
    content = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()

    # Extract job details
    try:
        job_title = content.find('h1').get_text(strip=True)
    except AttributeError:
        job_title = None

    try:
        company = content.find('span', {'data-testid': 'company-name'}).get_text(strip=True)
    except AttributeError:
        company = None

    try:
        location_element = content.find('div', {'data-testid': 'text-location'})
        location = location_element.find('span').get_text(strip=True) if location_element else None
    except AttributeError:
        location = None

    try:
        employer_active = content.find('span', class_='date').get_text(strip=True)
    except AttributeError:
        employer_active = None

    try:
        salary = content.find('span', class_='salary').get_text(strip=True)
    except AttributeError:
        salary = None

    # Extract paragraphs for the job description
    description = ' '.join([p.get_text(strip=True) for p in content.find_all('p')])

    # Extract any listed benefits or responsibilities
    lists = [li.get_text(strip=True) for li in content.find_all('li')]

    # Create a DataFrame for the results
    job_data = {
        "Job Title": [job_title],
        "Company": [company],
        "Location": [location],
        "Employer Active": [employer_active],
        "Salary": [salary],
        "Description": [description],
        "Lists": [lists],
    }

    df = pd.DataFrame(job_data)
    pd.set_option('display.max_colwidth', None)  # Show full content of columns
    pd.set_option('display.width', 1000)  # Adjust the width to fit the terminal


    return df


# def scrape(urls, keywords = None): 
#     driver = configure_driver()
#     driver.get(urls) 
    
#     #just call cleanJobs multiple times for each url if needed
#     cleanJobs(driver)


    # title_tag = content.find('title')
    # page_title = [title_tag.get_text(strip=True)] if title_tag else None

    # # Extract meta keywords with attributes name=keywords
    # meta_keywords_tags = content.find_all("meta", attrs={"name": "keywords"}) 

    # # Now 'meta_keywords_tags' is a list, so we want to extract content from each one. 
    # all_meta_keywords = [
    #     tag["content"] for tag in meta_keywords_tags      
    #     if tag and "content" in tag.attrs
    # ]

    # # Extract meta description
    # meta_description_tag = content.find("meta", attrs={"name": "description"})
    # meta_description = meta_description_tag["content"] if meta_description_tag else None

    # # Extract all headings
    # h1_texts = [h1.get_text(strip=True) for h1 in content.find_all('h1')]

    # # extract paragraphs - this is where all the good stuff is for indeed 
    # p = [p.get_text(strip=True) for p in content.find_all('p')]  

    # # extract all lists 
    # li = [li.get_text(strip=True) for li in content.find_all('li')]
    
    # matched_texts = []
    
    # if keywords:
    #     # Convert keywords to lowercase for case-insensitive matching
    #     keywords_lower = [kw.lower() for kw in keywords]
    #     for paragraph in p:
    #         paragraph_lower = paragraph.lower()
    #         # If any of the keywords is in this paragraph, we consider it matched
    #         if any(kw in paragraph_lower for kw in keywords_lower):
    #             matched_texts.append(paragraph)
    #     for li_item in li: 
    #         list_lower = li_item.lower() 
    #         if any(kw in list_lower for kw in keywords_lower):
    #             matched_texts.append(li_item)

    # Pack all results in a dictionary
    # result = {
    #     "title": page_title,
    #     "keywords": all_meta_keywords, 
    #     "description": meta_description,
    #     "h1_list": h1_texts, 
    #     "p": p, 
    #     "li": li, 
    #     "matched_texts": matched_texts 
    # }


    
