
from dotenv import load_dotenv
from IndeedScraper import *

load_dotenv()

"""
List of countries url.
"""
nigeria = 'https://ng.indeed.com'
united_kingdom = 'https://uk.indeed.com'
united_states = 'https://www.indeed.com'
canada = 'https://ca.indeed.com'
germany = 'https://de.indeed.com'
australia = 'https://au.indeed.com'
south_africa = 'https://za.indeed.com'
sweden = 'https://se.indeed.com'
singapore = 'https://www.indeed.com.sg'
switzerland = 'https://www.indeed.ch'
united_arab_emirates = 'https://www.indeed.ae'
new_zealand = 'https://nz.indeed.com'
india = 'https://www.indeed.co.in'
france = 'https://www.indeed.fr'
italy = 'https://it.indeed.com'
spain = 'https://www.indeed.es'
japan = 'https://jp.indeed.com'
south_korea = 'https://kr.indeed.com'
brazil = 'https://www.indeed.com.br'
mexico = 'https://www.indeed.com.mx'
china = 'https://cn.indeed.com'
saudi_arabia = 'https://sa.indeed.com'
egypt = 'https://eg.indeed.com'
thailand = 'https://th.indeed.com'
vietnam = 'https://vn.indeed.com'
argentina = 'https://ar.indeed.com'
ireland = 'https://ie.indeed.com'


def main():
    driver = configure_webdriver()
    country = canada
    job_position = 'web developer'
    job_location = 'remote'
    date_posted = 25 #postings within last 25 days 

    cleaned_df = None

    try:
        full_url = search_jobs(driver, country, job_position, job_location, date_posted)
        print(f"Searching for jobs at: {full_url}")
        
        df = scrape_job_data(driver, country)
        print(f"Scraped {len(df)} job postings.")
        print(df.head())  # Print the first few rows of the DataFrame for inspection

        cleaned_df = clean_data(df) # clearing employer active but can always add stuff too! 
        csv_file = save_csv(cleaned_df, job_position, job_location)
        print(f"Job data saved to: {csv_file}")

    finally:
        pass
        driver.quit()


if __name__ == "__main__":
    main()
