import { useEffect, useState } from "react";
import { getSalas, createSala, updateSala } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Salas() {
    const { user } = useAuth();
    const token = localStorage.getItem("token");

    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Crear sala
    const [nombreSala, setNombreSala] = useState("");
    const [edificio, setEdificio] = useState("");
    const [capacidad, setCapacidad] = useState("");
    const [tipoSala, setTipoSala] = useState("libre");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);

    // Editar sala
    const [editingSala, setEditingSala] = useState(null); // sala seleccionada
    const [editData, setEditData] = useState({
        nombre_sala: "",
        edificio: "",
        capacidad: "",
        tipo_sala: ""
    });
    const [editError, setEditError] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);

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

    const startEditing = (s) => {
        setEditingSala(s);
        setEditData({
            nombre_sala: s.nombre_sala,
            edificio: s.edificio,
            capacidad: s.capacidad,
            tipo_sala: s.tipo_sala
        });
        setEditError(null);
    };

    const handleEditChange = (field, value) => {
        setEditData({ ...editData, [field]: value });
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        setSavingEdit(true);
        setEditError(null);

        if (!editData.nombre_sala || !editData.edificio) {
            setEditError("Nombre de sala y edificio son obligatorios.");
            setSavingEdit(false);
            return;
        }

        try {
            
await updateSala(
    {
        nombre_sala: editData.nombre_sala,
        edificio: editData.edificio,
        capacidad: Number(editData.capacidad),
        tipo_sala: editData.tipo_sala
    },
    token,
    editingSala.edificio,      // edificio original
    editingSala.nombre_sala    // nombre original
);

            setEditingSala(null);
            await loadSalas();
        } catch (e) {
            setEditError(e.message || "Error al actualizar sala");
        } finally {
            setSavingEdit(false);
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
            tipo_sala: tipoSala
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
                <div
                    style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                        marginBottom: 24
                    }}
                >
                    {salas.map((s) => (
                        <div
                            key={`${s.nombre_sala}-${s.edificio}`}
                            style={{
                                background: "#151515",
                                border: "1px solid #262626",
                                borderRadius: 10,
                                padding: 12,
                                display: "flex",
                                flexDirection: "column",
                                gap: 4
                            }}
                        >
                            <strong style={{ fontSize: 14 }}>{s.nombre_sala}</strong>
                            <span style={{ fontSize: 12, color: "#999" }}>{s.edificio}</span>
                            <span style={{ fontSize: 12 }}>Capacidad: {s.capacidad}</span>
                            <span style={{ fontSize: 12 }}>Tipo: {s.tipo_sala}</span>
                            <span style={{ fontSize: 12 }}>
                                Estado: {s.estado || s.estado_calculado || "—"}
                            </span>

                            {user?.is_admin && (
                                <button
                                    style={{
                                        marginTop: 6,
                                        padding: "6px 10px",
                                        borderRadius: 6,
                                        background: "#1b3b5a",
                                        color: "#d7eaff",
                                        border: "1px solid #244d74",
                                        cursor: "pointer"
                                    }}
                                    onClick={() => startEditing(s)}
                                >
                                    Editar
                                </button>
                            )}
                        </div>
                    ))}

                    {salas.length === 0 && <div>No hay salas.</div>}
                </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* FORMULARIO PARA EDITAR SALA */}
            {/* ----------------------------------------------------------- */}
            {editingSala && user?.is_admin && (
                <section style={{ maxWidth: 480, padding: 16, border: "1px solid #333", borderRadius: 8 }}>
                    <h3>Editando sala</h3>

                    <form onSubmit={saveEdit} style={{ display: "grid", gap: 10 }}>
                        <label>
                            Nombre
                            <input
                                value={editData.nombre_sala}
                                onChange={(e) => handleEditChange("nombre_sala", e.target.value)}
                            />
                        </label>

                        <label>
                            Edificio
                            <input
                                value={editData.edificio}
                                onChange={(e) => handleEditChange("edificio", e.target.value)}
                            />
                        </label>

                        <label>
                            Capacidad
                            <input
                                type="number"
                                min={1}
                                value={editData.capacidad}
                                onChange={(e) => handleEditChange("capacidad", e.target.value)}
                            />
                        </label>

                        <label>
                            Tipo
                            <select
                                value={editData.tipo_sala}
                                onChange={(e) => handleEditChange("tipo_sala", e.target.value)}
                            >
                                <option value="libre">libre</option>
                                <option value="docente">docente</option>
                                <option value="posgrado">posgrado</option>
                            </select>
                        </label>

                        {editError && (
                            <div style={{ color: "tomato", fontSize: 12 }}>{editError}</div>
                        )}

                        <button
                            type="submit"
                            disabled={savingEdit}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: "#0e3a2b",
                                color: "#9ef3c9",
                                border: "1px solid #1d5a45",
                                cursor: "pointer"
                            }}
                        >
                            {savingEdit ? "Guardando..." : "Guardar cambios"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setEditingSala(null)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: "#3a0e0e",
                                color: "#f3c9c9",
                                border: "1px solid #5a2121",
                                cursor: "pointer"
                            }}
                        >
                            Cancelar
                        </button>
                    </form>
                </section>
            )}

            {/* ----------------------------------------------------------- */}
            {/* FORMULARIO PARA CREAR SALA */}
            {/* ----------------------------------------------------------- */}
            {user?.is_admin && (
                <section style={{ maxWidth: 480, marginTop: 24 }}>
                    <h3>Crear Sala</h3>
                    <form onSubmit={handleCrearSala} style={{ display: "grid", gap: 10 }}>
                        <label>
                            Nombre
                            <input
                                value={nombreSala}
                                onChange={(e) => setNombreSala(e.target.value)}
                                placeholder="Sala 6"
                            />
                        </label>

                        <label>
                            Edificio
                            <input
                                value={edificio}
                                onChange={(e) => setEdificio(e.target.value)}
                                placeholder="El Central"
                            />
                        </label>

                        <label>
                            Capacidad
                            <input
                                type="number"
                                min={1}
                                value={capacidad}
                                onChange={(e) => setCapacidad(e.target.value)}
                                placeholder="10"
                            />
                        </label>

                        <label>
                            Tipo
                            <select
                                value={tipoSala}
                                onChange={(e) => setTipoSala(e.target.value)}
                            >
                                <option value="libre">libre</option>
                                <option value="docente">docente</option>
                                <option value="posgrado">posgrado</option>
                            </select>
                        </label>

                        {createError && (
                            <div style={{ color: "tomato", fontSize: 12 }}>{createError}</div>
                        )}

                        <button
                            type="submit"
                            disabled={creating}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: "#0e3a2b",
                                color: "#9ef3c9",
                                border: "1px solid #1d5a45",
                                cursor: "pointer"
                            }}
                        >
                            {creating ? "Creando..." : "Crear Sala"}
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
}

