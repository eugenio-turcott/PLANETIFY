import React, { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import PlanetCanvas from "./PlanetCanvas";

const PlanetStats = ({ imageUrl, colors, planetInclination, hasRings }) => {
  const [fetchedColors, setFetchedColors] = useState(colors || []);

  useEffect(() => {
    const fetchColors = async () => {
      if (!colors) {
        try {
          const response = await axios.get(
            "http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/extract_colors_unique_image",
            {
              params: { image_url: imageUrl, num_colors: 10 },
            }
          );
          setFetchedColors(response.data.colors);
        } catch (error) {
          console.error("Error fetching colors:", error);
        }
      }
    };

    fetchColors();
  }, [imageUrl, colors]);

  return (
    <div>
      {fetchedColors.length > 0 ? (
        <PlanetCanvas
          width={400}
          height={400}
          colors={fetchedColors}
          hasRings={hasRings}
          planetInclination={planetInclination}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

PlanetStats.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  colors: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  planetInclination: PropTypes.number,
  hasRings: PropTypes.bool,
};

export default PlanetStats;
