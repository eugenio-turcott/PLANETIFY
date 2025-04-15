import React from "react";
import PropTypes from "prop-types";
import PlanetDemo from "./PlanetDemo";

const PlanetDemoStruct = ({
  width,
  height,
  colors,
  planetInclination,
  hasRings,
}) => {
  return (
    <>
      <PlanetDemo
        width={width}
        height={height}
        colors={colors}
        hasRings={hasRings}
        planetInclination={planetInclination}
      />
    </>
  );
};

PlanetDemoStruct.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  planetInclination: PropTypes.number,
  hasRings: PropTypes.bool,
};

export default PlanetDemoStruct;
