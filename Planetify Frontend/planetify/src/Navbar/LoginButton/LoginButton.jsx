import axios from "axios";
import "./LoginButton.css";

const LoginButton = () => {
  const handleLogin = async () => {
    try {
      const response = await axios.get(
        "http://ec2-3-144-1-0.us-east-2.compute.amazonaws.com:8000/login"
      );
      const { auth_url, state } = response.data;
      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("authUrlTracks", auth_url);
      sessionStorage.setItem("authUrlArtists", auth_url);
      sessionStorage.setItem("authUrlGenres", auth_url);
      window.location.href = `${auth_url}&state=${state}`;
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
