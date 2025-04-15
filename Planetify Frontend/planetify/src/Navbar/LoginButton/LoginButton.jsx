import axios from "axios";
import "./LoginButton.css";

const LoginButton = () => {
  const handleLogin = async () => {
    try {
      const response = await axios.get("http://localhost:8000/login");
      const authUrl = response.data.auth_url;
      localStorage.setItem("authUrlTracks", authUrl);
      localStorage.setItem("authUrlArtists", authUrl);
      localStorage.setItem("authUrlGenres", authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div className="landing-login-button-container">
      <button
        data-cy="landing-login-button"
        className="landing-login-button"
        onClick={handleLogin}
      >
        LOG IN
      </button>
    </div>
  );
};

export default LoginButton;
