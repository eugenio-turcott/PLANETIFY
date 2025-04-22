import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingApp from "./LandingApp";
import "./index.css";
import CallbackTracks from "./Callback/CallbackTracks";
import CallbackArtists from "./Callback/CallbackArtists";
import CallbackGenres from "./Callback/CallbackGenres";

const getCallbackComponent = () => {
  const statsMode = sessionStorage.getItem("statsMode");
  if (statsMode === "artists") {
    return <CallbackArtists />;
  } else if (statsMode === "genres") {
    return <CallbackGenres />;
  }
  return <CallbackTracks />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingApp />} />
      <Route path="/callback" element={getCallbackComponent()} />
    </Routes>
  );
};

export default App;
