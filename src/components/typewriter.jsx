import React, { useState, useEffect } from "react";
import "../typewriter.css";

function TypeWriter({ text, speed = 100, highlightWord = "" }) {
  const [showedText, setShowedText] = useState(""); // The text that has been typed so far
  const [index, setIndex] = useState(0); // Current index of the text being displayed

  useEffect(() => {
    // Stop when all characters have been typed
    if (!text || index >= text.length) {
      return;
    }

    const timer = setTimeout(() => {
      setShowedText((prev) => prev + text[index]); // Append the next character
      setIndex((prev) => prev + 1); // Move to the next character
    }, speed);

    return () => clearTimeout(timer); // Clear timeout to prevent memory leaks
  }, [index, text, speed]);

  // Function to render styled text
  const renderTextWithStyle = () => {
    if (!highlightWord) return showedText; // No word to highlight, return plain text

    const parts = showedText.split(highlightWord); // Split the text around the highlight word
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {part}
        {i < parts.length - 1 && (
          <span className="highlightclass">{highlightWord}</span> // Add the styled highlight
        )}
      </React.Fragment>
    ));
  };

  return <div>{renderTextWithStyle()}</div>;
}

export default TypeWriter;
