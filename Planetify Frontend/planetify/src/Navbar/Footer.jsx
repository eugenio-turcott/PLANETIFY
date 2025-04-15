import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer>
      <div className="footer">
        <div className="footer-content">
          <p className="footer-content-first">
            All copyrighted content (i. e. track, artist or album artwork) on
            Planetify are owned by their respective owners. Data is provided by
            Spotify AB. Planetify is in no way affiliated with Spotify AB.
          </p>
          <p className="footer-content-second">
            © 2024 <span style={{ color: "#1ed760" }}>Planetify.</span> All
            rights reserved. Developed by:{" "}
            <a
              style={{ color: "#1ed760" }}
              target="_blank"
              href="https://github.com/eugenio-turcott"
            >
              Eugenio Turcott
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
