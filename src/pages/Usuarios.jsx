import { useEffect, useState } from "react";
import {
  getParticipantes,
  updateParticipante,
  createParticipante,
  deleteParticipante,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Usuarios() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const ROLES = ["estudiante_grado", "estudiante_posgrado", "docente"];
  const PROGRAMAS = [
    "Lic. en Negocios Internacionales",
    "Ingeniería Informática",
    "Psicología Clínica",
    "MBA",
    "Derecho Penal"
  ];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  // edición
  const [editingCi, setEditingCi] = useState(null);
  const [editingData, setEditingData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    nombre_programa: "",
    rol: "",
  });

  // creación (SIN PROGRAMA NI ROL)
  const [newUser, setNewUser] = useState({
    ci: "",
    nombre: "",
    apellido: "",
    email: "",
    password: "",
  });

  const [showCreate, setShowCreate] = useState(false);
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
        setError(e.message || "Error al cargar participantes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user]);

  if (!user?.is_admin) return <div>No autorizado</div>;

  // filtrar
  const filtered = rows.filter((r) => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return [
      r.ci, r.nombre, r.apellido, r.email, r.rol,
      r.facultad, r.carrera, r.tipo, r.nombre_programa,
    ]
      .filter(Boolean)
      .some((x) => String(x).toLowerCase().includes(term));
  });

  // editar
  const startEdit = (r) => {
    setEditingCi(r.ci);
    setEditingData({
      nombre: r.nombre || "",
      apellido: r.apellido || "",
      email: r.email || "",
      nombre_programa: r.nombre_programa || "",
      rol: r.rol || "",
    });
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

      setRows((prev) =>
        prev.map((r) =>
          r.ci === editingCi ? { ...r, ...editingData } : r
        )
      );

      cancelEdit();
    } catch (e) {
      setError(e.message || "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  // crear SIN PROGRAMA NI ROL
  const create = async () => {
    setError(null);

    if (
      !newUser.ci ||
      !newUser.nombre ||
      !newUser.apellido ||
      !newUser.email ||
      !newUser.password
    ) {
      setError("Faltan campos por completar.");
      return;
    }

    if (newUser.ci.length !== 8) {
      setError("La CI debe tener 8 dígitos.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ci: newUser.ci,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        email: newUser.email,
        password: newUser.password,
        nombre_programa: null,
        rol: null,
      };

      await createParticipante(payload, token);

      // recargar lista para evitar F5
      const updated = await getParticipantes(token);
      setRows(updated);

      setShowCreate(false);
      setNewUser({
        ci: "",
        nombre: "",
        apellido: "",
        email: "",
        password: "",
      });
    } catch (e) {
      setError(e.message || "Error creando participante");
    } finally {
      setSaving(false);
    }
  };

  // eliminar
  const remove = async (ci) => {
    if (!window.confirm("¿Seguro que querés borrar este participante?")) return;
    setError(null);
    try {
      await deleteParticipante(ci, token);
      setRows((prev) => prev.filter((p) => p.ci !== ci));
    } catch (e) {
      setError(e.message || "Error eliminando participante");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Participantes</h2>

      {/* FILTRO */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Filtrar..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={inputMain}
        />
        <span style={{ fontSize: 12, color: "#888" }}>
          {filtered.length} / {rows.length}
        </span>

        <button onClick={() => setShowCreate(true)}>Nuevo</button>
      </div>

      {error && <div style={{ color: "tomato" }}>{error}</div>}

      {/* CREAR */}
      {showCreate && (
        <div style={boxStyle}>
          <h4>Nuevo Participante</h4>

          <input
            placeholder="CI (8 dígitos)"
            value={newUser.ci}
            maxLength={8}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (v.length <= 8) setNewUser((d) => ({ ...d, ci: v }));
            }}
            style={inputStyle}
          />

          <input
            placeholder="Nombre"
            value={newUser.nombre}
            onChange={(e) => setNewUser((d) => ({ ...d, nombre: e.target.value }))}
            style={inputStyle}
          />

          <input
            placeholder="Apellido"
            value={newUser.apellido}
            onChange={(e) => setNewUser((d) => ({ ...d, apellido: e.target.value }))}
            style={inputStyle}
          />

          <input
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser((d) => ({ ...d, email: e.target.value }))}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={newUser.password}
            onChange={(e) =>
              setNewUser((d) => ({ ...d, password: e.target.value }))
            }
            style={inputStyle}
          />

          <button onClick={create} disabled={saving}>
            {saving ? "Guardando..." : "Crear"}
          </button>
          <button onClick={() => setShowCreate(false)}>Cancelar</button>
        </div>
      )}

      {/* TABLA */}
      {!loading && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {HEADER.map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.ci} style={{ background: idx % 2 ? "#121212" : "#181818" }}>
                  <td style={tdStyle}>{r.ci}</td>

                  {/* CAMPOS EDITABLES */}
                  {["nombre", "apellido", "email", "rol", "nombre_programa"].map(
                    (field) => (
                      <td key={field} style={tdStyle}>
                        {editingCi === r.ci ? (
                          field === "rol" ? (
                            <select
                              value={editingData.rol}
                              onChange={(e) =>
                                setEditingData((d) => ({ ...d, rol: e.target.value }))
                              }
                              style={inputStyle}
                            >
                              <option value="">Seleccionar...</option>
                              {ROLES.map((rol) => (
                                <option key={rol} value={rol}>{rol}</option>
                              ))}
                            </select>
                          ) : field === "nombre_programa" ? (
                            <select
                              value={editingData.nombre_programa}
                              onChange={(e) =>
                                setEditingData((d) => ({ ...d, nombre_programa: e.target.value }))
                              }
                              style={inputStyle}
                            >
                              <option value="">Seleccionar...</option>
                              {PROGRAMAS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={editingData[field]}
                              onChange={(e) =>
                                setEditingData((d) => ({ ...d, [field]: e.target.value }))
                              }
                              style={inputStyle}
                            />
                          )
                        ) : (
                          r[field]
                        )}
                      </td>
                    )
                  )}

                  <td style={tdStyle}>{r.tipo}</td>

                  {/* ACCIONES */}
                  <td style={tdStyle}>
                    {editingCi === r.ci ? (
                      <>
                        <button onClick={saveEdit} disabled={saving}>Guardar</button>
                        <button onClick={cancelEdit} disabled={saving}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(r)}>Editar</button>
                        <button
                          onClick={() => remove(r.ci)}
                          style={{ marginLeft: 6, color: "tomato" }}
                        >
                          Borrar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={HEADER.length + 1} style={{ textAlign: "center", padding: 10 }}>
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
  "Programa",
  "Tipo",
];

const thStyle = {
  textAlign: "left",
  padding: "6px 8px",
  background: "#202020",
  borderBottom: "1px solid #333",
  fontWeight: 600,
};

const tdStyle = {
  padding: "6px 8px",
  borderBottom: "1px solid #262626",
  color: "#eee",
};

const inputMain = {
  padding: "8px 10px",
  background: "#141414",
  color: "#eee",
  border: "1px solid #333",
  borderRadius: 8,
  flex: 1,
};

const inputStyle = {
  width: "100%",
  padding: "4px 6px",
  borderRadius: 4,
  border: "1px solid #555",
  background: "#111",
  color: "#eee",
  fontSize: 12,
  marginBottom: 6,
};

const boxStyle = {
  padding: 12,
  marginBottom: 16,
  background: "#1a1a1a",
  borderRadius: 8,
  border: "1px solid #333",
};
