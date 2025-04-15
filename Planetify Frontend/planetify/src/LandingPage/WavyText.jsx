import React from "react";
import "./LandingPage.css";

const WavyText = () => {
  return (
    <h1 className="header-landing-page">
      EXPLORE YOUR{" "}
      <span className="animated-text">
        {"MUSIC UNIVERSE".split("").map((char, index) => (
          <span key={index} className="letter" style={{ "--i": index }}>
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    </h1>
  );
};

export default WavyText;
