import { Outlet, useNavigate } from "react-router-dom";
import { logout as apiLogout } from "../services/api";
import { useState } from "react";

export default function AppLayout() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        setLoading(true);
        try {
            if (token) {
                await apiLogout(token);
            }
        } catch (e) {
            // If logout failed, still remove token locally but log the error
            console.error("Error calling logout endpoint:", e);
        } finally {
            localStorage.removeItem("token");
            setLoading(false);
            navigate("/login");
        }
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>

            {/* MENÚ */}
            <aside style={{
                width: 200,
                background: "#222",
                color: "white",
                padding: 20
            }}>
                <h3>Panel</h3>
                <ul>
                    <li onClick={() => navigate("/app/reservas")}>Reservas</li>
                    <li onClick={() => navigate("/app/sanciones")}>Sanciones</li>
                    <li onClick={() => navigate("/app/salas")}>Salas</li>
                    <li onClick={() => navigate("/app/perfil")}>Perfil</li>
                </ul>

                <button onClick={handleLogout} style={{ marginTop: 20 }} disabled={loading}>
                    {loading ? "Cerrando..." : "Cerrar sesión"}
                </button>
            </aside>

            {/* ACÁ SE CARGA CADA PÁGINA */}
            <main style={{ padding: 20, flex: 1 }}>
                <Outlet />
            </main>
        </div>
    );
}
