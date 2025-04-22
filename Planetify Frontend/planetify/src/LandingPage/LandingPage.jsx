import React, { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import Footer from "../Navbar/Footer";
import PlanetCanvasStruct from "../PlanetStats/PlanetCanvasStruct";
import PlanetDemoStruct from "./PlanetDemo/PlanetDemoStruct";
import "./LandingPage.css";

const LandingPage = () => {
  const tracksAlbums = [
    "https://i.scdn.co/image/ab67616d0000b273b968625b03ec59b30b48e9c3",
    "https://i.scdn.co/image/ab67616d0000b2735a2ff617de4e51a9a214b56a",
    "https://i.scdn.co/image/ab67616d0000b27388e3822cccfb8f2832c70c2e",
  ];

  const colorPlanet = [
    [
      [144, 100, 101],
      [227, 218, 227],
      [109, 59, 63],
      [197, 156, 160],
      [21, 30, 30],
      [177, 46, 83],
      [177, 125, 127],
      [57, 74, 100],
      [210, 195, 207],
      [136, 135, 171],
    ],
    [
      [53, 60, 78],
      [226, 196, 178],
      [77, 142, 181],
      [17, 15, 21],
      [150, 187, 208],
      [239, 232, 233],
      [197, 135, 99],
      [64, 109, 153],
      [194, 212, 226],
      [107, 166, 194],
    ],
    [
      [138, 206, 0],
      [30, 46, 1],
      [9, 14, 0],
      [85, 127, 1],
      [64, 96, 1],
      [122, 182, 0],
      [47, 69, 1],
      [105, 156, 1],
      [19, 29, 1],
      [1, 1, 0],
    ],
  ];

  const planetInclinations = 45;

  const [hasRings, setHasRings] = useState(
    JSON.parse(sessionStorage.getItem("hasRingsPlanetLanding")) ?? false
  );
  const [selectedIndex, setSelectedIndex] = useState(
    parseInt(sessionStorage.getItem("selectedIndex")) || 0
  );
  const [currentColors, setCurrentColors] = useState(
    JSON.parse(sessionStorage.getItem("currentColorsPlanetLanding")) ||
      colorPlanet[0]
  );
  const [currentInclination, setCurrentInclination] =
    useState(planetInclinations);

  useEffect(() => {
    sessionStorage.setItem("selectedIndex", selectedIndex);
    sessionStorage.setItem(
      "currentColorsPlanetLanding",
      JSON.stringify(currentColors)
    );
    sessionStorage.setItem("hasRingsPlanetLanding", JSON.stringify(hasRings));
  }, [selectedIndex, currentColors, hasRings]);

  const handleImageClick = (index) => {
    setSelectedIndex(index);
    setCurrentColors(colorPlanet[index]);
    setCurrentInclination(planetInclinations[index]);
  };

  return (
    <div className="landing-page">
      <Navbar autoHide={false} />
      <div className="welcome-content-landing-page">
        <div className="planets-content-landing-page-title">
          <div className="title-content-landing-page">
            <h1 className="header-landing-page">
              EXPLORE YOUR <span className="animated-text">MUSIC UNIVERSE</span>
            </h1>
            <p className="p-landing-page">
              Immerse in your music stats never seen before.
            </p>
          </div>
          <div className="planets-content-landing-page">
            <div className="planets-content-int-landing-page">
              <div style={{ marginTop: "150px", float: "left" }}>
                <PlanetCanvasStruct width={100} height={100} hasRings={false} />
              </div>
              <div
                style={{
                  marginTop: "15px",
                  marginLeft: "-50px",
                  float: "left",
                }}
              >
                <PlanetCanvasStruct width={50} height={50} hasRings={true} />
              </div>
              <div style={{ marginTop: "10px", float: "left" }}>
                <PlanetCanvasStruct
                  width={200}
                  height={200}
                  planetInclination={65}
                  hasRings={true}
                />
              </div>
              <div
                style={{
                  marginTop: "220px",
                  marginLeft: "-100px",
                  marginRight: "40px",
                  float: "left",
                }}
              >
                <PlanetCanvasStruct
                  width={20}
                  height={20}
                  planetInclination={30}
                  hasRings={false}
                />
              </div>
              <div
                style={{
                  marginTop: "180px",
                  marginLeft: "25px",
                  float: "left",
                }}
              >
                <PlanetCanvasStruct
                  width={35}
                  height={35}
                  planetInclination={30}
                  hasRings={false}
                />
              </div>
              <div
                style={{
                  marginTop: "45px",
                  marginLeft: "-35px",
                  float: "left",
                }}
              >
                <PlanetCanvasStruct
                  width={30}
                  height={30}
                  planetInclination={10}
                  hasRings={true}
                />
              </div>
              <div
                style={{
                  marginTop: "110px",
                  marginRight: "30px",
                  float: "left",
                }}
              >
                <PlanetCanvasStruct
                  width={75}
                  height={75}
                  planetInclination={15}
                  hasRings={true}
                />
              </div>
              <div
                style={{
                  marginTop: "40px",
                  marginLeft: "-40px",
                  float: "left",
                }}
              >
                <PlanetCanvasStruct width={55} height={55} hasRings={false} />
              </div>
              <div
                style={{
                  marginTop: "130px",
                  marginLeft: "-20px",
                  float: "left",
                }}
              >
                <PlanetCanvasStruct
                  width={130}
                  height={130}
                  planetInclination={70}
                  hasRings={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="demo-content-landing-page">
        <div className="demo-content-show-landing-page">
          <div className="demo-content-planet-landing-page">
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PlanetDemoStruct
                width={400}
                height={400}
                colors={currentColors}
                planetInclination={currentInclination}
                hasRings={hasRings}
                className="planet-transition"
              />
            </div>
            <div style={{ marginTop: "15px" }} className="popup-checkbox">
              <label className="popup-checkbox-inside">
                <input
                  className="popup-checkbox-input"
                  type="checkbox"
                  checked={hasRings}
                  onChange={(e) => {
                    setHasRings(e.target.checked);
                  }}
                />
                With Rings
              </label>
            </div>
          </div>
          <div className="tracks-album-content-landing-page">
            {tracksAlbums.map((trackAlbum, index) => (
              <div>
                <img
                  key={index}
                  src={trackAlbum}
                  alt="Album"
                  className={
                    selectedIndex === index
                      ? "album-cover-landing-page album-cover-margin-landing-page"
                      : "album-cover-landing-page"
                  }
                  onClick={() => handleImageClick(index)}
                />
              </div>
            ))}
          </div>
          <div className="demo-title-content-landing-page">
            <h1 className="header-demo-landing-page">INNOVATIVE & SIMPLE</h1>
            <p className="p-demo-landing-page">
              Just by logging in, you will have the best experience of your
              statistics scattered across different content.
            </p>
            <div className="features-demo-landing-page">
              <i className="fa-solid fa-music features-icon-demo-landing-page"></i>
              <div className="features-div-info-demo-landing-page">
                <h3 className="features-h3-info-demo-landing-page">
                  Music Stats Visualization
                </h3>
                <p>
                  The page offers an innovative way to view your Spotify music
                  statistics, representing them in the form of planets.
                </p>
              </div>
            </div>
            <div className="features-demo-landing-page">
              <i className="fa-solid fa-globe features-icon-demo-landing-page"></i>
              <div className="features-div-info-demo-landing-page">
                <h3 className="features-h3-info-demo-landing-page">
                  Attractive Aesthetics
                </h3>
                <p>
                  Planetify works with a great algorithm that identifies the
                  most relevant colors of the image, whether from the single,
                  album or artist.
                </p>
              </div>
            </div>
            <div className="features-demo-landing-page">
              <i className="fa-solid fa-lock features-icon-demo-landing-page"></i>
              <div className="features-div-info-demo-landing-page">
                <h3 className="features-h3-info-demo-landing-page">
                  Safety & Privacy
                </h3>
                <p>
                  Your privacy is the most important thing. Therefore, all data
                  is stored securely to give you a planetary experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LandingPage;
