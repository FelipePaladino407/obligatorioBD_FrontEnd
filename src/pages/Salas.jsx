import { useEffect, useState } from "react";
import { getSalas, createSala, updateSala } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Salas.css";

const API_BASE = "http://localhost:8080/api/v1";

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

    // Editar sala (datos generales)
    const [editingSala, setEditingSala] = useState(null);
    const [editData, setEditData] = useState({
        nombre_sala: "",
        edificio: "",
        capacidad: "",
        tipo_sala: ""
    });
    const [editError, setEditError] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);

    // Mensaje rápido cuando se cambia el estado manual
    const [estadoMsg, setEstadoMsg] = useState(null);

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
                editingSala.edificio,
                editingSala.nombre_sala
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

    // -------------------------------------------------------
    // ADMIN: actualizar estado manual de la sala
    // PATCH /api/v1/sala/estado_manual/<nombre>/<edificio>
    // Body: { estado: "operativa" | "con_inconvenientes" | "fuera_de_servicio" }
    // -------------------------------------------------------
    const actualizarEstadoManualSala = async (sala, nuevoEstado) => {
        if (!user?.is_admin) return;

        try {
            setEstadoMsg(null);

            const resp = await fetch(
                `${API_BASE}/sala/estado_manual/${encodeURIComponent(
                    sala.nombre_sala
                )}/${encodeURIComponent(sala.edificio)}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ estado: nuevoEstado })
                }
            );

            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || "Error al actualizar estado manual");
            }

            setEstadoMsg(
                `Estado manual de "${sala.nombre_sala}" actualizado a "${nuevoEstado}".`
            );
            await loadSalas();
        } catch (e) {
            setEstadoMsg(e.message || "Error al actualizar estado manual");
        }
    };

    return (
        <div className="salas-container">
            <div className="salas-wrapper">
                <h2 className="salas-title">Gestión de Salas</h2>

                {estadoMsg && (
                    <div className="info-message" style={{ marginBottom: 12 }}>
                        {estadoMsg}
                    </div>
                )}

                {loading && (
                    <div className="loading-message">
                        Cargando salas...
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {!loading && !error && (
                    <>
                        {salas.length === 0 ? (
                            <div className="empty-salas">
                                <div className="empty-salas-icon">🏢</div>
                                <p>No hay salas registradas</p>
                            </div>
                        ) : (
                            <div className="salas-grid">
                                {salas.map((s) => {
                                    const estadoCalculado = s.estado_calculado || "–";
                                    const estadoManual = s.estado_manual || "sin definir";
                                    const estadoFinal =
                                        s.estado || s.estado_manual || s.estado_calculado || "sin datos";

                                    const esOperativa =
                                        estadoFinal === "operativa" || estadoFinal === "disponible";

                                    return (
                                        <div
                                            key={`${s.nombre_sala}-${s.edificio}`}
                                            className="sala-card"
                                        >
                                            <div className="sala-name">{s.nombre_sala}</div>
                                            <div className="sala-edificio">📍 {s.edificio}</div>

                                            <div className="sala-info">
                                                <span className="sala-info-icon">👥</span>
                                                <span>Capacidad: {s.capacidad} personas</span>
                                            </div>

                                            <div className="sala-info">
                                                <span className="sala-info-icon">🏷️</span>
                                                <span>Tipo: {s.tipo_sala}</span>
                                            </div>

                                            {/* ESTADO FINAL */}
                                            <span
                                                className={`sala-estado ${
                                                    esOperativa ? "disponible" : "ocupada"
                                                }`}
                                            >
                                                Estado actual: {estadoFinal}
                                            </span>

                                            {/* ESTADO CALCULADO / MANUAL SOLO VISUAL */}
                                            <div className="sala-info">
                                                <span className="sala-info-icon">🧮</span>
                                                <span>Estado calculado: {estadoCalculado}</span>
                                            </div>

                                            <div className="sala-info">
                                                <span className="sala-info-icon">✋</span>
                                                <span>Estado manual: {estadoManual}</span>
                                            </div>

                                            {/* Selector solo para ADMIN */}
                                            {user?.is_admin && (
                                                <div
                                                    className="sala-info"
                                                    style={{
                                                        flexDirection: "column",
                                                        alignItems: "flex-start"
                                                    }}
                                                >
                                                    <span className="sala-info-icon">🛠️</span>
                                                    <div style={{ fontSize: 13 }}>
                                                        Ajustar estado manual:
                                                    </div>
                                                    <select
                                                        className="form-select"
                                                        style={{ marginTop: 4, width: "100%" }}
                                                        value={s.estado_manual || ""}
                                                        onChange={(e) =>
                                                            actualizarEstadoManualSala(
                                                                s,
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="" disabled>
                                                            Seleccionar estado...
                                                        </option>
                                                        <option value="operativa">operativa</option>
                                                        <option value="con_inconvenientes">
                                                            con_inconvenientes
                                                        </option>
                                                        <option value="fuera_de_servicio">
                                                            fuera_de_servicio
                                                        </option>
                                                    </select>
                                                </div>
                                            )}

                                            {user?.is_admin && (
                                                <button
                                                    className="btn-edit-sala"
                                                    onClick={() => startEditing(s)}
                                                >
                                                    ✏️ Editar datos de sala
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* FORMULARIO PARA EDITAR SALA */}
                {editingSala && user?.is_admin && (
                    <section className="form-section editing">
                        <h3 className="form-section-title">Editar Sala</h3>

                        <div className="sala-form">
                            <div className="form-group">
                                <label className="form-label">Nombre de la Sala</label>
                                <input
                                    className="form-input"
                                    value={editData.nombre_sala}
                                    onChange={(e) => handleEditChange("nombre_sala", e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Edificio</label>
                                <input
                                    className="form-input"
                                    value={editData.edificio}
                                    onChange={(e) => handleEditChange("edificio", e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Capacidad</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    min={1}
                                    value={editData.capacidad}
                                    onChange={(e) => handleEditChange("capacidad", e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tipo de Sala</label>
                                <select
                                    className="form-select"
                                    value={editData.tipo_sala}
                                    onChange={(e) => handleEditChange("tipo_sala", e.target.value)}
                                >
                                    <option value="libre">Libre</option>
                                    <option value="docente">Docente</option>
                                    <option value="posgrado">Posgrado</option>
                                </select>
                            </div>

                            {editError && (
                                <div className="form-error">{editError}</div>
                            )}

                            <div className="form-actions">
                                <button
                                    onClick={saveEdit}
                                    disabled={savingEdit}
                                    className="btn-submit"
                                >
                                    {savingEdit ? "Guardando..." : "Guardar Cambios"}
                                </button>

                                <button
                                    onClick={() => setEditingSala(null)}
                                    className="btn-cancel"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* FORMULARIO PARA CREAR SALA */}
                {user?.is_admin && (
                    <section className="form-section">
                        <h3 className="form-section-title">Crear Nueva Sala</h3>

                        <div className="sala-form">
                            <div className="form-group">
                                <label className="form-label">Nombre de la Sala</label>
                                <input
                                    className="form-input"
                                    value={nombreSala}
                                    onChange={(e) => setNombreSala(e.target.value)}
                                    placeholder="Ej: Sala 6"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Edificio</label>
                                <input
                                    className="form-input"
                                    value={edificio}
                                    onChange={(e) => setEdificio(e.target.value)}
                                    placeholder="Ej: El Central"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Capacidad</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    min={1}
                                    value={capacidad}
                                    onChange={(e) => setCapacidad(e.target.value)}
                                    placeholder="Ej: 10"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tipo de Sala</label>
                                <select
                                    className="form-select"
                                    value={tipoSala}
                                    onChange={(e) => setTipoSala(e.target.value)}
                                >
                                    <option value="libre">Libre</option>
                                    <option value="docente">Docente</option>
                                    <option value="posgrado">Posgrado</option>
                                </select>
                            </div>

                            {createError && (
                                <div className="form-error">{createError}</div>
                            )}

                            <button
                                onClick={handleCrearSala}
                                disabled={creating}
                                className="btn-submit"
                            >
                                {creating ? "Creando..." : "Crear Sala"}
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
