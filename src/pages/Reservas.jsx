import { useEffect, useState } from "react";
import { getSalas, getReservas, createReserva, cancelReserva, deleteReserva, getReservasAll } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Reservas.css";

export default function Reservas() {
    const { user } = useAuth();

    const TURNOS = [
        { id: 1, label: "08:00 - 09:00" },
        { id: 2, label: "09:00 - 10:00" },
        { id: 3, label: "10:00 - 11:00" },
        { id: 4, label: "11:00 - 12:00" },
        { id: 5, label: "12:00 - 13:00" },
        { id: 6, label: "13:00 - 14:00" },
        { id: 7, label: "14:00 - 15:00" },
        { id: 8, label: "15:00 - 16:00" },
        { id: 9, label: "16:00 - 17:00" },
        { id: 10, label: "17:00 - 18:00" },
        { id: 11, label: "18:00 - 19:00" },
        { id: 12, label: "19:00 - 20:00" },
        { id: 13, label: "20:00 - 21:00" },
        { id: 14, label: "21:00 - 22:00" },
        { id: 15, label: "22:00 - 23:00" },
    ];

    const getTurnoLabel = (idTurno) => {
        const t = TURNOS.find((x) => x.id === Number(idTurno));
        return t ? t.label : `Turno ${idTurno}`;
    };

    const [misReservas, setMisReservas] = useState([]);
    const [todasReservas, setTodasReservas] = useState([]);
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [selectedSala, setSelectedSala] = useState("");
    const [fecha, setFecha] = useState("");
    const [turno, setTurno] = useState(1);
    const [hasTurnoExtra, setHasTurnoExtra] = useState(false);
    const [turnoExtra, setTurnoExtra] = useState(2);
    const [participantes, setParticipantes] = useState("");

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const isValidCI = (ci) => /^\d{7,8}$/.test(ci);

    // 🔥 fecha mínima = hoy
    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const load = async () => {
            try {
                setLoading(true);

                const [salaList, mis] = await Promise.all([
                    getSalas(token),
                    getReservas(token),
                ]);
                setSalas(salaList || []);
                setMisReservas(mis?.reservas || mis || []);

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
        setError(null);
        setSuccess(false);

        // ⛔ NO permitir crear una reserva en una fecha pasada
        if (!fecha || fecha < today) {
            setError("No se puede reservar para fechas pasadas");
            return;
        }

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

        const payloadBase = {
            participantes_ci,
            nombre_sala,
            edificio,
            fecha,
            estado: "ACTIVA",
        };

        const turnosAReservar = [Number(turno)];
        if (hasTurnoExtra) {
            const extraId = Number(turnoExtra);
            if (!turnosAReservar.includes(extraId)) {
                turnosAReservar.push(extraId);
            }
        }

        try {
            for (const idTurno of turnosAReservar) {
                const payload = { ...payloadBase, id_turno: idTurno };
                await createReserva(payload, token);
            }

            const mis = await getReservas(token);
            setMisReservas(mis?.reservas || mis || []);

            if (user?.is_admin) {
                const all = await getReservasAll(token);
                setTodasReservas(all?.reservas || all || []);
            }

            setSelectedSala("");
            setFecha("");
            setTurno(1);
            setHasTurnoExtra(false);
            setTurnoExtra(2);
            setParticipantes("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
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
            setError(backendMsg || "Error al eliminar reserva");
        }
    };

    const handleCancel = async (id, source = "user") => {
        setError(null);
        setSuccess(false);

        const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId <= 0) {
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
            setError(backendMsg || "Error al cancelar reserva");
        }
    };

    return (
        <div className="reservas-container">
            <div className="reservas-wrapper">
                <h2 className="reservas-title">Reservas</h2>

                {loading ? (
                    <div className="loading-card">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Cargando...</p>
                    </div>
                ) : (
                    <div className="reservas-grid">

                        {/* NUEVA RESERVA */}
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
                                        min={today}
                                        onChange={(e) => setFecha(e.target.value)}
                                        className="form-input"
                                    />
                                </label>

                                <label className="form-label">
                                    <span className="form-label-text">Turno</span>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <select
                                            value={turno}
                                            onChange={(e) => setTurno(Number(e.target.value))}
                                            className="form-select"
                                        >
                                            <option value="">-- Seleccione un turno --</option>
                                            {TURNOS.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                        {!hasTurnoExtra && (
                                            <button
                                                type="button"
                                                onClick={() => setHasTurnoExtra(true)}
                                                style={{
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ccc",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                +
                                            </button>
                                        )}
                                    </div>
                                </label>

                                {hasTurnoExtra && (
                                    <label className="form-label">
                                        <span className="form-label-text">Turno adicional</span>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <select
                                                value={turnoExtra}
                                                onChange={(e) => setTurnoExtra(Number(e.target.value))}
                                                className="form-select"
                                            >
                                                <option value="">-- Seleccione un turno --</option>
                                                {TURNOS.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHasTurnoExtra(false);
                                                    setTurnoExtra(2);
                                                }}
                                                style={{
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ccc",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </label>
                                )}

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

                        {/* MIS RESERVAS */}
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
                                                            {r.id_turno && (
                                                                <span> • ⏰ {getTurnoLabel(r.id_turno)}</span>
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
                                                                className="btn-cancelo"
                                                                onClick={() => handleCancel(r.id_reserva, "user")}
                                                            >
                                                                ❌ Cancelar
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

                        {/* ADMIN */}
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
                                            const idReserva = r.id_reserva ?? r.id;
                                            return (
                                                <div key={idReserva} className="reservation-item">
                                                    <div className="reservation-content">
                                                        <div className="reservation-info">
                                                            <div className="reservation-name">
                                                                {r.nombre_sala} — {r.edificio}
                                                            </div>
                                                            <div className="reservation-details">
                                                                📅 {r.fecha}
                                                                {r.id_turno && (
                                                                    <span> • ⏰ {getTurnoLabel(r.id_turno)}</span>
                                                                )}
                                                                {r.participantes && r.participantes.length > 0 && (
                                                                    <span> • 👥 {r.participantes.join(", ")}</span>
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
                                                                    className="btn-cancelo"
                                                                    onClick={() => handleCancel(idReserva, "admin")}
                                                                >
                                                                    ❌ Cancelar
                                                                </button>
                                                            )}

                                                            <button
                                                                className="btn-delete"
                                                                onClick={() => handleDelete(idReserva, "admin")}
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
