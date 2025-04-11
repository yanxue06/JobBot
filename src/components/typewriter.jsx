import React, { useState, useEffect } from "react";
import "../typewriter.css";

function TypeWriter({ text, speed = 100, highlightWord = "" }) {
  const [showedText, setShowedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!text || index >= text.length) {
      return;
    }

    const timer = setTimeout(() => {
      setShowedText((prev) => prev + text[index]);
      setIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [index, text, speed]);

  const renderTextWithStyle = () => {
    if (!highlightWord) return showedText;

    const parts = showedText.split(highlightWord);
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {part}
        {i < parts.length - 1 && (
          <span className="highlightclass">{highlightWord}</span>
        )}
      </React.Fragment>
    ));
  };

  return <div>{renderTextWithStyle()}</div>;
}

export default TypeWriter;
