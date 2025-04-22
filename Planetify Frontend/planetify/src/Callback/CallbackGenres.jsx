import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import PlanetStatsGenres from "../PlanetStats/PlanetStatsGenres";
import CallbackGeneral from "./CallbackGeneral";
import CallbackGeneral2 from "./CallbackGeneral2";
import "./CallbackGenres.css";
import Footer from "../Navbar/Footer";

const fetchTopGenres = async (token, limit, timeRange) => {
  try {
    const topGenresResponse = await axios.get(
      `http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/top_genres/?token=${token}&limit=${limit}&time_range=${timeRange}`
    );
    const topGenres = topGenresResponse.data.top_genres.map((genre, index) => ({
      id: genre.id,
      genre: genre.genre,
      count: genre.count,
      percentage: genre.percentage,
      images: genre.images,
      artistCount: genre.artist_count,
      artistIds: genre.artist_ids,
      artists: genre.artists.join(", "),
      topTracks: genre.top_tracks,
      index: index + 1,
    }));
    return topGenres;
  } catch (error) {
    console.error("Error fetching top genres:", error);
    return [];
  }
};

const fetchColors = async (imageUrls) => {
  try {
    const response = await axios.post(
      "http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/extract_colors_multiple_images",
      {
        image_urls: imageUrls,
        num_colors: 10,
      }
    );
    return response.data.colors;
  } catch (error) {
    console.error("Error fetching colors:", error);
    return [];
  }
};

const handleCallback = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const storedState = sessionStorage.getItem("oauth_state");

  if (state !== storedState) {
    console.error("State mismatch");
    return;
  }

  // Eliminar el token existente antes de procesar un nuevo login
  sessionStorage.removeItem("token");

  try {
    const response = await axios.get(
      `http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/callback?code=${code}&state=${state}`
    );
    const token = response.data.access_token;
    sessionStorage.setItem("token", token);
    return token;
  } catch (error) {
    console.error("Error during Spotify callback handling:", error);
    return null;
  }
};

const CustomSelect = ({ options, value, onChange }) => {
  const [selected, setSelected] = useState(
    options.find((opt) => opt.value === value)
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (option) => {
    setSelected(option);
    onChange(option.value);
    setIsOpen(false);
  };

  const toggleSelect = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const closeSelect = (e) => {
      if (!e.target.closest(".custom-select")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", closeSelect);
    return () => document.removeEventListener("click", closeSelect);
  }, []);

  return (
    <div className="custom-select" style={{ width: 150 }}>
      <div className="select-selected" onClick={toggleSelect}>
        {selected.label}
      </div>
      {isOpen && (
        <div className="select-items">
          {options.map((option) => (
            <div
              key={option.value}
              className={
                option.value === selected.value ? "same-as-selected" : ""
              }
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CallbackGenres = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const [topGenres, setTopGenres] = useState(
    JSON.parse(sessionStorage.getItem("topGenresWithColors")) || []
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const [limit, setLimit] = useState(
    sessionStorage.getItem("limitGenres") || 10
  );
  const [timeRange, setTimeRange] = useState(
    sessionStorage.getItem("timeRangeGenres") || "short_term"
  );
  const [hasRings, setHasRings] = useState(
    JSON.parse(sessionStorage.getItem("hasRings")) || false
  );

  const [isLoading, setIsLoading] = useState(false);
  const [colorCounter, setColorCounter] = useState(0);

  const navigate = useNavigate();
  const audioRefs = useRef([]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fade, setFade] = useState(false);

  const Popup = ({ onApply }) => (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className="popup-slider">
          <button
            className="popup-slider-button-left"
            onClick={() => setLimit(Math.max(limit - 5, 1))}
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max="50"
            value={limit}
            readOnly
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{
              textAlign: "center",
              width: "50px",
              padding: "5px",
              fontSize: "2rem",
              border: "none",
              borderRadius: "20px",
              WebkitAppearance: "none",
              MozAppearance: "textfield",
            }}
          />
          <button
            className="popup-slider-button-right"
            onClick={() => setLimit(limit === 1 ? 5 : Math.min(limit + 5, 50))}
          >
            +
          </button>
        </div>
        <div className="popup-select">
          <CustomSelect
            options={[
              { value: "short_term", label: "Last Month" },
              { value: "medium_term", label: "Last 6 Months" },
              { value: "long_term", label: "Last Year" },
            ]}
            value={timeRange}
            onChange={(value) => setTimeRange(value)}
          />
        </div>
        <div className="popup-checkbox">
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
        <div className="popup-button-apply">
          <button className="popup-button-apply-button" onClick={onApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    sessionStorage.setItem("hasRings", JSON.stringify(hasRings));
  }, [hasRings]);

  const applyChanges = async () => {
    navigate(`?code=${code}&state=${state}`);
    setShowPopup(false);
    setIsLoading(true);
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");

    // Si no está autenticado, establecer isAuthenticated en true
    if (!isAuthenticated) {
      sessionStorage.setItem("isAuthenticated", "true");
      window.dispatchEvent(new Event("storage"));
    }

    let token;

    if (isAuthenticated) {
      // Obtener el token del sessionStorage si ya está autenticado
      token = sessionStorage.getItem("token");
    } else {
      // Si no está autenticado, manejar el callback para obtener el token
      token = await handleCallback();
    }

    const storedData = JSON.parse(
      sessionStorage.getItem("topGenresWithColors")
    );
    const storedTimeRange = sessionStorage.getItem("timeRangeGenres");
    let initialColorCount = 0;

    if (storedData && storedTimeRange === timeRange) {
      initialColorCount = storedData.length;
      setColorCounter(initialColorCount); // Inicializa el contador con la cantidad de colores almacenados
    } else {
      setColorCounter(0); // Inicializa el contador en 0 si el timeRange es diferente
    }

    if (token) {
      const genres = await fetchTopGenres(token, limit, timeRange);
      let colorsArray = [];

      const updatedGenres = await Promise.all(
        genres.map(async (genre) => {
          const storedGenre = storedData
            ? storedData.find(
                (stored) =>
                  JSON.stringify(stored.artistIds) ===
                  JSON.stringify(genre.artist_ids)
              )
            : null;

          if (
            storedGenre &&
            JSON.stringify(storedGenre.artistIds) ===
              JSON.stringify(genre.artist_ids)
          ) {
            return storedGenre;
          } else {
            const colors = await fetchColors(genre.images);
            colorsArray.push({ index: genre.index, colors });
            setColorCounter((prevCounter) => prevCounter + 1);
            return { ...genre, colors };
          }
        })
      );

      // Eliminar colores no utilizados en el array
      if (storedData && storedData.length > updatedGenres.length) {
        const indicesToRemove = storedData
          .slice(updatedGenres.length)
          .map((genre) => genre.index);
        colorsArray = colorsArray.filter(
          (colorObj) => !indicesToRemove.includes(colorObj.index)
        );
      }

      setTopGenres(updatedGenres);
      audioRefs.current.forEach((audio) => {
        audio.pause();
      });
      sessionStorage.setItem(
        "topGenresWithColors",
        JSON.stringify(updatedGenres)
      );
      sessionStorage.setItem("colorsGenres", JSON.stringify(colorsArray));
      sessionStorage.setItem("limitGenres", limit);
      sessionStorage.setItem("timeRangeGenres", timeRange);
      sessionStorage.setItem("hasRings", JSON.stringify(hasRings));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const storedData = JSON.parse(
      sessionStorage.getItem("topGenresWithColors")
    );
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");

    // Si no está autenticado, establecer isAuthenticated en true
    if (!isAuthenticated) {
      sessionStorage.setItem("isAuthenticated", "true");
      window.dispatchEvent(new Event("storage"));
    }

    const updateGenres = async () => {
      let token;

      if (isAuthenticated) {
        // Obtener el token del sessionStorage si ya está autenticado
        token = sessionStorage.getItem("token");
      } else {
        // Si no está autenticado, manejar el callback para obtener el token
        token = await handleCallback();
      }

      if (token) {
        const genres = await fetchTopGenres(token, limit, timeRange);
        let colorsArray = [];

        const updatedGenres = await Promise.all(
          genres.map(async (genre) => {
            const storedGenre = storedData
              ? storedData.find(
                  (stored) =>
                    JSON.stringify(stored.artistIds) ===
                    JSON.stringify(genre.artist_ids)
                )
              : null;

            if (
              storedGenre &&
              JSON.stringify(storedGenre.artistIds) ===
                JSON.stringify(genre.artist_ids)
            ) {
              return storedGenre;
            } else {
              const colors = await fetchColors(genre.images);
              colorsArray.push({ index: genre.index, colors });
              setColorCounter((prevCounter) => prevCounter + 1);
              return { ...genre, colors };
            }
          })
        );

        // Eliminar colores no utilizados en el array
        if (storedData && storedData.length > updatedGenres.length) {
          const indicesToRemove = storedData
            .slice(updatedGenres.length)
            .map((genre) => genre.index);
          colorsArray = colorsArray.filter(
            (colorObj) => !indicesToRemove.includes(colorObj.index)
          );
        }

        setTopGenres(updatedGenres);
        sessionStorage.setItem(
          "topGenresWithColors",
          JSON.stringify(updatedGenres)
        );
        sessionStorage.setItem("colorsGenres", JSON.stringify(colorsArray));
        sessionStorage.setItem(
          "authUrlGenres",
          `http://planetify-frontend.s3-website.us-east-2.amazonaws.com/callback?code=${code}&state=${state}`
        );
        sessionStorage.setItem("limitGenres", limit);
        sessionStorage.setItem("timeRangeGenres", timeRange);
        sessionStorage.setItem("hasRings", JSON.stringify(hasRings));
        redirect(`?code=${code}&state=${state}`);
      }
    };

    sessionStorage.setItem("updatedGenres", JSON.stringify(true));

    if (storedData) {
      setTopGenres(storedData);
      updateGenres();
    } else if (code) {
      updateGenres();
    }
  }, [code, state, navigate]);

  useEffect(() => {
    if (topGenres.length > 0 && topGenres[currentSlide]?.images.length > 0) {
      const interval = setInterval(() => {
        setFade(true);
        setTimeout(() => {
          setCurrentImageIndex((prevIndex) => {
            const maxIndex =
              Math.min(
                topGenres[currentSlide].artistCount,
                topGenres[currentSlide].images.length
              ) - 1;
            return prevIndex >= maxIndex ? 0 : prevIndex + 1;
          });
          setFade(false);
        }, 500); // Transition time for the image
      }, 7000);

      return () => clearInterval(interval);
    }
  }, [currentSlide, topGenres]);

  useEffect(() => {
    if (audioRefs.current[currentSlide]) {
      audioRefs.current.forEach((audio, index) => {
        if (audio && index !== currentSlide) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      setTimeout(() => {
        audioRefs.current[currentSlide]
          .play()
          .catch((error) => console.error("Error playing audio:", error));
      }, 500);
    }
  }, [currentSlide, topGenres]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        nextSlide();
      } else if (event.key === "ArrowLeft") {
        prevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentSlide, topGenres]);

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const newSlide = prev === topGenres.length - 1 ? 0 : prev + 1;
      if (audioRefs.current[prev]) {
        audioRefs.current[prev].pause();
        audioRefs.current[prev].currentTime = 0;
      }
      return newSlide;
    });

    // Randomizar el track
    randomizeTrack();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const newSlide = prev === 0 ? topGenres.length - 1 : prev - 1;
      if (audioRefs.current[prev]) {
        audioRefs.current[prev].pause();
        audioRefs.current[prev].currentTime = 0;
      }
      return newSlide;
    });

    // Randomizar el track
    randomizeTrack();
  };

  const randomizeTrack = () => {
    setTopGenres((prevGenres) => {
      const updatedGenres = [...prevGenres];
      const genre = updatedGenres[currentSlide];
      if (genre.topTracks.length > 1) {
        const randomTrackIndex = Math.floor(
          Math.random() * genre.topTracks.length
        );
        genre.currentTrack = genre.topTracks[randomTrackIndex];
      } else {
        genre.currentTrack = genre.topTracks[0];
      }
      updatedGenres[currentSlide] = genre;
      return updatedGenres;
    });
  };

  const calculateLuminosity = (color) => {
    const [r, g, b] = color;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const findLightestColors = (colors) => {
    return colors
      .sort((a, b) => calculateLuminosity(b) - calculateLuminosity(a))
      .slice(1);
  };

  const progress = (colorCounter / limit) * 100;

  return (
    <>
      <Navbar autoHide={true} />
      {topGenres.length > 0 ? (
        <>
          <div className="type-planet-content-callback-page">
            <div className="type-planet-content-callback-page-inside">
              <div className="terms-callback-page">
                <h5 className="genre-info-data-header-5">
                  {timeRange === "short_term"
                    ? "LAST MONTH"
                    : timeRange === "medium_term"
                    ? "LAST 6 MONTHS"
                    : "LAST YEAR"}
                </h5>
              </div>
              <h1 className="header-callback-page">TOP {limit} GENRES</h1>
              <button
                className="button-callback-page"
                onClick={() => setShowPopup((prev) => !prev)}
              >
                <i className="fa-solid fa-sliders button-callback-page-inside"></i>
              </button>
            </div>
          </div>
          <div className="carousel-container">
            <button className="carousel-button prev" onClick={prevSlide}>
              &#10094;
            </button>
            <div
              className="carousel-slide"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {topGenres.map((genre, index) => {
                const lightestColors = findLightestColors(genre.colors);
                return (
                  <div className="slide" key={index}>
                    <div className="genre-planet">
                      <PlanetStatsGenres
                        key={genre.artistIds}
                        imageUrl={genre.images}
                        colors={genre.colors}
                        planetInclination={genre.percentage}
                        hasRings={hasRings}
                      />
                    </div>
                    <div className="genre-info">
                      {(genre.images.length > 1 && (
                        <>
                          <img
                            className={`genre-info-img ${fade ? "fade" : ""}`}
                            src={genre.images[currentImageIndex]}
                            style={{
                              maxHeight: "25vw",
                              objectFit: "cover",
                              transition: "opacity 0.5s ease-in-out",
                              opacity: fade ? 0 : 1,
                            }}
                          />
                        </>
                      )) || (
                        <>
                          <img
                            className="genre-info-img"
                            src={genre.images[0]}
                            style={{
                              maxHeight: "25vw",
                              objectFit: "cover",
                            }}
                          />
                        </>
                      )}
                      <div className="genre-info-data">
                        <h2
                          style={{
                            color: `rgb(${lightestColors[0].join(",")})`,
                          }}
                          className="genre-info-data-header-2"
                        >
                          #{genre.index} - {genre.genre.toUpperCase()}
                        </h2>
                        <audio
                          ref={(el) => (audioRefs.current[index] = el)}
                          src={genre.currentTrack || genre.topTracks[0]}
                        />
                        <br />
                        <hr />
                        <br />
                        <h3 className="genre-info-data-header-3">
                          Owners:{" "}
                          <span style={{ color: "#1ed760" }}>
                            {genre.artists}
                          </span>
                        </h3>
                        <h3 className="genre-info-data-header-3">
                          Population:{" "}
                          <span style={{ color: "#1ed760" }}>
                            {parseFloat(genre.percentage).toFixed(2)}%
                          </span>
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="carousel-button next" onClick={nextSlide}>
              &#10095;
            </button>
            <div className="carousel-dots">
              {topGenres.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentSlide ? "active" : ""}`}
                  onClick={() => setCurrentSlide(index)}
                ></span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="loading-overlay-general">
          <CallbackGeneral progress={progress} />
        </div>
      )}
      {showPopup && (
        <Popup onClose={() => setShowPopup(false)} onApply={applyChanges} />
      )}
      {isLoading && (
        <div className="loading-overlay-general">
          <CallbackGeneral2 progress={progress} />
        </div>
      )}
      <Footer />
    </>
  );
};

export default CallbackGenres;
