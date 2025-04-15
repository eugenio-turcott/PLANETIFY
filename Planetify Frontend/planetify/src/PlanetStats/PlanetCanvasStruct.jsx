import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import PlanetCanvas from "./PlanetCanvas";

function getRandomColor() {
  return [
    Math.floor(Math.random() * 256), // R
    Math.floor(Math.random() * 256), // G
    Math.floor(Math.random() * 256), // B
  ];
}

function getRandomColorsArray(size) {
  return Array.from({ length: size }, () => getRandomColor());
}

const PlanetCanvasStruct = ({ width, height, planetInclination, hasRings }) => {
  const [currentColorsRandom, setCurrentColorsRandom] = useState(
    getRandomColorsArray(5)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentColorsRandom(getRandomColorsArray(5));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <PlanetCanvas
        width={width}
        height={height}
        colors={currentColorsRandom}
        hasRings={hasRings}
        planetInclination={planetInclination}
      />
    </>
  );
};

PlanetCanvasStruct.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  planetInclination: PropTypes.number,
  hasRings: PropTypes.bool,
};

export default PlanetCanvasStruct;
