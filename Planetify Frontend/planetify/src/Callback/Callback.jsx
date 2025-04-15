import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const query = new URLSearchParams(window.location.search);
      const code = query.get("code");

      if (code) {
        try {
          const response = await axios.get(
            `http://localhost:8000/callback?code=${code}`
          );
          const token = response.data.access_token;

          localStorage.setItem("token", token);
          localStorage.setItem("isAuthenticated", "true");

          navigate("/"); // Redirige a home o donde prefieras
        } catch (err) {
          console.error("Error obteniendo token:", err);
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Cargando...</div>;
};

export default Callback;
