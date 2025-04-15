import React from "react";
import PlanetCanvas from "../Navbar/Planet/Planet";
import "./CallbackGeneral.css";
import PlanetifyLoading from "../assets/Planetify_Loading_2.gif";
import Spaceship from "../assets/spaceship.png";

const CallbackGeneral = ({ progress }) => {
  return (
    <div className="landing-page">
      <div className="welcome-content-landing-page">
        <div className="planets-content-landing-page">
          <PlanetCanvas
            width={75}
            height={75}
            hasRings={false}
            top={"-35vw"}
            right={"0"}
          />
          <PlanetCanvas
            width={35}
            height={35}
            hasRings={true}
            top={"-7.5vw"}
            right={"70vw"}
          />
          <PlanetCanvas
            width={10}
            height={10}
            hasRings={false}
            top={"20vw"}
            right={"90vw"}
          />
          <PlanetCanvas
            width={5}
            height={5}
            hasRings={true}
            top={"7.5vw"}
            right={"70vw"}
          />
          <PlanetCanvas
            width={30}
            height={30}
            hasRings={false}
            top={"0"}
            right={"0"}
          />
          <PlanetCanvas
            width={10}
            height={10}
            hasRings={false}
            top={"6.5vw"}
            right={"0vw"}
          />
          <PlanetCanvas
            width={110}
            height={110}
            hasRings={false}
            top={"-7.5vw"}
            right={"40vw"}
          />
          <PlanetCanvas
            width={20}
            height={20}
            hasRings={false}
            top={"35vw"}
            right={"65vw"}
          />
          <PlanetCanvas
            width={35}
            height={35}
            hasRings={false}
            top={"27.5vw"}
            right={"15vw"}
          />
          <PlanetCanvas
            width={10}
            height={10}
            hasRings={true}
            top={"27.5vw"}
            right={"77.5vw"}
          />
          <PlanetCanvas
            width={65}
            height={65}
            hasRings={true}
            top={"10vw"}
            right={"-30vw"}
          />
        </div>
        <div className="loading-overlay">
          <div className="loading-overlay-inside">
            <div className="loading-overlay-div-loading">
              <h3
                style={{ color: "#1ed760" }}
                className="callback-general-info-data-header-3"
              >
                WE ARE TRAVELLING
              </h3>
              <h3
                style={{ color: "#1ed760", marginBottom: "40px" }}
                className="callback-general-info-data-header-3"
              >
                TO YOUR SOLAR SYSTEM
              </h3>
            </div>
            <div className="loading-bar">
              <div
                className="loading-bar-progress"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="loading-overlay-img">
              <img
                className="loading-overlay-img-inside"
                src={PlanetifyLoading}
                alt="Loading"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallbackGeneral;
