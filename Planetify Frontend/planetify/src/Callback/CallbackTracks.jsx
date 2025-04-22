import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { redirect, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import PlanetStats from "../PlanetStats/PlanetStats";
import CallbackGeneral from "./CallbackGeneral";
import CallbackGeneral2 from "./CallbackGeneral2";
import "./CallbackTracks.css";
import Footer from "../Navbar/Footer";

const fetchTopTracks = async (token, limit, timeRange) => {
  try {
    const topTracksResponse = await axios.get(
      `http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/top_tracks/?token=${token}&limit=${limit}&time_range=${timeRange}`
    );
    const topTracks = topTracksResponse.data.items.map((track, index) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      previewUrl: track.preview_url,
      popularity: track.popularity,
      duration: track.duration_ms,
      trackNumber: track.track_number,
      externalUrl: track.external_urls.spotify,
      imageUrl: track.album.images[0].url,
      index: index + 1,
    }));
    return topTracks;
  } catch (error) {
    console.error("Error fetching top tracks:", error);
    return [];
  }
};

const fetchColors = async (imageUrl) => {
  try {
    const response = await axios.get(
      "http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/extract_colors_unique_image",
      {
        params: { image_url: imageUrl, num_colors: 10 },
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

const CallbackTracks = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const [topTracks, setTopTracks] = useState(
    JSON.parse(sessionStorage.getItem("topTracksWithColors")) || []
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const [limit, setLimit] = useState(
    sessionStorage.getItem("limitTracks") || 10
  );
  const [timeRange, setTimeRange] = useState(
    sessionStorage.getItem("timeRangeTracks") || "short_term"
  );
  const [hasRings, setHasRings] = useState(
    JSON.parse(sessionStorage.getItem("hasRings")) || false
  );

  const [isLoading, setIsLoading] = useState(false);
  const [colorCounter, setColorCounter] = useState(0);

  const navigate = useNavigate();
  const audioRefs = useRef([]);

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
      sessionStorage.getItem("topTracksWithColors")
    );
    const storedTimeRange = sessionStorage.getItem("timeRangeTracks");
    let initialColorCount = 0;

    if (storedData && storedTimeRange === timeRange) {
      initialColorCount = storedData.length;
      setColorCounter(initialColorCount);
    } else {
      setColorCounter(0);
    }

    if (token) {
      const tracks = await fetchTopTracks(token, limit, timeRange);
      let colorsArray = [];

      const updatedTracks = await Promise.all(
        tracks.map(async (track) => {
          const storedTrack = storedData
            ? storedData.find((stored) => stored.index === track.index)
            : null;
          if (storedTrack && storedTrack.id === track.id) {
            return storedTrack;
          } else {
            const colors = await fetchColors(track.imageUrl);
            colorsArray.push({ index: track.index, colors });
            setColorCounter((prevCounter) => prevCounter + 1);
            return { ...track, colors };
          }
        })
      );

      if (storedData && storedData.length > updatedTracks.length) {
        const indicesToRemove = storedData
          .slice(updatedTracks.length)
          .map((track) => track.index);
        colorsArray = colorsArray.filter(
          (colorObj) => !indicesToRemove.includes(colorObj.index)
        );
      }

      setTopTracks(updatedTracks);
      audioRefs.current.forEach((audio) => {
        audio.pause();
      });
      sessionStorage.setItem(
        "topTracksWithColors",
        JSON.stringify(updatedTracks)
      );
      sessionStorage.setItem("colorsTracks", JSON.stringify(colorsArray));
      sessionStorage.setItem("limitTracks", limit);
      sessionStorage.setItem("timeRangeTracks", timeRange);
      sessionStorage.setItem("hasRings", JSON.stringify(hasRings));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const storedData = JSON.parse(
      sessionStorage.getItem("topTracksWithColors")
    );
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");

    // Si no está autenticado, establecer isAuthenticated en true
    if (!isAuthenticated) {
      sessionStorage.setItem("isAuthenticated", "true");
      window.dispatchEvent(new Event("storage"));
    }

    const updateTracks = async () => {
      let token;

      if (isAuthenticated) {
        // Obtener el token del sessionStorage si ya está autenticado
        token = sessionStorage.getItem("token");
      } else {
        // Si no está autenticado, manejar el callback para obtener el token
        token = await handleCallback();
      }

      if (token) {
        const tracks = await fetchTopTracks(token, limit, timeRange);
        let colorsArray = [];

        const updatedTracks = await Promise.all(
          tracks.map(async (track) => {
            const storedTrack = storedData
              ? storedData.find((stored) => stored.index === track.index)
              : null;
            if (storedTrack && storedTrack.id === track.id) {
              return storedTrack;
            } else {
              const colors = await fetchColors(track.imageUrl);
              colorsArray.push({ index: track.index, colors });
              setColorCounter((prevCounter) => prevCounter + 1);
              return { ...track, colors };
            }
          })
        );

        if (storedData && storedData.length > updatedTracks.length) {
          const indicesToRemove = storedData
            .slice(updatedTracks.length)
            .map((track) => track.index);
          colorsArray = colorsArray.filter(
            (colorObj) => !indicesToRemove.includes(colorObj.index)
          );
        }

        setTopTracks(updatedTracks);
        sessionStorage.setItem(
          "topTracksWithColors",
          JSON.stringify(updatedTracks)
        );
        sessionStorage.setItem("colorsTracks", JSON.stringify(colorsArray));
        sessionStorage.setItem(
          "authUrlTracks",
          `http://planetify-frontend.s3-website.us-east-2.amazonaws.com/callback?code=${code}&state=${state}`
        );
        sessionStorage.setItem("limitTracks", limit);
        sessionStorage.setItem("timeRangeTracks", timeRange);
        sessionStorage.setItem("hasRings", JSON.stringify(hasRings));
        redirect(`?code=${code}&state=${state}`);
      }
    };

    sessionStorage.setItem("updatedTracks", JSON.stringify(true));

    if (storedData) {
      setTopTracks(storedData);
      updateTracks();
    } else if (code) {
      updateTracks();
    }
  }, [code, state, navigate]);

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
  }, [currentSlide, topTracks]);

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
  }, [currentSlide, topTracks]);

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const newSlide = prev === topTracks.length - 1 ? 0 : prev + 1;
      if (audioRefs.current[prev]) {
        audioRefs.current[prev].pause();
        audioRefs.current[prev].currentTime = 0;
      }
      return newSlide;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const newSlide = prev === 0 ? topTracks.length - 1 : prev - 1;
      if (audioRefs.current[prev]) {
        audioRefs.current[prev].pause();
        audioRefs.current[prev].currentTime = 0;
      }
      return newSlide;
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
      {topTracks.length > 0 ? (
        <>
          <div className="type-planet-content-callback-page">
            <div className="type-planet-content-callback-page-inside">
              <div className="terms-callback-page">
                <h5 className="track-info-data-header-5">
                  {timeRange === "short_term"
                    ? "LAST MONTH"
                    : timeRange === "medium_term"
                    ? "LAST 6 MONTHS"
                    : "LAST YEAR"}
                </h5>
              </div>
              <h1 className="header-callback-page">TOP {limit} TRACKS</h1>
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
              {topTracks.map((track, index) => {
                const lightestColors = findLightestColors(track.colors);
                return (
                  <div className="slide" key={index}>
                    <div className="track-planet">
                      <PlanetStats
                        key={track.id}
                        imageUrl={track.imageUrl}
                        colors={track.colors}
                        planetInclination={track.popularity}
                        hasRings={hasRings}
                      />
                    </div>
                    <div className="track-info">
                      <img
                        className="track-info-img"
                        src={track.imageUrl}
                        alt={track.name}
                      />
                      <div className="track-info-data">
                        <a
                          href={track.externalUrl}
                          target="_blank"
                          style={{ cursor: "pointer" }}
                        >
                          <h2
                            style={{
                              color: `rgb(${lightestColors[0].join(",")})`,
                            }}
                            className="track-info-data-header-2"
                          >
                            #{track.index} - {track.name}
                          </h2>
                        </a>
                        <h3 className="track-info-data-header-3">
                          {track.artist}
                        </h3>
                        <h4 className="track-info-data-header-4">
                          {track.album}
                        </h4>
                        <audio
                          ref={(el) => (audioRefs.current[index] = el)}
                          src={track.previewUrl}
                        />
                        <br />
                        <hr />
                        <br />
                        <h3 className="track-info-data-header-3">
                          Size:{" "}
                          <span style={{ color: "#1ed760" }}>
                            {track.duration} km²
                          </span>
                        </h3>
                        <h3 className="track-info-data-header-3">
                          Population:{" "}
                          <span style={{ color: "#1ed760" }}>
                            {track.popularity}%
                          </span>
                        </h3>
                        <iframe
                          style={{ borderRadius: 12, marginTop: 20 }}
                          src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator`}
                          height="100"
                          frameBorder="0"
                          allowfullscreen=""
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        ></iframe>
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
              {topTracks.map((_, index) => (
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

export default CallbackTracks;
