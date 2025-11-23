import { useEffect, useState } from "react";
import { getSalas, getReservas, createReserva, cancelReserva, deleteReserva, getReservasAll } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Reservas.css";

export default function Reservas() {
    const { user } = useAuth();

    // Turnos disponibles con horarios
    const TURNOS = [
        { id: 1, label: "08:00 - 09:00", start: "08:00" },
        { id: 2, label: "09:00 - 10:00", start: "09:00" },
        { id: 3, label: "10:00 - 11:00", start: "10:00" },
        { id: 4, label: "11:00 - 12:00", start: "11:00" },
        { id: 5, label: "12:00 - 13:00", start: "12:00" },
        { id: 6, label: "13:00 - 14:00", start: "13:00" },
        { id: 7, label: "14:00 - 15:00", start: "14:00" },
        { id: 8, label: "15:00 - 16:00", start: "15:00" },
        { id: 9, label: "16:00 - 17:00", start: "16:00" },
        { id: 10, label: "17:00 - 18:00", start: "17:00" },
        { id: 11, label: "18:00 - 19:00", start: "18:00" },
        { id: 12, label: "19:00 - 20:00", start: "19:00" },
        { id: 13, label: "20:00 - 21:00", start: "20:00" },
        { id: 14, label: "21:00 - 22:00", start: "21:00" },
        { id: 15, label: "22:00 - 23:00", start: "22:00" },
    ];

    const getTurnoLabel = (id) => {
        const t = TURNOS.find((x) => x.id === Number(id));
        return t ? t.label : `Turno ${id}`;
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

    // Cargar datos
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

    // 🔥 VALIDACIÓN DE FECHAS Y HORARIOS 🔥
    const fechaEsPasada = () => {
        if (!fecha) return false;

        const hoy = new Date();
        const seleccionada = new Date(fecha);

        hoy.setHours(0, 0, 0, 0);
        seleccionada.setHours(0, 0, 0, 0);

        return seleccionada < hoy;
    };

    const turnoEsPasado = (idTurno) => {
        const t = TURNOS.find((x) => x.id === Number(idTurno));
        if (!t) return false;

        const ahora = new Date();
        const hoy = new Date().toISOString().split("T")[0];

        if (fecha !== hoy) return false;

        const [h, m] = t.start.split(":");
        const horaTurno = Number(h) * 60 + Number(m);
        const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

        return horaTurno <= horaActual;
    };

    // Crear reserva
    const handleCreate = async () => {
        setError(null);
        setSuccess(false);

        if (fechaEsPasada()) {
            setError("No podés reservar una fecha pasada.");
            return;
        }

        if (turnoEsPasado(turno)) {
            setError("Ese turno ya pasó hoy.");
            return;
        }

        if (hasTurnoExtra && turnoEsPasado(turnoExtra)) {
            setError("El turno adicional ya pasó hoy.");
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
            setError("Tu CI es inválida o no está disponible");
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
            if (!turnosAReservar.includes(Number(turnoExtra))) {
                turnosAReservar.push(Number(turnoExtra));
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
            if (/invalid|bad request/i.test(backendMsg)) uiMsg = "Datos inválidos";

            setError(uiMsg);
            console.error(e);
        }
    };

    // Eliminar
    const handleDelete = async (id) => {
        try {
            await deleteReserva(Number(id), token);

            const mis = await getReservas(token);
            setMisReservas(mis?.reservas || mis || []);

            if (user?.is_admin) {
                const all = await getReservasAll(token);
                setTodasReservas(all?.reservas || all || []);
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            setError("Error al eliminar");
        }
    };

    // Cancelar
    const handleCancel = async (id) => {
        try {
            await cancelReserva(Number(id), token);

            const mis = await getReservas(token);
            setMisReservas(mis?.reservas || mis || []);

            if (user?.is_admin) {
                const all = await getReservasAll(token);
                setTodasReservas(all?.reservas || all || []);
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            setError("Error al cancelar");
        }
    };

    return (
        <div className="reservas-container">
            <div className="reservas-wrapper">
                <h2 className="reservas-title">Reservas</h2>

                {/* LOADING */}
                {loading ? (
                    <div className="loading-card">
                        <div className="loading-spinner"></div>
                        <p>Cargando...</p>
                    </div>
                ) : (
                    <div className="reservas-grid">

                        {/* ================= NUEVA RESERVA ================= */}
                        <section className="card">
                            <h3 className="section-header">Nueva Reserva</h3>

                            <div className="form-container">

                                <label className="form-label">
                                    Sala
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
                                                {s.nombre_sala} — {s.edificio} ({s.capacidad} pers)
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="form-label">
                                    Fecha
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        className="form-input"
                                    />
                                </label>

                                <label className="form-label">
                                    Turno
                                    <select
                                        value={turno}
                                        onChange={(e) => setTurno(Number(e.target.value))}
                                        className="form-select"
                                    >
                                        {TURNOS.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {hasTurnoExtra && (
                                    <label className="form-label">
                                        Turno adicional
                                        <select
                                            value={turnoExtra}
                                            onChange={(e) => setTurnoExtra(Number(e.target.value))}
                                            className="form-select"
                                        >
                                            {TURNOS.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setHasTurnoExtra(!hasTurnoExtra)}
                                    className="btn-extra"
                                >
                                    {hasTurnoExtra ? "Quitar turno extra" : "Agregar turno extra"}
                                </button>

                                <label className="form-label">
                                    Participantes (CI)
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
                                {success && <div className="alert alert-success">✓ Acción realizada</div>}
                            </div>
                        </section>

                        {/* ================= MIS RESERVAS ================= */}
                        <section className="card">
                            <h3 className="section-header">Mis Reservas</h3>

                            {misReservas.length === 0 ? (
                                <div className="empty-state">No tenés reservas aún.</div>
                            ) : (
                                <div className="reservations-list">
                                    {misReservas.map((r) => (
                                        <div key={r.id_reserva} className="reservation-item">
                                            <div className="reservation-info">
                                                {r.nombre_sala} — {r.edificio}
                                                <br />
                                                📅 {r.fecha} • ⏰ {getTurnoLabel(r.id_turno)}
                                            </div>

                                            <div className="reservation-actions">
                                                {r.estado === "ACTIVA" && (
                                                    <button
                                                        className="btn-cancelo"
                                                        onClick={() => handleCancel(r.id_reserva)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ================= TODAS LAS RESERVAS (ADMIN) ================= */}
                        {user?.is_admin && (
                            <section className="card">
                                <h3 className="section-header">Todas las Reservas</h3>

                                {todasReservas.length === 0 ? (
                                    <div className="empty-state">No hay reservas.</div>
                                ) : (
                                    <div className="reservations-list">
                                        {todasReservas.map((r) => (
                                            <div key={r.id_reserva || r.id} className="reservation-item">
                                                <div className="reservation-info">
                                                    {r.nombre_sala} — {r.edificio}
                                                    <br />
                                                    📅 {r.fecha} • ⏰ {getTurnoLabel(r.id_turno)}
                                                </div>

                                                <div className="reservation-actions">
                                                    {r.estado === "ACTIVA" && (
                                                        <button
                                                            className="btn-cancelo"
                                                            onClick={() =>
                                                                handleCancel(r.id_reserva || r.id)
                                                            }
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}

                                                    <button
                                                        className="btn-delete"
                                                        onClick={() =>
                                                            handleDelete(r.id_reserva || r.id)
                                                        }
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
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
