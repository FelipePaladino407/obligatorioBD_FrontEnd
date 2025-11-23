import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { updateMiPerfil } from "../services/api"; // nueva función en api.js
import "./Perfil.css";

export default function Perfil() {
    const { user, setUser, token } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        nombre: user?.nombre || "",
        apellido: user?.apellido || "",
        email: user?.email || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

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

    const getInitials = () => {
        const first = user.nombre?.[0] || "";
        const last = user.apellido?.[0] || "";
        return (first + last).toUpperCase();
    };

    const startEdit = () => {
        setEditing(true);
        setForm({
            nombre: user.nombre || "",
            apellido: user.apellido || "",
            email: user.email || "",
        });
        setError(null);
    };

    const cancelEdit = () => {
        setEditing(false);
        setForm({
            nombre: user.nombre || "",
            apellido: user.apellido || "",
            email: user.email || "",
        });
    };

    const saveEdit = async () => {
        setSaving(true);
        setError(null);
        try {
            await updateMiPerfil(form, token);

            // actualizar en memoria
            setUser({
                ...user,
                nombre: form.nombre,
                apellido: form.apellido,
                email: form.email,
            });

            setEditing(false);
        } catch (e) {
            setError(e.message || "Error al actualizar perfil");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="perfil-container">
            <div className="perfil-wrapper">
                <h2 className="perfil-title">Mi Perfil</h2>

                <div className="perfil-card">
                    <div className="perfil-header">
                        <div className="perfil-avatar">{getInitials()}</div>
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
                            {editing ? (
                                <input
                                    className="info-input"
                                    value={form.email}
                                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                />
                            ) : (
                                <span className="info-value">{user.email}</span>
                            )}
                        </div>

                        <div className="info-row">
                            <span className="info-label">Nombre</span>
                            {editing ? (
                                <input
                                    className="info-input"
                                    value={form.nombre}
                                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                                />
                            ) : (
                                <span className="info-value">{user.nombre}</span>
                            )}
                        </div>

                        <div className="info-row">
                            <span className="info-label">Apellido</span>
                            {editing ? (
                                <input
                                    className="info-input"
                                    value={form.apellido}
                                    onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                                />
                            ) : (
                                <span className="info-value">{user.apellido}</span>
                            )}
                        </div>
                    </div>

                    <div className="perfil-actions">
                        {!editing ? (
                            <button className="btn-primary" onClick={startEdit}>
                                Editar Perfil
                            </button>
                        ) : (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={saveEdit}
                                    disabled={saving}
                                >
                                    {saving ? "Guardando..." : "Guardar"}
                                </button>
                                <button className="btn-secondary" onClick={cancelEdit}>
                                    Cancelar
                                </button>
                            </>
                        )}
                    </div>
                    {error && <div style={{ color: "tomato" }}>{error}</div>}
                </div>
            </div>
        </div>
    );
}
