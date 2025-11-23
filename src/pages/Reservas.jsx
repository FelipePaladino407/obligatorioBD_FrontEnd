import { useEffect, useState } from "react";
import { getSalas, getReservas, createReserva, cancelReserva, deleteReserva, getReservasAll } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Reservas.css";

export default function Reservas() {
    const { user } = useAuth();

    const [misReservas, setMisReservas] = useState([]);      // antes: reservas
    const [todasReservas, setTodasReservas] = useState([]);  // solo para admin
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [selectedSala, setSelectedSala] = useState("");
    const [fecha, setFecha] = useState("");
    const [turno, setTurno] = useState(1);
    const [participantes, setParticipantes] = useState("");

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const isValidCI = (ci) => /^\d{7,8}$/.test(ci);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const load = async () => {
            try {
                setLoading(true);

                // siempre cargo mis reservas + salas
                const [salaList, mis] = await Promise.all([
                    getSalas(token),
                    getReservas(token),
                ]);
                setSalas(salaList || []);
                setMisReservas(mis?.reservas || mis || []);

                // si es admin, cargo también todas las reservas del sistema
                if (user?.is_admin) {
                    const all = await getReservasAll(token);
                    setTodasReservas(all?.reservas || all || []);
                } else {
                    setTodasReservas([]);
                }
            } catch (e) {
                setError("No se pudo conectar con el servidor");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [token, navigate, user?.is_admin]);

    const handleCreate = async () => {
        // ...existing validations...
        setError(null);
        setSuccess(false);

        // ...existing payload build...
        const [nombre_sala, edificio] = selectedSala.split("|||");
        const rawParticipantes = participantes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const participantes_ci = rawParticipantes
            .map((ci) => ci.replace(/\D/g, ""))
            .filter(Boolean);

        const invalids = participantes_ci.filter((ci) => !isValidCI(ci));
        if (invalids.length > 0) {
            setError("CI inválida");
            return;
        }

        const userCi = String(user?.ci || "").replace(/\D/g, "");
        if (!userCi || !isValidCI(userCi)) {
            setError("Tu CI de usuario es inválida o no está disponible");
            return;
        }
        if (!participantes_ci.includes(userCi)) {
            participantes_ci.push(userCi);
        }

        const payload = {
            participantes_ci,
            nombre_sala,
            edificio,
            fecha,
            id_turno: Number(turno),
            estado: "ACTIVA",
        };

        try {
            await createReserva(payload, token);

            // refrescar mis reservas
            const mis = await getReservas(token);
            setMisReservas(mis?.reservas || mis || []);

            // si es admin, refrescar todas
            if (user?.is_admin) {
                const all = await getReservasAll(token);
                setTodasReservas(all?.reservas || all || []);
            }

            setSelectedSala("");
            setFecha("");
            setTurno(1);
            setParticipantes("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            // ...existing error mapping...
            const backendMsg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                e?.message ||
                "";
            let uiMsg = "Error al crear reserva";
            if (/list index out of range/i.test(backendMsg)) {
                uiMsg = "CI inválida";
            } else if (/not found|no existe/i.test(backendMsg)) {
                uiMsg = "CI no encontrada en el sistema";
            } else if (/invalid|bad request|400/i.test(backendMsg)) {
                uiMsg = "Datos inválidos, revisa la información ingresada";
            } else if (backendMsg) {
                uiMsg = backendMsg;
            }
            setError(uiMsg);
            console.error(e);
        }
    };

    const handleDelete = async (id, source = "user") => {
        setError(null);
        setSuccess(false);

        const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId <= 0) {
            console.error("handleDelete: id inválido", { id, source });
            setError("No se pudo eliminar: identificador de reserva inválido");
            return;
        }

        try {
            await deleteReserva(numericId, token);

            const mis = await getReservas(token);
            setMisReservas(mis?.reservas || mis || []);

            if (user?.is_admin) {
                const all = await getReservasAll(token);
                setTodasReservas(all?.reservas || all || []);
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            const backendMsg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                e?.message ||
                "";
            console.error("Error en deleteReserva", { id: numericId, source, error: e, backendMsg });
            setError(backendMsg || "Error al eliminar reserva");
        }
    };

    const handleCancel = async (id, source = "user") => {
        setError(null);
        setSuccess(false);

        const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId <= 0) {
            console.error("handleCancel: id inválido", { id, source });
            setError("No se pudo cancelar: identificador de reserva inválido");
            return;
        }

        try {
            await cancelReserva(numericId, token);

            const mis = await getReservas(token);
            setMisReservas(mis?.reservas || mis || []);

            if (user?.is_admin) {
                const all = await getReservasAll(token);
                setTodasReservas(all?.reservas || all || []);
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            const backendMsg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                e?.message ||
                "";
            console.error("Error en cancelReserva", { id: numericId, source, error: e, backendMsg });
            setError(backendMsg || "Error al cancelar reserva");
        }
    };

    return (
        <div className="reservas-container">
            <div className="reservas-wrapper">
                <h2 className="reservas-title">Reservas</h2>

                {loading ? (
                    // ...existing loading card...
                    <div className="loading-card">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Cargando...</p>
                    </div>
                ) : (
                    <div className="reservas-grid">
                        {/* Nueva Reserva - sin cambios visuales */}
                        {/* ...existing "Nueva Reserva" section (card + form)... */}
                        <section className="card">
                            <h3 className="section-header">
                                <span className="section-icon">+</span>
                                Nueva Reserva
                            </h3>
                            <div className="form-container">
                                <label className="form-label">
                                    <span className="form-label-text">Sala</span>
                                    <select
                                        value={selectedSala}
                                        onChange={(e) => setSelectedSala(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">-- Seleccione una sala --</option>
                                        {salas.map((s) => (
                                            <option
                                                key={`${s.nombre_sala}-${s.edificio}`}
                                                value={`${s.nombre_sala}|||${s.edificio}`}
                                            >
                                                {s.nombre_sala} — {s.edificio} ({s.capacidad} pers, {s.tipo_sala})
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="form-label">
                                    <span className="form-label-text">Fecha</span>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        className="form-input"
                                    />
                                </label>

                                <label className="form-label">
                                    <span className="form-label-text">Turno</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={turno}
                                        onChange={(e) => setTurno(Number(e.target.value))}
                                        className="form-input"
                                    />
                                </label>

                                <label className="form-label">
                                    <span className="form-label-text">Participantes (CI separados por coma)</span>
                                    <input
                                        type="text"
                                        value={participantes}
                                        onChange={(e) => setParticipantes(e.target.value)}
                                        placeholder="12345678, 87654321"
                                        className="form-input"
                                    />
                                </label>

                                <button onClick={handleCreate} className="btn-submit">
                                    Crear Reserva
                                </button>

                                {error && <div className="alert alert-error">⚠️ {error}</div>}
                                {success && (
                                    <div className="alert alert-success">✓ Acción realizada exitosamente</div>
                                )}
                            </div>
                        </section>

                        {/* Mis Reservas */}
                        <section className="card">
                            <h3 className="section-header">
                                <span className="section-icon">📋</span>
                                Mis Reservas
                            </h3>
                            {misReservas.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📅</div>
                                    <p>No hay reservas aún</p>
                                </div>
                            ) : (
                                <div className="reservations-list">
                                    {misReservas.map((r) => {
                                        const estadoNorm = String(r.estado || "").toLowerCase().trim();
                                        return (
                                            <div key={r.id_reserva} className="reservation-item">
                                                <div className="reservation-content">
                                                    <div className="reservation-info">
                                                        <div className="reservation-name">{r.nombre_sala}</div>
                                                        <div className="reservation-details">
                                                            📅 {r.fecha} • 🏢 {r.edificio}
                                                        </div>
                                                    </div>
                                                    <div className="reservation-actions">
                                                        <div
                                                            className={`reservation-status ${estadoNorm === "activa" ? "status-active" : "status-inactive"
                                                                }`}
                                                        >
                                                            {r.estado}
                                                        </div>

                                                        {estadoNorm === "activa" && (
                                                            <button
                                                                className="btn-cancel"
                                                                onClick={() => handleCancel(r.id_reserva, "user")}
                                                            >
                                                                ❌ Cancelar
                                                            </button>
                                                        )}

                                                        {user?.is_admin && (
                                                            <button
                                                                className="btn-delete"
                                                                onClick={() => handleDelete(r.id_reserva, "user")}
                                                                style={{ marginLeft: "8px", backgroundColor: "red", color: "white" }}
                                                            >
                                                                🗑️ Eliminar
                                                            </button>
                                                        )}

                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Todas las Reservas (solo admin) */}
                        {user?.is_admin && (
                            <section className="card">
                                <h3 className="section-header">
                                    <span className="section-icon">🌐</span>
                                    Todas las Reservas (Admin)
                                </h3>
                                {todasReservas.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📅</div>
                                        <p>No hay reservas en el sistema</p>
                                    </div>
                                ) : (
                                    <div className="reservations-list">
                                        {todasReservas.map((r) => {
                                            const estadoNorm = String(r.estado || "").toLowerCase().trim();
                                            const idReserva = r.id_reserva ?? r.id; // usar el mismo id que el backend espera
                                            console.debug("Reserva admin render", { r, idReserva });
                                            return (
                                                <div key={idReserva} className="reservation-item">
                                                    <div className="reservation-content">
                                                        <div className="reservation-info">
                                                            <div className="reservation-name">
                                                                {r.nombre_sala} — {r.edificio}
                                                            </div>
                                                            <div className="reservation-details">
                                                                📅 {r.fecha}
                                                                {r.participantes && r.participantes.length > 0 && (
                                                                    <> • 👥 {r.participantes.join(", ")}</>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="reservation-actions">
                                                            <div
                                                                className={`reservation-status ${estadoNorm === "activa" ? "status-active" : "status-inactive"
                                                                    }`}
                                                            >
                                                                {r.estado}
                                                            </div>

                                                            {estadoNorm === "activa" && (
                                                                <button
                                                                    className="btn-cancel"
                                                                    onClick={() => handleCancel(idReserva, "admin")}
                                                                >
                                                                    ❌ Cancelar
                                                                </button>
                                                            )}

                                                            <button
                                                                className="btn-delete"
                                                                onClick={() => handleDelete(idReserva, "admin")}
                                                                style={{ marginLeft: "8px", backgroundColor: "red", color: "white" }}
                                                            >
                                                                🗑️ Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
