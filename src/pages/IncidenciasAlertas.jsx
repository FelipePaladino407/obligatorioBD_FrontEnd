// src/pages/IncidenciasAlertas.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:8080/api/v1";

const buildHeaders = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export default function IncidenciasAlertas() {
    const { user } = useAuth();
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    // --- ESTADO: INCIDENCIAS DEL USUARIO ---
    const [misIncidencias, setMisIncidencias] = useState([]);
    const [incLoading, setIncLoading] = useState(true);
    const [incError, setIncError] = useState(null);

    // --- ESTADO: ALERTAS DEL USUARIO ---
    const [misAlertas, setMisAlertas] = useState([]);
    const [alertLoading, setAlertLoading] = useState(true);
    const [alertError, setAlertError] = useState(null);

    // --- FORM CREAR INCIDENCIA ---
    const [idReserva, setIdReserva] = useState("");
    const [nombreSala, setNombreSala] = useState("");
    const [edificio, setEdificio] = useState("");
    const [tipo, setTipo] = useState("equipamiento");
    const [gravedad, setGravedad] = useState("media");
    const [descripcion, setDescripcion] = useState("");
    const [creatingInc, setCreatingInc] = useState(false);
    const [createIncMsg, setCreateIncMsg] = useState(null);

    // --- ADMIN: INCIDENCIAS POR SALA ---
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // ----------------------------------------------------
    // CARGAR MIS INCIDENCIAS  /api/v1/incidencia/me
    // ----------------------------------------------------
    const loadMisIncidencias = async () => {
        setIncLoading(true);
        setIncError(null);
        try {
            const resp = await fetch(`${API_BASE}/incidencia/me`, {
                headers: buildHeaders(token),
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || "Error al cargar incidencias");
            }
            setMisIncidencias(Array.isArray(data) ? data : []);
        } catch (e) {
            setIncError(e.message);
        } finally {
            setIncLoading(false);
        }
    };

    // ----------------------------------------------------
    // CARGAR MIS ALERTAS  /api/v1/alerta/me
    // ----------------------------------------------------
    const loadMisAlertas = async () => {
        setAlertLoading(true);
        setAlertError(null);
        try {
            const resp = await fetch(`${API_BASE}/alerta/me`, {
                headers: buildHeaders(token),
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || "Error al cargar alertas");
            }
            setMisAlertas(Array.isArray(data) ? data : []);
        } catch (e) {
            setAlertError(e.message);
        } finally {
            setAlertLoading(false);
        }
    };

    // ----------------------------------------------------
    // CREAR INCIDENCIA  POST /api/v1/incidencia/
    // requiere: id_reserva, nombre_sala, edificio, tipo, gravedad, descripcion
    // ----------------------------------------------------
    const handleCrearIncidencia = async (e) => {
        e.preventDefault();
        setCreatingInc(true);
        setCreateIncMsg(null);

        if (!idReserva || !nombreSala || !edificio || !descripcion) {
            setCreateIncMsg("Completá todos los campos obligatorios");
            setCreatingInc(false);
            return;
        }

        const payload = {
            id_reserva: Number(idReserva),
            nombre_sala: nombreSala,
            edificio,
            tipo,      // debe matchear con enum TipoIncidencia en el backend
            gravedad,  // idem GravedadIncidencia
            descripcion,
        };

        try {
            const resp = await fetch(`${API_BASE}/incidencia/`, {
                method: "POST",
                headers: buildHeaders(token),
                body: JSON.stringify(payload),
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || "Error al crear incidencia");
            }
            setCreateIncMsg(
                `Incidencia creada (id=${data.id_incidencia}). Alertas propagadas: ${
                    data.alertas_creadas?.length ?? 0
                }`
            );
            setIdReserva("");
            setNombreSala("");
            setEdificio("");
            setTipo("equipamiento");
            setGravedad("media");
            setDescripcion("");
            loadMisIncidencias();
            loadMisAlertas();
        } catch (e) {
            setCreateIncMsg(e.message);
        } finally {
            setCreatingInc(false);
        }
    };

    // ----------------------------------------------------
    // RESOLVER INCIDENCIA  PATCH /api/v1/incidencia/:id/resolver
    // (usuario dueño o admin)
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // MARCAR ALERTA COMO LEÍDA  PATCH /api/v1/alerta/:id/leida
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // ADMIN: CARGAR INCIDENCIAS POR SALA  GET /incidencia/sala
    // ----------------------------------------------------
    const loadIncidenciasSala = async () => {
        if (!user?.is_admin) return;
        if (!salaAdminNombre || !salaAdminEdificio) {
            setSalaError("Completá nombre de sala y edificio");
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

    // ADMIN: cambiar estado de una incidencia (abierta, en_proceso, resuelta, etc)
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

    // ADMIN: eliminar incidencia  DELETE /incidencia/:id
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
        <div style={{ padding: 16 }}>
            <h2>Incidencias &amp; Alertas</h2>

            <div
                style={{
                    display: "grid",
                    gap: 16,
                    gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
                    alignItems: "flex-start",
                }}
            >
                {/* -------------------------------------------------- */}
                {/* FORM CREAR INCIDENCIA + MIS INCIDENCIAS           */}
                {/* -------------------------------------------------- */}
                <section
                    style={{
                        background: "#151515",
                        borderRadius: 10,
                        border: "1px solid #262626",
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <h3 style={{ margin: 0 }}>Reportar incidencia</h3>
                    <form
                        onSubmit={handleCrearIncidencia}
                        style={{ display: "grid", gap: 8, fontSize: 13 }}
                    >
                        <label style={labelStyle}>
                            ID Reserva
                            <input
                                type="number"
                                value={idReserva}
                                onChange={(e) => setIdReserva(e.target.value)}
                                style={inputStyle}
                                placeholder="Ej: 12"
                            />
                        </label>

                        <label style={labelStyle}>
                            Nombre sala
                            <input
                                value={nombreSala}
                                onChange={(e) => setNombreSala(e.target.value)}
                                style={inputStyle}
                                placeholder="Sala 6"
                            />
                        </label>

                        <label style={labelStyle}>
                            Edificio
                            <input
                                value={edificio}
                                onChange={(e) => setEdificio(e.target.value)}
                                style={inputStyle}
                                placeholder="El Central"
                            />
                        </label>

                        <div style={{ display: "flex", gap: 8 }}>
                            <label style={{ ...labelStyle, flex: 1 }}>
                                Tipo
                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="equipamiento">equipamiento</option>
                                    <option value="infraestructura">infraestructura</option>
                                    <option value="limpieza">limpieza</option>
                                    <option value="otro">otro</option>
                                </select>
                            </label>

                            <label style={{ ...labelStyle, flex: 1 }}>
                                Gravedad
                                <select
                                    value={gravedad}
                                    onChange={(e) => setGravedad(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="baja">baja</option>
                                    <option value="media">media</option>
                                    <option value="alta">alta</option>
                                </select>
                            </label>
                        </div>

                        <label style={labelStyle}>
                            Descripción
                            <textarea
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                rows={3}
                                style={{ ...inputStyle, resize: "vertical" }}
                                placeholder="Ej: proyector no enciende, se intentó reiniciar"
                            />
                        </label>

                        {createIncMsg && (
                            <div
                                style={{
                                    fontSize: 12,
                                    padding: 8,
                                    borderRadius: 6,
                                    background: "#1b1b1b",
                                }}
                            >
                                {createIncMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={creatingInc}
                            style={{
                                marginTop: 4,
                                alignSelf: "flex-start",
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: "#0e3a2b",
                                color: "#9ef3c9",
                                border: "1px solid #1d5a45",
                                cursor: "pointer",
                                fontSize: 13,
                            }}
                        >
                            {creatingInc ? "Creando..." : "Reportar incidencia"}
                        </button>
                    </form>

                    <div>
                        <h4>Mis incidencias</h4>
                        {incLoading ? (
                            <div>Cargando incidencias...</div>
                        ) : incError ? (
                            <div style={{ color: "tomato" }}>{incError}</div>
                        ) : misIncidencias.length === 0 ? (
                            <div style={{ fontSize: 13, color: "#888" }}>
                                No reportaste incidencias aún.
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto", maxHeight: 320 }}>
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: 12,
                                    }}
                                >
                                    <thead>
                                    <tr>
                                        {[
                                            "ID",
                                            "Sala",
                                            "Edificio",
                                            "Gravedad",
                                            "Estado",
                                            "Descripción",
                                            "Reserva",
                                            "Acciones",
                                        ].map((h) => (
                                            <th key={h} style={thStyle}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {misIncidencias.map((inc, idx) => {
                                        const estado = (inc.estado || "").toLowerCase();
                                        const puedeResolver =
                                            estado !== "resuelta" && estado !== "cerrada";
                                        return (
                                            <tr
                                                key={inc.id_incidencia || idx}
                                                style={{
                                                    background: idx % 2 ? "#121212" : "#181818",
                                                }}
                                            >
                                                <td style={tdStyle}>{inc.id_incidencia}</td>
                                                <td style={tdStyle}>{inc.nombre_sala}</td>
                                                <td style={tdStyle}>{inc.edificio}</td>
                                                <td style={tdStyle}>{inc.gravedad}</td>
                                                <td style={tdStyle}>{inc.estado}</td>
                                                <td style={{ ...tdStyle, maxWidth: 260 }}>
                                                    {inc.descripcion}
                                                </td>
                                                <td style={tdStyle}>{inc.id_reserva}</td>
                                                <td style={tdStyle}>
                                                    {puedeResolver && (
                                                        <button
                                                            onClick={() =>
                                                                handleResolverIncidencia(inc.id_incidencia)
                                                            }
                                                            style={{
                                                                padding: "4px 8px",
                                                                borderRadius: 6,
                                                                border: "1px solid #1d5a45",
                                                                background: "#0e3a2b",
                                                                color: "#9ef3c9",
                                                                fontSize: 11,
                                                            }}
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

                {/* -------------------------------------------------- */}
                {/* MIS ALERTAS                                        */}
                {/* -------------------------------------------------- */}
                <section
                    style={{
                        background: "#151515",
                        borderRadius: 10,
                        border: "1px solid #262626",
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Mis alertas</h3>
                    {alertLoading ? (
                        <div>Cargando alertas...</div>
                    ) : alertError ? (
                        <div style={{ color: "tomato" }}>{alertError}</div>
                    ) : misAlertas.length === 0 ? (
                        <div style={{ fontSize: 13, color: "#888" }}>No tenés alertas.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {misAlertas.map((a) => (
                                <div
                                    key={a.id_alerta}
                                    style={{
                                        borderRadius: 8,
                                        border: "1px solid #333",
                                        padding: 10,
                                        background: a.leida ? "#101010" : "#1c2430",
                                        fontSize: 13,
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      <strong>{a.tipo_alerta}</strong> — Reserva #{a.id_reserva}
                    </span>
                                        {!a.leida && (
                                            <button
                                                onClick={() => handleMarcarAlertaLeida(a.id_alerta)}
                                                style={{
                                                    padding: "3px 7px",
                                                    borderRadius: 6,
                                                    border: "1px solid #244d74",
                                                    background: "#1b3b5a",
                                                    color: "#d7eaff",
                                                    fontSize: 11,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Marcar leída
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ marginTop: 4 }}>{a.mensaje}</div>
                                    <div style={{ marginTop: 6, fontSize: 11, color: "#aaa" }}>
                                        Incidencia: {a.incidencia_descripcion} ({a.incidencia_gravedad}) –{" "}
                                        {a.incidencia_estado}
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 11, color: "#777" }}>
                                        {new Date(a.fecha_creacion).toLocaleString()}
                                        {a.leida && " • leída"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* -------------------------------------------------- */}
                    {/* BLOQUE ADMIN: INCIDENCIAS POR SALA                */}
                    {/* -------------------------------------------------- */}
                    {user?.is_admin && (
                        <div
                            style={{
                                marginTop: 16,
                                borderTop: "1px solid #333",
                                paddingTop: 12,
                            }}
                        >
                            <h4>Admin - Incidencias por sala</h4>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    marginBottom: 8,
                                    flexWrap: "wrap",
                                    fontSize: 13,
                                }}
                            >
                                <input
                                    placeholder="Nombre sala"
                                    value={salaAdminNombre}
                                    onChange={(e) => setSalaAdminNombre(e.target.value)}
                                    style={{ ...inputStyle, flex: 1, minWidth: 120 }}
                                />
                                <input
                                    placeholder="Edificio"
                                    value={salaAdminEdificio}
                                    onChange={(e) => setSalaAdminEdificio(e.target.value)}
                                    style={{ ...inputStyle, flex: 1, minWidth: 120 }}
                                />
                                <button
                                    onClick={loadIncidenciasSala}
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: 8,
                                        background: "#1b3b5a",
                                        border: "1px solid #244d74",
                                        color: "#d7eaff",
                                        fontSize: 12,
                                        cursor: "pointer",
                                    }}
                                >
                                    Buscar
                                </button>
                            </div>
                            {salaError && (
                                <div style={{ fontSize: 12, color: "tomato", marginBottom: 4 }}>
                                    {salaError}
                                </div>
                            )}
                            {salaLoading ? (
                                <div>Cargando incidencias...</div>
                            ) : incidenciasSala.length === 0 ? (
                                <div style={{ fontSize: 12, color: "#888" }}>Sin resultados.</div>
                            ) : (
                                <div style={{ overflowX: "auto", maxHeight: 260 }}>
                                    <table
                                        style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            fontSize: 12,
                                        }}
                                    >
                                        <thead>
                                        <tr>
                                            {["ID", "Sala", "Edificio", "Gravedad", "Estado", "Desc.", "Acciones"].map(
                                                (h) => (
                                                    <th key={h} style={thStyle}>
                                                        {h}
                                                    </th>
                                                )
                                            )}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {incidenciasSala.map((inc, idx) => (
                                            <tr
                                                key={inc.id_incidencia || idx}
                                                style={{
                                                    background: idx % 2 ? "#121212" : "#181818",
                                                }}
                                            >
                                                <td style={tdStyle}>{inc.id_incidencia}</td>
                                                <td style={tdStyle}>{inc.nombre_sala}</td>
                                                <td style={tdStyle}>{inc.edificio}</td>
                                                <td style={tdStyle}>{inc.gravedad}</td>
                                                <td style={tdStyle}>{inc.estado}</td>
                                                <td style={{ ...tdStyle, maxWidth: 220 }}>
                                                    {inc.descripcion}
                                                </td>
                                                <td style={tdStyle}>
                                                    <select
                                                        value={inc.estado}
                                                        onChange={(e) =>
                                                            handleCambiarEstadoIncidencia(
                                                                inc.id_incidencia,
                                                                e.target.value
                                                            )
                                                        }
                                                        style={{
                                                            ...inputStyle,
                                                            padding: "2px 4px",
                                                            fontSize: 11,
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        <option value="abierta">abierta</option>
                                                        <option value="en_proceso">en_proceso</option>
                                                        <option value="resuelta">resuelta</option>
                                                        <option value="cancelada">cancelada</option>
                                                    </select>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteIncidencia(inc.id_incidencia)
                                                        }
                                                        style={{
                                                            padding: "3px 7px",
                                                            borderRadius: 6,
                                                            background: "#3a0e0e",
                                                            border: "1px solid #5a2121",
                                                            color: "#f3c9c9",
                                                            fontSize: 11,
                                                            cursor: "pointer",
                                                            marginTop: 4,
                                                        }}
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
    );
}

const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
};

const inputStyle = {
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #444",
    background: "#111",
    color: "#eee",
    fontSize: 13,
};

const thStyle = {
    textAlign: "left",
    padding: "4px 6px",
    background: "#202020",
    borderBottom: "1px solid #333",
    fontWeight: 600,
    position: "sticky",
    top: 0,
};

const tdStyle = {
    padding: "4px 6px",
    borderBottom: "1px solid #262626",
    color: "#eee",
};
