import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { logout as apiLogout } from "../services/api";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AppLayout.css";

export default function AppLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        setLoading(true);
        try {
            if (token) {
                await apiLogout(token);
            }
        } catch (e) {
            console.error("Error calling logout endpoint:", e);
        } finally {
            localStorage.removeItem("token");
            setLoading(false);
            navigate("/login");
        }
    };

    const isActive = (path) => {
        return location.pathname === path ? "active" : "";
    };

    return (
        <div className="app-layout">
            {/* SIDEBAR */}
            <aside className="app-sidebar">
                <div className="sidebar-header">
                    <h3 className="sidebar-title">Sistema de Reservas</h3>
                    <p className="sidebar-subtitle">Panel de Control</p>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        <li
                            className={`nav-item ${isActive("/app/reservas")}`}
                            onClick={() => navigate("/app/reservas")}
                        >
                            <span className="nav-icon">📅</span>
                            <span>Reservas</span>
                        </li>
                        <li
                            className={`nav-item ${isActive("/app/sanciones")}`}
                            onClick={() => navigate("/app/sanciones")}
                        >
                            <span className="nav-icon">⚠️</span>
                            <span>Sanciones</span>
                        </li>
                        <li
                            className={`nav-item ${isActive("/app/salas")}`}
                            onClick={() => navigate("/app/salas")}
                        >
                            <span className="nav-icon">🏢</span>
                            <span>Salas</span>
                        </li>

                        <li
                            className={`nav-item ${isActive("/app/incidencias")}`}
                            onClick={() => navigate("/app/incidencias")}
                        >
                            <span className="nav-icon">🛠️</span>
                            <span>Incidencias</span>
                        </li>

                        <li
                            className={`nav-item ${isActive("/app/perfil")}`}
                            onClick={() => navigate("/app/perfil")}
                        >
                            <span className="nav-icon">👤</span>
                            <span>Perfil</span>
                        </li>
                        {user?.is_admin && (
                            <li
                                className={`nav-item ${isActive("/app/reportes")}`}
                                onClick={() => navigate("/app/reportes")}
                            >
                                <span className="nav-icon">📊</span>
                                <span>Reportes</span>
                            </li>
                        )}
                        {user?.is_admin && (
                            <li
                                className={`nav-item ${isActive("/app/usuarios")}`}
                                onClick={() => navigate("/app/usuarios")}
                            >
                                <span className="nav-icon">👥</span>
                                <span>Participantes</span>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button
                        onClick={handleLogout}
                        className="logout-button"
                        disabled={loading}
                    >
                        <span>🚪</span>
                        <span>{loading ? "Cerrando..." : "Cerrar sesión"}</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="app-main">
                <div className="main-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
