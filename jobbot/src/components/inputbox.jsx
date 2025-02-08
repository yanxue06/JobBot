import React, { useState } from 'react';
import { FormControl, InputLabel, Input, FormHelperText, Button } from '@mui/material';

const InputBox = () => {
  const [jobLinks, setJobLinks] = useState(''); // State to hold the input value

  // Handler to update the state when the input value changes
  const handleInputChange = (event) => {
    setJobLinks(event.target.value);
  };

  // Handler to submit the form
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    console.log('Job Links Submitted:', jobLinks);

    // Example: Sending the data to a backend
    try {
      const response = await fetch('http://localhost:5001/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: jobLinks.split(',').map((link) => link.trim()) }), // Send as an array of links
      });

      if (response.ok) {
        console.log('Links successfully submitted!');
        // Optionally reset the input field
        setJobLinks('');
      } else {
        console.error('Failed to submit links:', response.statusText);
      }
    } catch (error) {
      console.error('Error submitting links:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
      <FormControl
        required
        style={{
          margin: '20px auto',
          width: '300px',
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <InputLabel
          htmlFor="job-links-input"
          style={{
            color: 'rgba(153, 210, 248, 0.74)',
            fontWeight: 'bold',
          }}
        >
          Input your Job Links!
        </InputLabel>
        <Input
          id="job-links-input"
          placeholder="Job Links - Separated by commas"
          value={jobLinks}
          onChange={handleInputChange}
          style={{
            color: '#333333',
            padding: '8px',
          }}
        />
        <FormHelperText style={{ color: '#888888' }}>
          Enter link1, link2, linkN...
        </FormHelperText>
        <Button
        type="submit"
        variant="contained"
        color="primary" 
        >
            Scrape and Save! 
        </Button>
      </FormControl>

    </form>
  );
};

export default InputBox;
