import React, { useState } from 'react';
import { FormControl, InputLabel, Input, FormHelperText, Button, 
         CircularProgress, List, ListItem, ListItemText, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const InputBox = () => {
  const [jobLinks, setJobLinks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedLinks, setScrapedLinks] = useState([]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const links = jobLinks.split(',').map(link => link.trim());
    setScrapedLinks(links.map(link => ({ url: link, status: 'pending' })));

    try {
      const response = await fetch('http://localhost:5001/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: links }),
      });

      if (response.ok) {
        // Update all links to success
        setScrapedLinks(prev => 
          prev.map(link => ({ ...link, status: 'success' }))
        );
        setJobLinks('');
      } else {
        // Mark all as failed
        setScrapedLinks(prev => 
          prev.map(link => ({ ...link, status: 'error' }))
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setScrapedLinks(prev => 
        prev.map(link => ({ ...link, status: 'error' }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    width: '80%',
    maxWidth: '800px',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',  // Slightly more transparent
    padding: '24px',
    borderRadius: '16px',  // Slightly more rounded
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',  // Fancier shadow
    backdropFilter: 'blur(8px)',
    margin: '0 auto',
    border: '1px solid rgba(255, 255, 255, 0.1)',  // Subtle border
    transition: 'all 0.3s ease',  // Smooth transitions
  };

  const listItemStyle = {
    borderRadius: '8px',
    margin: '8px 0',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      transform: 'translateX(5px)',
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <FormControl required style={containerStyle}>
          <InputLabel style={{ color: '#fff'}}>Input your Job Links!</InputLabel>
          <Input
            id="job-links-input"
            value={jobLinks}
            onChange={(e) => setJobLinks(e.target.value)}
            multiline
            rows={1}
            style={{ 
              color: '#fff',
              fontSize: '14px',
              '&:before': {
                borderColor: 'rgba(255, 255, 255, 0.2)'
              },
              '&:after': {
                borderColor: '#9ec5e5'
              }
            }}
          />
          <FormHelperText style={{ color: '#9ec5e5' }}>
            Enter link1, link2, linkN...
          </FormHelperText>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            style={{
              marginTop: '16px',
              backgroundColor: '#9ec5e5',
              color: '#1a1a1a',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#7ab0d8',
                transform: 'translateY(-2px)',
                boxShadow: '0 5px 15px rgba(158, 197, 229, 0.3)'
              }
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'SCRAPE AND SAVE'}
          </Button>
        </FormControl>
      </form>

      <Paper 
        style={{ 
          ...containerStyle,
          marginTop: '20px',
          padding: '0px',
        }}
      >
        <List style={{ padding: '24px' }}>
          {scrapedLinks.length > 0 ? (
            scrapedLinks.map((link, index) => (
              <ListItem key={index} style={listItemStyle}>
                <ListItemText 
                  primary={link.url}
                  secondary={link.status}
                  style={{
                    color: '#fff',
                    '& .MuiListItemText-secondary': {
                      color: link.status === 'success' ? '#4caf50' : 
                             link.status === 'error' ? '#f44336' : '#ff9800'
                    }
                  }}
                />
                {link.status === 'success' ? (
                  <CheckCircleIcon style={{ color: '#ffff' }} />
                ) : link.status === 'error' ? (
                  <ErrorIcon style={{ color: '#f44336' }} />
                ) : (
                  <CircularProgress size={20} style={{ color: '#ff9800' }} />
                )}
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText 
                primary="No links scraped yet"
                style={{ 
                  color: '#9ec5e5', 
                  textAlign: 'center',
                  opacity: 0.7
                }}
              />
            </ListItem>
          )}
        </List>
      </Paper>
    </div>
  );
};

export default InputBox;
