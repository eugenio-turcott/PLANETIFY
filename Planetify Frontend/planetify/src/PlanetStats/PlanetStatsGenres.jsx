import React, { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import PlanetCanvas from "./PlanetCanvas";

const PlanetStats = ({ imageUrls, colors, planetInclination, hasRings }) => {
  const [fetchedColors, setFetchedColors] = useState(colors || []);

  useEffect(() => {
    const fetchColors = async () => {
      if (!colors) {
        try {
          const response = await axios.post(
            "http://localhost:8000/extract_colors_multiple_images",
            {
              image_urls: imageUrls,
              num_colors: 10,
            }
          );
          setFetchedColors(response.data.colors);
        } catch (error) {
          console.error("Error fetching colors:", error);
        }
      }
    };

    fetchColors();
  }, [imageUrls, colors]);

  return (
    <div>
      {fetchedColors.length > 0 ? (
        <PlanetCanvas
          width={27.5}
          height={27.5}
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
