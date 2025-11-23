import { useAuth } from "../context/AuthContext";
import "./Perfil.css";

export default function Perfil() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="loading-container">
                <div className="loading-card">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Cargando...</p>
                </div>
            </div>
        );
    }

    // Get initials for avatar
    const getInitials = () => {
        const first = user.nombre?.[0] || "";
        const last = user.apellido?.[0] || "";
        return (first + last).toUpperCase();
    };

    return (
        <div className="perfil-container">
            <div className="perfil-wrapper">
                <h2 className="perfil-title">Mi Perfil</h2>

                <div className="perfil-card">
                    <div className="perfil-header">
                        <div className="perfil-avatar">
                            {getInitials()}
                        </div>
                        <div className="perfil-header-info">
                            <div className="perfil-name">
                                {user.nombre} {user.apellido}
                            </div>
                            <div className="perfil-role">
                                {user.rol} · {user.tipo_programa}
                            </div>
                        </div>
                    </div>

                    <div className="perfil-info">
                        <div className="info-row">
                            <span className="info-label">Correo Electrónico</span>
                            <span className="info-value">{user.email}</span>
                        </div>

                        <div className="info-row">
                            <span className="info-label">Cédula de Identidad</span>
                            <span className="info-value">{user.ci}</span>
                        </div>

                        <div className="info-row">
                            <span className="info-label">Carrera</span>
                            <span className="info-value">{user.carrera}</span>
                        </div>

                        <div className="info-row">
                            <span className="info-label">Facultad</span>
                            <span className="info-value">{user.facultad}</span>
                        </div>

                        <div className="info-row">
                            <span className="info-label">Tipo de Programa</span>
                            <span className="info-value">{user.tipo_programa}</span>
                        </div>

                        <div className="info-row">
                            <span className="info-label">Rol</span>
                            <span className="info-value">{user.rol}</span>
                        </div>
                    </div>

                    <div className="perfil-actions">
                        <button className="btn-primary">
                            Editar Perfil
                        </button>
                        {user.is_admin && (
                            <button className="btn-secondary">
                                Administrar Usuarios
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
