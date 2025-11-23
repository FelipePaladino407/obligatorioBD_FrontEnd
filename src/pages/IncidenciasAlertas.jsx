import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./IncidenciasAlertas.css";
import { getReservas, getReservasAll } from "../services/api";

const API_BASE = "http://localhost:8080/api/v1";

const buildHeaders = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export default function IncidenciasAlertas() {
    const { user } = useAuth();
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const [misIncidencias, setMisIncidencias] = useState([]);
    const [incLoading, setIncLoading] = useState(true);
    const [incError, setIncError] = useState(null);

    const [misReservas, setMisReservas] = useState(null);      // antes: reservas

    const [misAlertas, setMisAlertas] = useState([]);
    const [alertLoading, setAlertLoading] = useState(true);
    const [alertError, setAlertError] = useState(null);

    // estados derivados de la reserva seleccionada
    const [idReserva, setIdReserva] = useState("");
    const [nombreSala, setNombreSala] = useState("");
    const [edificio, setEdificio] = useState("");

    const [tipo, setTipo] = useState("equipamiento");
    const [gravedad, setGravedad] = useState("media");
    const [descripcion, setDescripcion] = useState("");
    const [creatingInc, setCreatingInc] = useState(false);
    const [createIncMsg, setCreateIncMsg] = useState(null);

    const [salaAdminNombre, setSalaAdminNombre] = useState("");
    const [salaAdminEdificio, setSalaAdminEdificio] = useState("");
    const [incidenciasSala, setIncidenciasSala] = useState([]);
    const [salaLoading, setSalaLoading] = useState(false);
    const [salaError, setSalaError] = useState(null);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        loadMisIncidencias();
        loadMisAlertas();
      loadReservas();
    }, [token]);

    const loadMisIncidencias = async () => {
        setIncLoading(true);
        setIncError(null);
        try {
            const resp = await fetch(`${API_BASE}/incidencia/me`, {
                headers: buildHeaders(token),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Error al cargar incidencias");
            setMisIncidencias(Array.isArray(data) ? data : []);
        } catch (e) {
            setIncError(e.message);
        } finally {
            setIncLoading(false);
        }
    };

    const loadMisAlertas = async () => {
        setAlertLoading(true);
        setAlertError(null);
        try {
            const resp = await fetch(`${API_BASE}/alerta/me`, {
                headers: buildHeaders(token),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Error al cargar alertas");
            setMisAlertas(Array.isArray(data) ? data : []);
        } catch (e) {
            setAlertError(e.message);
        } finally {
            setAlertLoading(false);
        }
    };

  const loadReservas = async () => {
    try {
        const mis = await getReservas(token);
        setMisReservas(mis);
    } catch (e) {
        console.error(e);
    }
}


    // cuando cambia la reserva seleccionada en el <select>
    const handleChangeReservaSeleccionada = (e) => {
        const value = e.target.value;
        setIdReserva(value);

        if (!value) {
            setNombreSala("");
            setEdificio("");
            return;
        }

        const reserva = misReservas.find(
            (r) => String(r.id_reserva ?? r.id) === String(value)
        );
        if (!reserva) {
            setNombreSala("");
            setEdificio("");
            return;
        }

        // ajustar según la estructura real de la reserva
        // suponiendo campos: id_reserva, nombre_sala, edificio
        setNombreSala(reserva.nombre_sala || reserva.sala_nombre || "");
        setEdificio(reserva.edificio || reserva.sala_edificio || "");
    };

    const handleCrearIncidencia = async (e) => {
        e.preventDefault();
        setCreatingInc(true);
        setCreateIncMsg(null);

        // ahora los datos vienen de la reserva seleccionada
        if (!idReserva || !nombreSala || !edificio || !descripcion) {
            setCreateIncMsg("Seleccione una reserva y complete la descripción");
            setCreatingInc(false);
            return;
        }

        const payload = {
            id_reserva: Number(idReserva),
            nombre_sala: nombreSala,
            edificio,
            tipo,
            gravedad,
            descripcion,
        };

        try {
            const resp = await fetch(`${API_BASE}/incidencia/`, {
                method: "POST",
                headers: buildHeaders(token),
                body: JSON.stringify(payload),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Error al crear incidencia");
            
            setCreateIncMsg(
                `Incidencia creada (ID: ${data.id_incidencia}). Alertas propagadas: ${
                    data.alertas_creadas?.length ?? 0
                }`
            );
            setIdReserva("");
            setNombreSala("");
            setEdificio("");
            setTipo("equipamiento");
            setGravedad("media");
            loadReservas();
            setDescripcion("");
            loadMisIncidencias();
            loadMisAlertas();
        } catch (e) {
            setCreateIncMsg(e.message);
        } finally {
            setCreatingInc(false);
        }
    };

    const handleResolverIncidencia = async (id) => {
        if (!window.confirm("¿Marcar esta incidencia como resuelta?")) return;
        try {
            const resp = await fetch(`${API_BASE}/incidencia/${id}/resolver`, {
                method: "PATCH",
                headers: buildHeaders(token),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Error al resolver incidencia");
            await loadMisIncidencias();
            await loadMisAlertas();
        } catch (e) {
            alert(e.message);
        }
    };

    const handleMarcarAlertaLeida = async (id) => {
        try {
            const resp = await fetch(`${API_BASE}/alerta/${id}/leida`, {
                method: "PATCH",
                headers: buildHeaders(token),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Error al marcar alerta");
            await loadMisAlertas();
        } catch (e) {
            alert(e.message);
        }
    };

    const loadIncidenciasSala = async () => {
        if (!user?.is_admin) return;
        if (!salaAdminNombre || !salaAdminEdificio) {
            setSalaError("Complete nombre de sala y edificio");
            return;
        }
        setSalaLoading(true);
        setSalaError(null);
        try {
            const qs = new URLSearchParams({
                nombre_sala: salaAdminNombre,
                edificio: salaAdminEdificio,
            });
            const resp = await fetch(`${API_BASE}/incidencia/sala?${qs.toString()}`, {
                headers: buildHeaders(token),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Error al cargar incidencias de sala");
            setIncidenciasSala(Array.isArray(data) ? data : []);
        } catch (e) {
            setSalaError(e.message);
        } finally {
            setSalaLoading(false);
        }
    };

    const handleCambiarEstadoIncidencia = async (id, nuevoEstado) => {
        try {
            const resp = await fetch(`${API_BASE}/incidencia/${id}/estado`, {
                method: "PATCH",
                headers: buildHeaders(token),
                body: JSON.stringify({ nuevo_estado: nuevoEstado }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Error al cambiar estado");
            await loadIncidenciasSala();
        } catch (e) {
            alert(e.message);
        }
    };

    const handleDeleteIncidencia = async (id) => {
        if (!window.confirm("¿Eliminar incidencia y sus alertas asociadas?")) return;
        try {
            const resp = await fetch(`${API_BASE}/incidencia/${id}`, {
                method: "DELETE",
                headers: buildHeaders(token),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Error al eliminar incidencia");
            await loadIncidenciasSala();
            await loadMisIncidencias();
            await loadMisAlertas();
        } catch (e) {
            alert(e.message);
        }
    };

    if (!token) return null;

    return (
        <div className="incidencias-container">
            <div className="incidencias-wrapper">
                <h2 className="incidencias-title">Incidencias & Alertas</h2>

                <div className="incidencias-grid">
                    {/* LEFT COLUMN: CREATE & MY INCIDENTS */}
                    <section className="card-section">
                        <h3 className="section-title">Reportar Incidencia</h3>
                        
                        <div className="incidencia-form">
                            {/* NUEVO SELECT DE RESERVAS */}
                            <div className="form-group">
                                <label className="form-label">Reserva</label>
                                <select
                                    value={idReserva}
                                    onChange={handleChangeReservaSeleccionada}
                                    className="form-select"
                                >
                                    <option value="">Seleccione una reserva</option>
                                    {misReservas && (misReservas.map((r) => {
                                        const id = String(r.id_reserva ?? r.id);
                                        const sala =
                                            r.nombre_sala || r.sala_nombre || "Sala desconocida";
                                        const edif = r.edificio || r.sala_edificio || "Edificio";
                                        return (
                                            <option key={id} value={id}>
                                                #{id} - {sala} - {edif} |  
                                                 {r.fecha}
                                            </option>
                                        );
                                    }))}
                                </select>
                            </div>

                            {/* INFO DE SOLO LECTURA DE LA RESERVA */}
                            <div className="form-group">
                                <label className="form-label">Sala seleccionada</label>
                                <input
                                    value={nombreSala}
                                    readOnly
                                    className="form-input"
                                    placeholder="Seleccione una reserva"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Edificio</label>
                                <input
                                    value={edificio}
                                    readOnly
                                    className="form-input"
                                    placeholder="Seleccione una reserva"
                                />
                            </div>

                            {/* campos restantes sin cambios */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Tipo</label>
                                    <select
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="equipamiento">Equipamiento</option>
                                        <option value="infraestructura">Infraestructura</option>
                                        <option value="limpieza">Limpieza</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Gravedad</label>
                                    <select
                                        value={gravedad}
                                        onChange={(e) => setGravedad(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="baja">Baja</option>
                                        <option value="media">Media</option>
                                        <option value="alta">Alta</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="form-textarea"
                                    placeholder="Ej: proyector no enciende, se intentó reiniciar"
                                />
                            </div>

                            {createIncMsg && <div className="form-message">{createIncMsg}</div>}

                            <button
                                onClick={handleCrearIncidencia}
                                disabled={creatingInc}
                                className="btn-submit"
                            >
                                {creatingInc ? "Creando..." : "Reportar Incidencia"}
                            </button>
                        </div>

                        <div>
                            <h4 className="subsection-title">Mis Incidencias</h4>
                            {incLoading ? (
                                <div className="loading-state">Cargando incidencias...</div>
                            ) : incError ? (
                                <div className="error-state">{incError}</div>
                            ) : misIncidencias.length === 0 ? (
                                <div className="empty-state">No ha reportado incidencias aún</div>
                            ) : (
                                <div className="table-wrapper">
                                    <table className="incidencias-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Sala</th>
                                                <th>Edificio</th>
                                                <th>Gravedad</th>
                                                <th>Estado</th>
                                                <th>Descripción</th>
                                                <th>Reserva</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {misIncidencias.map((inc, idx) => {
                                                const estado = (inc.estado || "").toLowerCase();
                                                const puedeResolver = estado !== "resuelta" && estado !== "cerrada";
                                                return (
                                                    <tr key={inc.id_incidencia || idx}>
                                                        <td>{inc.id_incidencia}</td>
                                                        <td>{inc.nombre_sala}</td>
                                                        <td>{inc.edificio}</td>
                                                        <td>{inc.gravedad}</td>
                                                        <td>{inc.estado}</td>
                                                        <td className="description-cell">{inc.descripcion}</td>
                                                        <td>{inc.id_reserva}</td>
                                                        <td>
                                                            {puedeResolver && (
                                                                <button
                                                                    onClick={() => handleResolverIncidencia(inc.id_incidencia)}
                                                                    className="btn-table-action"
                                                                >
                                                                    Marcar resuelta
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* RIGHT COLUMN: ALERTS */}
                    <section className="card-section">
                        <h3 className="section-title">Mis Alertas</h3>
                        {alertLoading ? (
                            <div className="loading-state">Cargando alertas...</div>
                        ) : alertError ? (
                            <div className="error-state">{alertError}</div>
                        ) : misAlertas.length === 0 ? (
                            <div className="empty-state">No tiene alertas</div>
                        ) : (
                            <div className="alertas-list">
                                {misAlertas.map((a) => (
                                    <div key={a.id_alerta} className={`alerta-card ${a.leida ? 'leida' : 'no-leida'}`}>
                                        <div className="alerta-header">
                                            <div>
                                                <span className="alerta-tipo">{a.tipo_alerta}</span>
                                                <span className="alerta-reserva"> — Reserva #{a.id_reserva}</span>
                                            </div>
                                            {!a.leida && (
                                                <button
                                                    onClick={() => handleMarcarAlertaLeida(a.id_alerta)}
                                                    className="btn-marcar-leida"
                                                >
                                                    Marcar leída
                                                </button>
                                            )}
                                        </div>
                                        <div className="alerta-mensaje">{a.mensaje}</div>
                                        <div className="alerta-incidencia-info">
                                            Incidencia: {a.incidencia_descripcion} ({a.incidencia_gravedad}) – {a.incidencia_estado}
                                        </div>
                                        <div className="alerta-timestamp">
                                            {new Date(a.fecha_creacion).toLocaleString()}
                                            {a.leida && " • leída"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ADMIN SECTION */}
                        {user?.is_admin && (
                            <div className="admin-section">
                                <h4 className="subsection-title">Admin - Incidencias por Sala</h4>
                                <div className="admin-search">
                                    <input
                                        placeholder="Nombre sala"
                                        value={salaAdminNombre}
                                        onChange={(e) => setSalaAdminNombre(e.target.value)}
                                        className="form-input"
                                    />
                                    <input
                                        placeholder="Edificio"
                                        value={salaAdminEdificio}
                                        onChange={(e) => setSalaAdminEdificio(e.target.value)}
                                        className="form-input"
                                    />
                                    <button onClick={loadIncidenciasSala} className="btn-search">
                                        Buscar
                                    </button>
                                </div>
                                {salaError && <div className="error-state">{salaError}</div>}
                                {salaLoading ? (
                                    <div className="loading-state">Cargando...</div>
                                ) : incidenciasSala.length === 0 ? (
                                    <div className="empty-state">Sin resultados</div>
                                ) : (
                                    <div className="table-wrapper">
                                        <table className="incidencias-table">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Sala</th>
                                                    <th>Edificio</th>
                                                    <th>Gravedad</th>
                                                    <th>Estado</th>
                                                    <th>Desc.</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {incidenciasSala.map((inc, idx) => (
                                                    <tr key={inc.id_incidencia || idx}>
                                                        <td>{inc.id_incidencia}</td>
                                                        <td>{inc.nombre_sala}</td>
                                                        <td>{inc.edificio}</td>
                                                        <td>{inc.gravedad}</td>
                                                        <td>{inc.estado}</td>
                                                        <td className="description-cell">{inc.descripcion}</td>
                                                        <td>
                                                            <select
                                                                value={inc.estado}
                                                                onChange={(e) =>
                                                                    handleCambiarEstadoIncidencia(inc.id_incidencia, e.target.value)
                                                                }
                                                                className="status-select"
                                                            >
                                                                <option value="abierta">Abierta</option>
                                                                <option value="en_proceso">En Proceso</option>
                                                                <option value="resuelta">Resuelta</option>
                                                                <option value="cancelada">Cancelada</option>
                                                            </select>
                                                            <button
                                                                onClick={() => handleDeleteIncidencia(inc.id_incidencia)}
                                                                className="btn-table-action btn-delete"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};
