import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // --- LOGIN ---
      const res = await fetch("http://127.0.0.1:8080/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email, contrasena: password }),
      });
      
      if (!res.ok) throw new Error("Credenciales inválidas");
      
      const data = await res.json();
      localStorage.setItem("token", data.token);

      // --- PEDIR DATOS DEL USUARIO ---
      const me = await fetch("http://127.0.0.1:8080/api/v1/participante/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });
      
      if (!me.ok) throw new Error("No se pudo obtener el usuario");
      
      const userData = await me.json();
      // Se asume que el backend ya incluye is_admin en userData (o se deriva internamente)
      setUser(userData);

      // Notificar login OK
      onLogin();

      // Navegar
      navigate("/app/reservas");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-text">UCU Reservas</div>
        </div>

        <div className="login-header">
          <h2 className="login-title">Iniciar Sesión</h2>
          <p className="login-subtitle">Ingrese sus credenciales para continuar</p>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
              disabled={loading}
            />
          </div>

          <button 
            onClick={handleSubmit} 
            className="login-button"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="login-footer">
          <p className="login-footer-text">
            ¿Necesitas ayuda? <a href="#" className="login-footer-link">Manejate</a>
          </p>
        </div>
      </div>
    </div>
  );
}