import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Input,
  FormHelperText,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "@mui/material/Link";

const InputBox = () => {
  const [inputValue, setInputValue] = useState("");
  const [linkList, setLinkList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedLinks, setScrapedLinks] = useState([]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addLink();
    }
  };

  const addLink = () => {
    if (inputValue.trim()) {
      setLinkList([...linkList, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeLink = (indexToRemove) => {
    setLinkList(linkList.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (linkList.length === 0) return;

    setIsLoading(true);
    setScrapedLinks(linkList.map((url) => ({ url, status: "pending" })));

    try {
      const response = await fetch("http://localhost:5001/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ links: linkList }),
      });

      if (response.ok) {
        setScrapedLinks((prev) =>
          prev.map((link) => ({ ...link, status: "success" })),
        );
        setLinkList([]);
      } else {
        setScrapedLinks((prev) =>
          prev.map((link) => ({ ...link, status: "error" })),
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setScrapedLinks((prev) =>
        prev.map((link) => ({ ...link, status: "error" })),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    width: "80%",
    maxWidth: "800px",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    backdropFilter: "blur(8px)",
    margin: "0 auto",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "all 0.3s ease",
  };

  const listItemStyle = {
    borderRadius: "8px",
    margin: "8px 0",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      transform: "translateX(5px)",
    },
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        <FormControl style={containerStyle}>
          <InputLabel style={{ color: "#fff" }}>
            Input your Job Links!
          </InputLabel>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            style={{
              color: "#fff",
              marginBottom: "10px",
            }}
          />
          <FormHelperText
            style={{
              color: linkList.length === 0 ? "#f44336" : "#9ec5e5",
            }}
          >
            {linkList.length === 0
              ? "Add at least one link before scraping"
              : "Press Enter after each link"}
          </FormHelperText>

          {linkList.length > 0 && (
            <Paper
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                margin: "10px 0",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              <List>
                {linkList.map((link, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={
                        <Link
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#9ec5e5" }}
                        >
                          {link}
                        </Link>
                      }
                    />
                    <IconButton
                      onClick={() => removeLink(index)}
                      style={{ color: "#f44336" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || linkList.length === 0}
            style={{
              marginTop: "16px",
              backgroundColor: "#9ec5e5",
              color: "#1a1a1a",
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : "SCRAPE AND SAVE"}
          </Button>
        </FormControl>
      </form>

      <Paper
        style={{
          ...containerStyle,
          marginTop: "20px",
          padding: "0px",
        }}
      >
        <List style={{ padding: "24px" }}>
          {scrapedLinks.length > 0 ? (
            scrapedLinks.map((link, index) => (
              <ListItem key={index} style={listItemStyle}>
                <ListItemText
                  primary={link.url}
                  secondary={link.status}
                  style={{
                    color: "#fff",
                    "& .MuiListItemText-secondary": {
                      color:
                        link.status === "success"
                          ? "#4caf50"
                          : link.status === "error"
                            ? "#f44336"
                            : "#ff9800",
                    },
                  }}
                />
                {link.status === "success" ? (
                  <CheckCircleIcon style={{ color: "#ffff" }} />
                ) : link.status === "error" ? (
                  <ErrorIcon style={{ color: "#f44336" }} />
                ) : (
                  <CircularProgress size={20} style={{ color: "#ff9800" }} />
                )}
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="No links scraped yet"
                style={{
                  color: "#9ec5e5",
                  textAlign: "center",
                  opacity: 0.7,
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
