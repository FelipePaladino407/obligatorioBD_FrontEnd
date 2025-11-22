import { useEffect, useState } from "react";
import { getParticipantes, updateParticipante } from "../services/api";
import { useAuth } from "../context/AuthContext";

/*poner que soporte caracteres utf84 o algo asi*/
export default function Usuarios() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [editingCi, setEditingCi] = useState(null);
  const [editingData, setEditingData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    nombre_programa: "",
    rol: "",
  });
  const [saving, setSaving] = useState(false);

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

  const filtered = rows.filter((r) => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return [
      r.ci,
      r.nombre,
      r.apellido,
      r.email,
      r.rol,
      r.facultad,
      r.carrera,
      r.tipo,
      r.nombre_programa,
    ]
      .filter(Boolean)
      .some((val) => String(val).toLowerCase().includes(term));
  });

  const startEdit = (r) => {
    setEditingCi(r.ci);
    setEditingData({
      nombre: r.nombre || "",
      apellido: r.apellido || "",
      email: r.email || "",
      nombre_programa: r.nombre_programa || "",
      rol: r.rol || "",
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingCi(null);
    setEditingData({
      nombre: "",
      apellido: "",
      email: "",
      nombre_programa: "",
      rol: "",
    });
  };

  const saveEdit = async () => {
    if (!editingCi) return;
    setSaving(true);
    setError(null);
    try {
      // armar body con el nuevo formato
      const payload = {
        participante: {
          nombre: editingData.nombre,
          apellido: editingData.apellido,
          email: editingData.email,
        },
        programa: {
          nombre_programa: editingData.nombre_programa,
          rol: editingData.rol,
        },
      };

      await updateParticipante(editingCi, payload, token);

      // actualizar en memoria
      setRows((prev) =>
        prev.map((r) =>
          r.ci === editingCi
            ? {
                ...r,
                nombre: editingData.nombre,
                apellido: editingData.apellido,
                email: editingData.email,
                nombre_programa: editingData.nombre_programa,
                rol: editingData.rol,
              }
            : r
        )
      );
      cancelEdit();
    } catch (e) {
      setError(e.message || "Error al actualizar participante");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Participantes</h2>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          placeholder="Filtrar..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: "#141414",
            color: "#eee",
            border: "1px solid #333",
            flex: 1,
          }}
        />
        <span style={{ fontSize: 12, color: "#888" }}>
          {filtered.length} / {rows.length}
        </span>
      </div>
      {loading && <div>Cargando participantes...</div>}
      {error && <div style={{ color: "tomato" }}>{error}</div>}
      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {HEADER.map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr
                  key={r.ci || idx}
                  style={{ background: idx % 2 ? "#121212" : "#181818" }}
                >
                  <td style={tdStyle}>{r.ci}</td>

                  {/* Nombre */}
                  <td style={tdStyle}>
                    {editingCi === r.ci ? (
                      <input
                        value={editingData.nombre}
                        onChange={(e) =>
                          setEditingData((d) => ({ ...d, nombre: e.target.value }))
                        }
                        style={inputStyle}
                      />
                    ) : (
                      r.nombre
                    )}
                  </td>

                  {/* Apellido */}
                  <td style={tdStyle}>
                    {editingCi === r.ci ? (
                      <input
                        value={editingData.apellido}
                        onChange={(e) =>
                          setEditingData((d) => ({ ...d, apellido: e.target.value }))
                        }
                        style={inputStyle}
                      />
                    ) : (
                      r.apellido
                    )}
                  </td>

                  {/* Email */}
                  <td style={tdStyle}>
                    {editingCi === r.ci ? (
                      <input
                        value={editingData.email}
                        onChange={(e) =>
                          setEditingData((d) => ({ ...d, email: e.target.value }))
                        }
                        style={inputStyle}
                      />
                    ) : (
                      r.email
                    )}
                  </td>

                  {/* Rol */}
                  <td style={tdStyle}>
                    {editingCi === r.ci ? (
                      <input
                        value={editingData.rol}
                        onChange={(e) =>
                          setEditingData((d) => ({ ...d, rol: e.target.value }))
                        }
                        style={inputStyle}
                      />
                    ) : (
                      r.rol
                    )}
                  </td>

                  {/* Facultad */}
                  <td style={tdStyle}>{r.facultad}</td>

                  {/* Programa académico */}
                  <td style={tdStyle}>
                    {editingCi === r.ci ? (
                      <input
                        value={editingData.nombre_programa}
                        onChange={(e) =>
                          setEditingData((d) => ({
                            ...d,
                            nombre_programa: e.target.value,
                          }))
                        }
                        style={inputStyle}
                      />
                    ) : (
                      r.nombre_programa
                    )}
                  </td>

                  {/* Tipo (no editable) */}
                  <td style={tdStyle}>{r.tipo}</td>

                  {/* Acciones */}
                  <td style={tdStyle}>
                    {editingCi === r.ci ? (
                      <>
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          style={{ marginRight: 8, padding: "4px 8px", fontSize: 12 }}
                        >
                          {saving ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          style={{ padding: "4px 8px", fontSize: 12 }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(r)}
                        style={{ padding: "4px 8px", fontSize: 12 }}
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={HEADER.length + 1}
                    style={{ padding: 12, textAlign: "center", color: "#777" }}
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const HEADER = [
  "CI",
  "Nombre",
  "Apellido",
  "Email",
  "Rol",
  "Facultad",
  "Programa",
  "Tipo",
];

const thStyle = {
  textAlign: "left",
  padding: "6px 8px",
  background: "#202020",
  position: "sticky",
  top: 0,
  borderBottom: "1px solid #333",
  fontWeight: 600,
};
const tdStyle = {
  padding: "6px 8px",
  borderBottom: "1px solid #262626",
  color: "#eee",
};

const inputStyle = {
  width: "100%",
  padding: "4px 6px",
  borderRadius: 4,
  border: "1px solid #555",
  background: "#111",
  color: "#eee",
  fontSize: 12,
};
