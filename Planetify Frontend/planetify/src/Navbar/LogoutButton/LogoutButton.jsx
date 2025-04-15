import { useNavigate } from "react-router-dom";
import "./LogoutButton.css";

const LogoutButton = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    onLogout();
    navigate("/");
  };

  return (
    <div className="landing-logout-button-container">
      <button
        data-cy="landing-logout-button"
        className="landing-logout-button"
        onClick={handleLogout}
      >
        LOG OUT
      </button>
    </div>
  );
};

export default LogoutButton;
