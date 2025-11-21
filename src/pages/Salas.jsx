import { useEffect, useState } from "react";
import { getSalas, createSala } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Salas() {
    const { user } = useAuth();
    const token = localStorage.getItem("token");
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [nombreSala, setNombreSala] = useState("");
    const [edificio, setEdificio] = useState("");
    const [capacidad, setCapacidad] = useState("");
    const [tipoSala, setTipoSala] = useState("libre");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);

    useEffect(() => {
        loadSalas();
    }, []);

    const loadSalas = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSalas(token);
            setSalas(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Error al cargar salas");
        } finally {
            setLoading(false);
        }
    };

    const handleCrearSala = async (e) => {
        e.preventDefault();
        setCreateError(null);
        if (!nombreSala || !edificio || !capacidad || !tipoSala) {
            setCreateError("Complete todos los campos");
            return;
        }
        const payload = {
            nombre_sala: nombreSala,
            edificio,
            capacidad: Number(capacidad),
            tipo_sala: tipoSala,
        };
        try {
            setCreating(true);
            await createSala(payload, token);
            setNombreSala("");
            setEdificio("");
            setCapacidad("");
            setTipoSala("libre");
            await loadSalas();
        } catch (e) {
            setCreateError(e.message || "Error creando sala");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div style={{ padding: 16 }}>
            <h2>Salas</h2>
            {loading && <div>Cargando salas...</div>}
            {error && <div style={{ color: "tomato" }}>{error}</div>}

            {!loading && !error && (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", marginBottom: 24 }}>
                    {salas.map((s) => (
                        <div key={`${s.nombre_sala}-${s.edificio}`} style={{ background: "#151515", border: "1px solid #262626", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                            <strong style={{ fontSize: 14 }}>{s.nombre_sala}</strong>
                            <span style={{ fontSize: 12, color: "#999" }}>{s.edificio}</span>
                            <span style={{ fontSize: 12 }}>Capacidad: {s.capacidad}</span>
                            <span style={{ fontSize: 12 }}>Tipo: {s.tipo_sala}</span>
                            <span style={{ fontSize: 12 }}>Estado: {s.estado || s.estado_calculado || "—"}</span>
                        </div>
                    ))}
                    {salas.length === 0 && <div>No hay salas.</div>}
                </div>
            )}

            {user?.is_admin && (
                <section style={{ maxWidth: 480 }}>
                    <h3>Crear Sala</h3>
                    <form onSubmit={handleCrearSala} style={{ display: "grid", gap: 10 }}>
                        <label>
                            Nombre
                            <input value={nombreSala} onChange={(e) => setNombreSala(e.target.value)} placeholder="Sala 6" />
                        </label>
                        <label>
                            Edificio
                            <input value={edificio} onChange={(e) => setEdificio(e.target.value)} placeholder="El central" />
                        </label>
                        <label>
                            Capacidad
                            <input type="number" min={1} value={capacidad} onChange={(e) => setCapacidad(e.target.value)} placeholder="10" />
                        </label>
                        <label>
                            Tipo
                            <select value={tipoSala} onChange={(e) => setTipoSala(e.target.value)}>
                                <option value="libre">libre</option>
                                <option value="docente">docente</option>
                                <option value="posgrado">posgrado</option>
                            </select>
                        </label>
                        {createError && <div style={{ color: "tomato", fontSize: 12 }}>{createError}</div>}
                        <button type="submit" disabled={creating} style={{ padding: "8px 12px", borderRadius: 8, background: "#0e3a2b", color: "#9ef3c9", border: "1px solid #1d5a45", cursor: "pointer" }}>
                            {creating ? "Creando..." : "Crear Sala"}
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
}
