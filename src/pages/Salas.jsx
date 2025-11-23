import { useEffect, useState } from "react";
import { getSalas, createSala, updateSala, getSalasEstado } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Salas.css";

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
    const [editingSala, setEditingSala] = useState(null);
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
            // cargar salas y sus estados en paralelo
            const [salasData, estadosData] = await Promise.all([
                getSalas(token),
                getSalasEstado(token),
            ]);

            const baseSalas = Array.isArray(salasData) ? salasData : [];
            const estados = Array.isArray(estadosData) ? estadosData : [];

            // mapear estados por clave nombre+edificio
            const estadosByKey = estados.reduce((acc, e) => {
                const key = `${e.nombre_sala}-${e.edificio}`;
                acc[key] = e;
                return acc;
            }, {});

            // fusionar la info de estado en cada sala
            const merged = baseSalas.map((s) => {
                const key = `${s.nombre_sala}-${s.edificio}`;
                const est = estadosByKey[key];
                return est
                    ? {
                          ...s,
                          estado_calculado: est.estado_calculado,
                          estado_manual: est.estado_manual,
                      }
                    : s;
            });

            setSalas(merged);
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

    return (
        <div className="salas-container">
            <div className="salas-wrapper">
                <h2 className="salas-title">Gestión de Salas</h2>

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
                                {salas.map((s) => (
                                    <div key={`${s.nombre_sala}-${s.edificio}`} className="sala-card">
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

                                        {(s.estado_calculado) && (
                                            <span className={`sala-estado ${s.estado_calculado === 'operativa' ? 'disponible' : 'ocupada'}`}>
                                                {s.estado_calculado}
                                            </span>
                                        )}

                                        {user?.is_admin && (
                                            <button
                                                className="btn-edit-sala"
                                                onClick={() => startEditing(s)}
                                            >
                                                ✏️ Editar
                                            </button>
                                        )}
                                    </div>
                                ))}
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
