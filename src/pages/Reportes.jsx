import { useState } from "react";
import { getReportes } from "../services/api";
import { useAuth } from "../context/AuthContext";

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
    return <div>No autorizado</div>;
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
    <div style={{ padding: 16 }}>
      <h2>Reportes del Sistema</h2>
      <p style={{ color: "#888", marginTop: -4 }}>Selecciona una consulta para ver resultados (limit 50).</p>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", marginBottom: 24 }}>
        {CONSULTAS.map((c) => (
          <button
            key={c}
            onClick={() => fetchConsulta(c)}
            disabled={loading}
            style={{
              padding: "10px 12px",
              textAlign: "left",
              cursor: "pointer",
              borderRadius: 10,
              border: c === idConsulta ? "2px solid #4fd1c5" : "1px solid #222",
              background: c === idConsulta ? "#133" : "#111",
              color: "#eee",
              fontSize: 13,
              lineHeight: 1.2,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <strong style={{ fontSize: 12 }}>{c}</strong>
            <span style={{ opacity: 0.7 }}>Ver</span>
          </button>
        ))}
      </div>
      {loading && <div>Consultando {idConsulta}...</div>}
      {error && <div style={{ color: "tomato" }}>{error}</div>}
      {data && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#aaa" }}>
            <span><strong>Consulta:</strong> {data.consulta_id}</span>
            {data.count !== undefined && <span><strong>Filas:</strong> {data.count}</span>}
            {data.params && (
              <span><strong>Params:</strong> {Object.entries(data.params).filter(([,v])=>v!==null && v!=="" ).map(([k,v])=>`${k}=${v}`).join(", ") || "(ninguno)"}</span>
            )}
            <button onClick={()=>setShowRaw(r=>!r)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #333", background:"#181818", color:"#ddd", cursor:"pointer" }}>
              {showRaw ? "Ver tabla" : "Ver JSON"}
            </button>
            {Array.isArray(data.data) && data.data.length > 0 && (
              <button onClick={()=>exportCSV(data)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #264", background:"#0e3a2b", color:"#9ef3c9", cursor:"pointer" }}>
                Exportar CSV
              </button>
            )}
          </div>

          {!showRaw && Array.isArray(data.data) && data.columns && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr>
                    {data.columns.map(col => (
                      <th key={col} style={{ textAlign:"left", padding:"6px 8px", background:"#1d1d1d", position:"sticky", top:0, borderBottom:"1px solid #333" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row, idx) => (
                    <tr key={idx} style={{ background: idx%2?"#121212":"#161616" }}>
                      {data.columns.map(col => (
                        <td key={col} style={{ padding:"6px 8px", borderBottom:"1px solid #222", color:"#eee" }}>
                          {renderCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.data.length === 0 && <div style={{ padding:8 }}>Sin resultados.</div>}
            </div>
          )}
          {showRaw && (
            <div style={{ whiteSpace:"pre-wrap", fontFamily:"monospace", background:"#111", padding:12, borderRadius:8 }}>
              {JSON.stringify(data, null, 2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderCell(value){
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString("es-UY");
  return String(value);
}

function exportCSV(payload){
  try {
    const { columns, data } = payload;
    if (!Array.isArray(columns) || !Array.isArray(data)) return;
    const header = columns.join(",");
    const rows = data.map(row => columns.map(col => csvEscape(row[col])).join(","));
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

function csvEscape(v){
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g,'""');
  if (/[",\n]/.test(s)) return `"${s}"`;
  return s;
}
