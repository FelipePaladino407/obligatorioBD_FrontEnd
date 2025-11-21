import { useEffect, useState } from "react";
import { getParticipantes } from "../services/api";
import { useAuth } from "../context/AuthContext";

/*poner que soporte caracteres utf84 o algo asi*/
export default function Usuarios() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!user?.is_admin) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getParticipantes(token);
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Error al traer participantes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user]);

  if (!user?.is_admin) return <div>No autorizado</div>;

  const filtered = rows.filter(r => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return [r.ci, r.nombre, r.apellido, r.email, r.rol, r.facultad, r.carrera, r.tipo]
      .filter(Boolean)
      .some(val => String(val).toLowerCase().includes(term));
  });

  return (
    <div style={{ padding:16 }}>
      <h2>Participantes</h2>
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16 }}>
        <input
          placeholder="Filtrar..."
          value={filter}
          onChange={(e)=>setFilter(e.target.value)}
          style={{ padding:"8px 10px", borderRadius:8, background:"#141414", color:"#eee", border:"1px solid #333", flex:1 }}
        />
        <span style={{ fontSize:12, color:"#888" }}>{filtered.length} / {rows.length}</span>
      </div>
      {loading && <div>Cargando participantes...</div>}
      {error && <div style={{ color:"tomato" }}>{error}</div>}
      {!loading && !error && (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr>
                {HEADER.map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.ci || idx} style={{ background: idx%2?"#121212":"#181818" }}>
                  <td style={tdStyle}>{r.ci}</td>
                  <td style={tdStyle}>{r.nombre}</td>
                  <td style={tdStyle}>{r.apellido}</td>
                  <td style={tdStyle}>{r.email}</td>
                  <td style={tdStyle}>{r.rol}</td>
                  <td style={tdStyle}>{r.facultad}</td>
                  <td style={tdStyle}>{r.nombre_programa}</td>
                  <td style={tdStyle}>{r.tipo}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={HEADER.length} style={{ padding:12, textAlign:"center", color:"#777" }}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const HEADER = ["CI", "Nombre", "Apellido", "Email", "Rol", "Facultad", "Carrera", "Programa"];

const thStyle = { textAlign:"left", padding:"6px 8px", background:"#202020", position:"sticky", top:0, borderBottom:"1px solid #333", fontWeight:600 };
const tdStyle = { padding:"6px 8px", borderBottom:"1px solid #262626", color:"#eee" };
