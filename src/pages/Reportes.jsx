import { useState } from "react";
import { getReportes } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Reportes.css";

export default function Reportes() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const [idConsulta, setIdConsulta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const CONSULTAS = [
    "SALAS_MAS_RESERVADAS",
    "TURNOS_MAS_DEMANDADOS",
    "OCUPACION_POR_EDIFICIO",
    "RESERVAS_POR_PROGRAMA_FACULTAD",
    "UTILIZADAS_VS_CANCELADAS_NOASISTIDAS",
    "RESERVAS_Y_ASISTENCIAS_POR_ROL_Y_TIPO_PROGRAMA",
    "SANCIONES_POR_ROL_Y_TIPO_PROGRAMA",
    "PROMEDIO_PARTICIPANTES_POR_SALA",
    "INCIDENCIAS_ABIERTAS_POR_SALA",
    "RATIO_NO_ASISTENCIA_POR_SALA",
    "ALERTAS_POR_TIPO",
    "ESTADO_SALAS_RESUMEN",
  ];

  if (!user?.is_admin) {
    return (
      <div className="reportes-container">
        <div className="reportes-wrapper">
          <div className="unauthorized-message">
            No tiene permisos para acceder a esta sección
          </div>
        </div>
      </div>
    );
  }

  const fetchConsulta = async (consultaId) => {
    setIdConsulta(consultaId);
    setError(null);
    setLoading(true);
    setData(null);
    try {
      const payload = await getReportes({ id_consulta: consultaId, limit: 50, offset: 0 }, token);
      setData(payload);
    } catch (e) {
      setError(e.message || "Error consultando reportes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reportes-container">
      <div className="reportes-wrapper">
        <div className="reportes-header">
          <h2 className="reportes-title">Reportes del Sistema</h2>
          <p className="reportes-subtitle">
            Seleccione una consulta para ver los resultados (límite: 50 registros)
          </p>
        </div>

        <div className="consultas-grid">
          {CONSULTAS.map((c) => (
            <button
              key={c}
              onClick={() => fetchConsulta(c)}
              disabled={loading}
              className={`consulta-button ${c === idConsulta ? "active" : ""}`}
            >
              <span className="consulta-title">{c.replace(/_/g, " ")}</span>
              <span className="consulta-action">Ver reporte</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="loading-state">
            Consultando {idConsulta.replace(/_/g, " ")}...
          </div>
        )}

        {error && <div className="error-state">⚠️ {error}</div>}

        {data && !error && (
          <div className="results-container">
            <div className="results-header">
              <div className="result-info">
                <span className="result-info-item">
                  <span className="result-info-label">Consulta:</span> {data.consulta_id}
                </span>
                {data.count !== undefined && (
                  <span className="result-info-item">
                    <span className="result-info-label">Filas:</span> {data.count}
                  </span>
                )}
                {data.params && (
                  <span className="result-info-item">
                    <span className="result-info-label">Parámetros:</span>{" "}
                    {Object.entries(data.params)
                      .filter(([, v]) => v !== null && v !== "")
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ") || "(ninguno)"}
                  </span>
                )}
              </div>
              <div className="results-actions">
                <button onClick={() => setShowRaw((r) => !r)} className="btn-toggle-view">
                  {showRaw ? "📊 Ver Tabla" : "📝 Ver JSON"}
                </button>
                {Array.isArray(data.data) && data.data.length > 0 && (
                  <button onClick={() => exportCSV(data)} className="btn-export">
                    📥 Exportar CSV
                  </button>
                )}
              </div>
            </div>

            {!showRaw && Array.isArray(data.data) && data.columns && (
              <div className="table-container">
                <div className="table-wrapper">
                  <table className="reportes-table">
                    <thead>
                      <tr>
                        {data.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.map((row, idx) => (
                        <tr key={idx}>
                          {data.columns.map((col) => (
                            <td key={col}>{renderCell(row[col])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.data.length === 0 && (
                    <div className="empty-results">Sin resultados</div>
                  )}
                </div>
              </div>
            )}

            {showRaw && (
              <div className="json-container">
                <div className="json-content">
                  {JSON.stringify(data, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function renderCell(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString("es-UY");
  return String(value);
}

function exportCSV(payload) {
  try {
    const { columns, data } = payload;
    if (!Array.isArray(columns) || !Array.isArray(data)) return;
    const header = columns.join(",");
    const rows = data.map((row) => columns.map((col) => csvEscape(row[col])).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${payload.consulta_id || "reporte"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("No se pudo exportar CSV", e);
  }
}

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  if (/[",\n]/.test(s)) return `"${s}"`;
  return s;
}