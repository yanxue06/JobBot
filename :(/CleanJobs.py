import pandas as pd
from jobbot.backend.GetJobs import * 
from bs4 import BeautifulSoup

def cleanJobs(driver, Keywords = None): 
    df = pd.DataFrame({'Link': [''], 'Job Title': [''], 'Company': [''],
                       'Employer Active': [''], 'Location': ['']})

    while True:
        soup = BeautifulSoup(driver.page_source, 'lxml')
        print(soup)
        
        for i in boxes:
            try:
                link = i.find('a', {'data-jk': True}).get('href')
                link_full = country + link
            except (AttributeError, TypeError):
                try:
                    link = i.find('a', class_=lambda x: x and 'JobTitle' in x).get('href')
                    link_full = country + link
                except (AttributeError, TypeError):
                    link_full = None

            try:
                job_title = i.find('a', class_=lambda x: x and 'JobTitle' in x).text.strip()
            except AttributeError:
                try:
                    job_title = i.find('span', id=lambda x: x and 'jobTitle-' in str(x)).text.strip()
                except AttributeError:
                    job_title = None

            try:
                company = i.find('span', {'data-testid': 'company-name'}).text.strip()
            except AttributeError:
                try:
                    company = i.find('span', class_=lambda x: x and 'company' in str(x).lower()).text.strip()
                except AttributeError:
                    company = None

            try:
                employer_active = i.find('span', class_='date').text.strip()
            except AttributeError:
                try:
                    employer_active = i.find('span', {'data-testid': 'myJobsStateDate'}).text.strip()
                except AttributeError:
                    employer_active = None

            try:
                location_element = i.find('div', {'data-testid': 'text-location'})
                if location_element:
                    try:
                        location = location_element.find('span').text.strip()
                    except AttributeError:
                        location = location_element.text.strip()
                else:
                    raise AttributeError
            except AttributeError:
                try:
                    location_element = i.find('div', class_=lambda x: x and 'location' in str(x).lower())
                    if location_element:
                        try:
                            location = location_element.find('span').text.strip()
                        except AttributeError:
                            location = location_element.text.strip()
                    else:
                        location = ''
                except AttributeError:
                    location = ''

            new_data = pd.DataFrame({'Link': [link_full], 'Job Title': [job_title],
                                     'Company': [company],
                                     'Employer Active': [employer_active],
                                     'Location': [location]})

            df = pd.concat([df, new_data], ignore_index=True)
            job_count += 1


        driver.quit() 

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

