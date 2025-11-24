import { useEffect, useState } from "react";
import {
  getParticipantes,
  updateParticipante,
  createParticipante,
  deleteParticipante,
} from "../services/api";
import "./Usuarios.css";

export default function Usuarios() {
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

  const [editingCi, setEditingCi] = useState(null);
  const [editingData, setEditingData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    nombre_programa: "",
    rol: "",
  });

  const [newUser, setNewUser] = useState({
    ci: "",
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "",
    nombre_programa: "",
  });

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
  }, [token]);

  const filtered = rows.filter((r) => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return [
      r.ci, r.nombre, r.apellido, r.email, r.rol, r.nombre_programa,
    ]
      .filter(Boolean)
      .some((x) => String(x).toLowerCase().includes(term));
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

  const create = async () => {
    setError(null);

    if (
      !newUser.ci ||
      !newUser.nombre ||
      !newUser.apellido ||
      !newUser.email ||
      !newUser.password ||
      !newUser.rol ||
      !newUser.nombre_programa
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
        rol: newUser.rol,
        nombre_programa: newUser.nombre_programa,
      };

      await createParticipante(payload, token);

      const updated = await getParticipantes(token);
      setRows(updated);

      setShowCreate(false);
      setNewUser({
        ci: "",
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        rol: "",
        nombre_programa: "",
      });
    } catch (e) {
      setError(e.message || "Error creando participante");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ci) => {
    if (!window.confirm("¿Seguro que desea eliminar este participante?")) return;
    setError(null);
    try {
      await deleteParticipante(ci, token);
      setRows((prev) => prev.filter((p) => p.ci !== ci));
    } catch (e) {
      setError(e.message || "Error eliminando participante");
    }
  };

  return (
    <div className="usuarios-container">
      <div className="usuarios-wrapper">
        <h2 className="usuarios-title">Gestión de Participantes</h2>

        <div className="filter-bar">
          <input
            placeholder="Buscar por CI, nombre, email, rol..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-input"
          />
          <span className="filter-count">
            {filtered.length} / {rows.length}
          </span>
          <button onClick={() => setShowCreate(true)} className="btn-new-user">
            + Nuevo Participante
          </button>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        {showCreate && (
          <div className="create-user-box">
            <h4 className="create-user-title">Nuevo Participante</h4>

            <div className="create-user-form">
              <input
                placeholder="CI (8 dígitos)"
                value={newUser.ci}
                maxLength={8}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (v.length <= 8) setNewUser((d) => ({ ...d, ci: v }));
                }}
                className="form-input"
              />

              <input
                placeholder="Nombre"
                value={newUser.nombre}
                onChange={(e) => setNewUser((d) => ({ ...d, nombre: e.target.value }))}
                className="form-input"
              />

              <input
                placeholder="Apellido"
                value={newUser.apellido}
                onChange={(e) => setNewUser((d) => ({ ...d, apellido: e.target.value }))}
                className="form-input"
              />

              <input
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser((d) => ({ ...d, email: e.target.value }))}
                className="form-input"
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((d) => ({ ...d, password: e.target.value }))
                }
                className="form-input"
              />

              <select
                value={newUser.rol}
                onChange={(e) => setNewUser((d) => ({ ...d, rol: e.target.value }))}
                className="form-select"
              >
                <option value="">Seleccionar rol...</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>

              <select
                value={newUser.nombre_programa}
                onChange={(e) => setNewUser((d) => ({ ...d, nombre_programa: e.target.value }))}
                className="form-select"
              >
                <option value="">Seleccionar programa...</option>
                {PROGRAMAS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>

              <div className="form-actions">
                <button onClick={create} disabled={saving} className="btn-create">
                  {saving ? "Creando..." : "Crear Participante"}
                </button>
                <button onClick={() => setShowCreate(false)} className="btn-cancel">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div className="table-container">
            <div className="table-wrapper">
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>CI</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Programa</th>
                    <th>Tipo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r, idx) => (
                    <tr key={r.ci}>
                      <td>{r.ci}</td>

                      {["nombre", "apellido", "email", "rol", "nombre_programa"].map(
                        (field) => (
                          <td key={field} className={editingCi === r.ci ? "editing" : ""}>
                            {editingCi === r.ci ? (
                              field === "rol" ? (
                                <select
                                  value={editingData.rol}
                                  onChange={(e) =>
                                    setEditingData((d) => ({ ...d, rol: e.target.value }))
                                  }
                                  className="inline-select"
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
                                  className="inline-select"
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
                                  className="inline-input"
                                />
                              )
                            ) : (
                              r[field]
                            )}
                          </td>
                        )
                      )}

                      <td>{r.tipo}</td>

                      <td>
                        <div className="table-actions">
                          {editingCi === r.ci ? (
                            <>
                              <button onClick={saveEdit} disabled={saving} className="btn-save">
                                Guardar
                              </button>
                              <button onClick={cancelEdit} disabled={saving} className="btn-cancel-edit">
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(r)} className="btn-edit">
                                Editar
                              </button>
                              <button onClick={() => remove(r.ci)} className="btn-delete">
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">Sin resultados</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}