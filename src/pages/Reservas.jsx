import { useEffect, useState } from "react";
import { getSalas, getReservas, createReserva } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Reservas.css";

export default function Reservas() {
    const {user} = useAuth();

    const [reservas, setReservas] = useState([]);
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

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const load = async () => {
            try {
                setLoading(true);
                const [salaList, reservaList] = await Promise.all([
                    getSalas(token),
                    getReservas(token),
                ]);
                setSalas(salaList || []);
                setReservas(reservaList.reservas || []);
            } catch (e) {
                setError("No se pudo conectar con el servidor");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [token, navigate]);

    const handleCreate = async () => {
        setError(null);
        setSuccess(false);

        if (!selectedSala) {
            setError("Seleccione una sala");
            return;
        }
        if (!fecha) {
            setError("Seleccione una fecha");
            return;
        }

        const [nombre_sala, edificio] = selectedSala.split("|||");
        const participantes_ci = participantes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        
        participantes_ci.push(user.ci);

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
            const updated = await getReservas(token);
            setReservas(updated || []);
            setSelectedSala("");
            setFecha("");
            setTurno(1);
            setParticipantes("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            setError(e.message || "Error al crear reserva");
            console.error(e);
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
                                        onChange={(e) => setTurno(e.target.value)}
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

                                {error && (
                                    <div className="alert alert-error">
                                        ⚠️ {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="alert alert-success">
                                        ✓ Reserva creada exitosamente
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="card">
                            <h3 className="section-header">
                                <span className="section-icon">📋</span>
                                Mis Reservas
                            </h3>
                            {reservas.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📅</div>
                                    <p>No hay reservas aún</p>
                                </div>
                            ) : (
                                <div className="reservations-list">
                                    {reservas && reservas.map((r) => (
                                        <div key={r.id} className="reservation-item">
                                            <div className="reservation-content">
                                                <div className="reservation-info">
                                                    <div className="reservation-name">
                                                        {r.nombre_sala}
                                                    </div>
                                                    <div className="reservation-details">
                                                        📅 {r.fecha} • 🏢 {r.edificio}
                                                    </div>
                                                </div>
                                                <div className={`reservation-status ${r.estado === "ACTIVA" ? "status-active" : "status-inactive"}`}>
                                                    {r.estado}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}