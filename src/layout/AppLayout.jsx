import { Outlet, useNavigate } from "react-router-dom";

export default function AppLayout() {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/login");
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

                <button onClick={logout} style={{ marginTop: 20 }}>
                    Cerrar sesión
                </button>
            </aside>

            {/* ACÁ SE CARGA CADA PÁGINA */}
            <main style={{ padding: 20, flex: 1 }}>
                <Outlet />
            </main>
        </div>
    );
}
