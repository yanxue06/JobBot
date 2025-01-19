import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager


def congigure_driver(): 
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    )
    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
    return driver 


def scrape(url, keywords = None): 
    driver = congigure_driver()
    driver.get(url) 
      
    # converting contetnt to beautiful soup object
    content = BeautifulSoup(driver.page_source, "html.parser") 

    driver.quit() 

    title_tag = content.find('title')
    page_title = title_tag.get_text(strip=True) if title_tag else None

    # Extract meta keywords with attributes name=keywords
    meta_keywords_tags = content.find_all("meta", attrs={"name": "keywords"}) 

    # Now 'meta_keywords_tags' is a list, so we want to extract content from each one. 
    all_meta_keywords = [
        tag["content"] for tag in meta_keywords_tags      
        if tag and "content" in tag.attrs
    ]

    # Extract meta description
    meta_description_tag = content.find("meta", attrs={"name": "description"})
    meta_description = meta_description_tag["content"] if meta_description_tag else None

    # Extract all headings
    h1_texts = [h1.get_text(strip=True) for h1 in content.find_all('h1')]

    # extract paragraphs - this is where all the good stuff is for indeed 
    p = [p.get_text(strip=True) for p in content.find_all('p')]  

    # extract all lists 
    li = [li.get_text(strip=True) for li in content.find_all('li')]
    
    matched_texts = []
    
    if keywords:
        # Convert keywords to lowercase for case-insensitive matching
        keywords_lower = [kw.lower() for kw in keywords]
        for paragraph in p:
            paragraph_lower = paragraph.lower()
            # If any of the keywords is in this paragraph, we consider it matched
            if any(kw in paragraph_lower for kw in keywords_lower):
                matched_texts.append(paragraph)
        for li_item in li: 
            list_lower = li_item.lower() 
            if any(kw in list_lower for kw in keywords_lower):
                matched_texts.append(li_item)

    # Pack all results in a dictionary
    result = {
        "title": page_title,
        "keywords": all_meta_keywords, 
        "description": meta_description,
        "h1_list": h1_texts, 
        "p": p, 
        "li": li, 
        "matched_texts": matched_texts 
    }

    return result

