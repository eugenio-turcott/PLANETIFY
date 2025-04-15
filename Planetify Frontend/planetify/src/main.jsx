import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import "./index.css";
import CallbackTracks from "./Callback/CallbackTracks";
import CallbackArtists from "./Callback/CallbackArtists";
import CallbackGenres from "./Callback/CallbackGenres";
import CallbackGeneral from "./Callback/CallbackGeneral";

const root = ReactDOM.createRoot(document.getElementById("root"));

const getCallbackComponent = () => {
  const statsMode = localStorage.getItem("statsMode");
  if (statsMode === "artists") {
    return <CallbackArtists />;
  } else if (statsMode === "genres") {
    return <CallbackGenres />;
  }
  return <CallbackTracks />;
};

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/callback" element={getCallbackComponent()} />
        <Route path="/callback/general" element={<CallbackGeneral />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
