import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import LoginButton from "./LoginButton/LoginButton";
import LogoutButton from "./LogoutButton/LogoutButton";
import PlanetifyLogo from "../assets/Planetify_Logo2.png";
import "./Navbar.css";
import axios from "axios";

const fetchCurrentPlayingTrack = async (
  token,
  setCurrentTrack,
  setLastTrack
) => {
  try {
    const currentPlayingTrackResponse = await axios.get(
      `http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/current_playing_track/?token=${token}`
    );

    const data = currentPlayingTrackResponse.data;

    const currentTrack = {
      current_track_url: data.item.external_urls.spotify,
      progress_track: data.progress_ms,
      duration_track: data.item.duration_ms,
      album_name_track: data.item.album.name,
      album_image_track: data.item.album.images[0].url,
      album_artists_track: data.item.album.artists
        .map((artist) => artist.name)
        .join(", "),
      id_track: data.item.id,
      name_track: data.item.name,
      popularity_track: data.item.popularity,
      type_track: data.currently_playing_type,
      is_playing: data.is_playing,
    };

    setCurrentTrack(currentTrack);
    setLastTrack(data);
  } catch (error) {}
};

const fetchSkipToPreviousTrack = async (token) => {
  try {
    await axios.post(
      `http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/skip_to_previous_track/?token=${token}`
    );
  } catch (error) {
    console.error("Error skipping to previous track:", error);
  }
};

const fetchSkipToNextTrack = async (token) => {
  try {
    await axios.post(
      `http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/skip_to_next_track/?token=${token}`
    );
  } catch (error) {
    console.error("Error skipping to next track:", error);
  }
};

const fetchPauseCurrentTrack = async (token) => {
  try {
    await axios.post(
      `http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/pause_current_track/?token=${token}`
    );
  } catch (error) {
    console.error("Error pausing current track:", error);
  }
};

const fetchResumeCurrentTrack = async (token) => {
  try {
    await axios.post(
      `http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/resume_current_track/?token=${token}`
    );
  } catch (error) {
    console.error("Error resuming current track:", error);
  }
};

const formatTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const Navbar = ({ autoHide }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem("isAuthenticated") === "true"
  );
  const [authUrlTracks, setAuthUrlTracks] = useState(
    sessionStorage.getItem("authUrlTracks")
  );
  const [authUrlArtists, setAuthUrlArtists] = useState(
    sessionStorage.getItem("authUrlArtists")
  );
  const [authUrlGenres, setAuthUrlGenres] = useState(
    sessionStorage.getItem("authUrlGenres")
  );
  const [isVisible, setIsVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(window.scrollY);
  const [currentTrack, setCurrentTrack] = useState({});
  const [lastTrack, setLastTrack] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [progressTrack, setProgressTrack] = useState(0);

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const hideBar = () => {
    const newScrollPos = window.scrollY;
    const isVisible = prevScrollPos > newScrollPos || newScrollPos === 0;
    setPrevScrollPos(newScrollPos);
    setIsVisible(isVisible);
  };

  const debouncedHideBar = debounce(hideBar, 10);

  useEffect(() => {
    const handleScroll = () => {
      debouncedHideBar();
    };

    const handleStorageChange = () => {
      const isAuthenticated =
        sessionStorage.getItem("isAuthenticated") === "true";
      const authUrlTracks = sessionStorage.getItem("authUrlTracks");
      const authUrlArtists = sessionStorage.getItem("authUrlArtists");
      const authUrlGenres = sessionStorage.getItem("authUrlGenres");
      setIsAuthenticated(isAuthenticated);
      setAuthUrlTracks(authUrlTracks);
      setAuthUrlArtists(authUrlArtists);
      setAuthUrlGenres(authUrlGenres);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [debouncedHideBar]);

  let tokenExterno = sessionStorage.getItem("token");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    window.dispatchEvent(new Event("storage"));

    const fetchTrackData = () => {
      if (isAuthenticated && token) {
        fetchCurrentPlayingTrack(token, setCurrentTrack, setLastTrack);
      }
    };

    const intervalId = setInterval(() => {
      fetchTrackData();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentTrack.is_playing) {
        setProgressTrack((prev) => prev + 1000);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentTrack.is_playing]);

  useEffect(() => {
    setProgressTrack(currentTrack.progress_track);
  }, [currentTrack]);

  useEffect(() => {
    if (progressTrack >= currentTrack.duration_track) {
      fetchCurrentPlayingTrack(tokenExterno, setCurrentTrack, setLastTrack);
    }
  }, [progressTrack, currentTrack.duration_track]);

  const handleLogout = () => {
    const token = sessionStorage.getItem("token");
    axios.get(
      `http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com/logout/?token=${token}`
    );
    sessionStorage.clear();
    window.location.href = "https://accounts.spotify.com/logout";
  };

  const setStatsMode = (mode) => {
    const keysToKeep = [
      "authUrlTracks",
      "authUrlArtists",
      "authUrlGenres",
      "colorsArtists",
      "colorsTracks",
      "colorsGenres",
      "currentColorsPlanetLanding",
      "hasRingsPlanetLanding",
      "isAuthenticated",
      "limitArtists",
      "limitGenres",
      "limitTracks",
      "token",
      "selectedIndex",
      "topTracksWithColors",
      "updatedTracks",
      "topArtistsWithColors",
      "updatedArtists",
      "topGenresWithColors",
      "updatedGenres",
      "timeRangeArtists",
      "timeRangeTracks",
      "timeRangeGenres",
    ];
    Object.keys(sessionStorage).forEach((key) => {
      if (!keysToKeep.includes(key)) {
        sessionStorage.removeItem(key);
      }
    });
    sessionStorage.setItem("statsMode", mode);
  };

  let classHide = "visible";
  if (autoHide && !isVisible) {
    classHide = "hidden";
  }

  const progress = (progressTrack / currentTrack.duration_track) * 100;

  return (
    <header className={classHide}>
      <nav className={`navbar-positioning ${classHide}`}>
        <div data-cy="navbar" className="navbar glass-card" height="1rem">
          <Link
            className="logo-container"
            to={"/"}
            style={{ cursor: "pointer" }}
          >
            <img src={PlanetifyLogo} alt="Logo" className="logo" />
            <h1 className="planetify">PLANETIFY</h1>
          </Link>
          {isAuthenticated && (
            <>
              <a
                href={authUrlTracks}
                style={{ cursor: "pointer" }}
                onClick={() => setStatsMode("tracks")}
              >
                TRACKS
              </a>
              <a
                href={authUrlArtists}
                style={{ cursor: "pointer" }}
                onClick={() => setStatsMode("artists")}
              >
                ARTISTS
              </a>
              <a
                href={authUrlGenres}
                style={{ cursor: "pointer" }}
                onClick={() => setStatsMode("genres")}
              >
                GENRES
              </a>
            </>
          )}
          {isAuthenticated ? (
            <div style={{ display: "flex" }}>
              {currentTrack.id_track && (
                <button
                  className={`button-current-playing-track ${
                    currentTrack.is_playing ? "track-playing" : "track-paused"
                  }`}
                  onClick={() => setShowPopup((prev) => !prev)}
                >
                  <img
                    className="img-current-playing-track"
                    src={currentTrack.album_image_track}
                  />
                </button>
              )}
              {showPopup && (
                <>
                  <div
                    className={`popup-navbar-overlay ${
                      currentTrack.is_playing
                        ? "popup-navbar-overlay-green"
                        : "popup-navbar-overlay-red"
                    }`}
                  >
                    <div className="popup-navbar-content">
                      <img
                        className={`img-popup-current-playing-track ${
                          currentTrack.is_playing
                            ? "img-popup-current-playing-track-green"
                            : "img-popup-current-playing-track-red"
                        }`}
                        src={currentTrack.album_image_track}
                      />
                      <div className="popup-navbar-content-general">
                        <a
                          href={currentTrack.current_track_url}
                          target="_blank"
                        >
                          <h2 style={{ color: "#1ed760" }}>
                            {currentTrack.name_track}
                          </h2>
                        </a>
                        <h4>
                          {currentTrack.album_artists_track} -{" "}
                          {currentTrack.album_name_track}
                        </h4>
                        <div className="popup-navbar-content-playback">
                          <button
                            className="button-navbar-callback-page"
                            onClick={() => {
                              fetchSkipToPreviousTrack(tokenExterno);
                              fetchCurrentPlayingTrack(
                                tokenExterno,
                                setCurrentTrack,
                                setLastTrack
                              );
                            }}
                          >
                            <i className="fa-solid fa-backward-step button-callback-page-inside"></i>
                          </button>
                          {currentTrack.is_playing ? (
                            <button
                              className="button-navbar-callback-page"
                              onClick={() => {
                                fetchPauseCurrentTrack(tokenExterno);
                                fetchCurrentPlayingTrack(
                                  tokenExterno,
                                  setCurrentTrack,
                                  setLastTrack
                                );
                              }}
                            >
                              <i className="fa-solid fa-pause button-callback-page-inside"></i>
                            </button>
                          ) : (
                            <button
                              className="button-navbar-callback-page"
                              onClick={() => {
                                fetchResumeCurrentTrack(tokenExterno);
                                fetchCurrentPlayingTrack(
                                  tokenExterno,
                                  setCurrentTrack,
                                  setLastTrack
                                );
                              }}
                            >
                              <i className="fa-solid fa-play button-callback-page-inside"></i>
                            </button>
                          )}
                          <button
                            className="button-navbar-callback-page"
                            onClick={() => {
                              fetchSkipToNextTrack(tokenExterno);
                              fetchCurrentPlayingTrack(
                                tokenExterno,
                                setCurrentTrack,
                                setLastTrack
                              );
                            }}
                          >
                            <i className="fa-solid fa-forward-step button-callback-page-inside"></i>
                          </button>
                        </div>
                        <div className="popup-navbar-content-progress-bar">
                          <h4 style={{ marginRight: "15px" }}>
                            {formatTime(progressTrack)}
                          </h4>
                          <div className="loading-bar">
                            <div
                              className="loading-bar-progress"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <h4 style={{ marginLeft: "15px" }}>
                            {formatTime(currentTrack.duration_track)}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <LogoutButton onLogout={handleLogout} />
            </div>
          ) : (
            <LoginButton />
          )}
        </div>
      </nav>
    </header>
  );
};

Navbar.propTypes = {
  autoHide: PropTypes.bool,
};

export default Navbar;
