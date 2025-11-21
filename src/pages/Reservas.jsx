import { useEffect, useState } from "react";
import { getSalas, getReservas, createReserva } from "../services/api";
import "./Reservas.css";
import { useNavigate } from "react-router-dom";

export default function Reservas() {
    const [reservas, setReservas] = useState([]);
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                setReservas(reservaList || []);
            } catch (e) {
                setError("No se pudo conectar con el servidor");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [token, navigate]);

    const handleCreate = async (ev) => {
        ev.preventDefault();
        setError(null);

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
            // reload reservas
            const updated = await getReservas(token);
            setReservas(updated || []);
            // reset form
            setSelectedSala("");
            setFecha("");
            setTurno(1);
            setParticipantes("");
        } catch (e) {
            setError(e.message || "Error al crear reserva");
            console.error(e);
        }
    };

    return (
        <div style={{ padding: 16 }}>
            <h2>Reservas</h2>

            {loading ? (
                <p>Cargando...</p>
            ) : (
                <>
                    <section style={{ marginBottom: 20 }}>
                        <h3>Crear Reserva</h3>
                        <form onSubmit={handleCreate} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
                            <label>
                                Sala:
                                <select
                                    value={selectedSala}
                                    onChange={(e) => setSelectedSala(e.target.value)}
                                    style={{ width: "100%", marginTop: 4 }}
                                >
                                    <option value="">-- Seleccione --</option>
                                    {salas.map((s) => (
                                        <option key={`${s.nombre_sala}-${s.edificio}`} value={`${s.nombre_sala}|||${s.edificio}`}>
                                            {s.nombre_sala} — {s.edificio} ({s.capacidad} pers, {s.tipo_sala})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Fecha:
                                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                            </label>

                            <label>
                                Turno (id):
                                <input type="number" min={1} value={turno} onChange={(e) => setTurno(e.target.value)} />
                            </label>

                            <label>
                                Participantes CI (separados por coma):
                                <input
                                    type="text"
                                    value={participantes}
                                    onChange={(e) => setParticipantes(e.target.value)}
                                    placeholder="12345678, 87654321"
                                />
                            </label>

                            <div>
                                <button type="submit">Reservar</button>
                            </div>
                            {error && <div style={{ color: "red" }}>{error}</div>}
                        </form>
                    </section>

                    <section>
                        <h3>Tus Reservas</h3>
                        {reservas.length === 0 ? (
                            <p>No hay reservas.</p>
                        ) : (
                            <ul>
                                {reservas.map((r) => (
                                    <li key={r.id}>
                                        📅 {r.fecha} — 🏢 {r.edificio} — {r.nombre_sala} — {r.estado}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
