import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getParticipantes, getSanciones, createSancion, deleteSancion } from "../services/api";
import "./Sanciones.css";

export default function Sanciones() {
  const { user } = useAuth();
  const [sanciones, setSanciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createOk, setCreateOk] = useState(null);

  const [participantesList, setParticipantesList] = useState([]);

  const [form, setForm] = useState({
    ci_participante: "",
    motivo: "",
    fecha_inicio: "",
    fecha_fin: ""
  });

  const fetchSanciones = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = localStorage.getItem("token");
      const data = await getSanciones(token, !user?.is_admin);
      setSanciones(data || []);
    } catch (e) {
      setLoadError(e.message || "Error cargando sanciones");
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipantes = async () => {
    try {
      const token = localStorage.getItem("token");
      const list = await getParticipantes(token);
      setParticipantesList(list || []);
    } catch (e) {
      console.error("Error cargando participantes:", e);
    }
  };

  useEffect(() => {
    fetchSanciones();
    if (user?.is_admin) fetchParticipantes();
  }, []);

  const formatFecha = (raw) => {
    if (!raw) return "—";
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateOk(null);

    const { ci_participante, motivo, fecha_inicio, fecha_fin } = form;
    if (!ci_participante || !motivo || !fecha_inicio || !fecha_fin) {
      setCreateError("Completa todos los campos");
      return;
    }

    const validCi = participantesList.map(p => String(p.ci));
    if (!validCi.includes(ci_participante.trim())) {
      setCreateError("CI no válido");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setCreateError("Token no encontrado");
      return;
    }

    setCreating(true);
    try {
      await createSancion({
        ci_participante: ci_participante.trim(),
        motivo: motivo.trim(),
        fecha_inicio,
        fecha_fin
      }, token);

      setCreateOk("Sanción creada exitosamente");
      setForm({ ci_participante: "", motivo: "", fecha_inicio: "", fecha_fin: "" });
      fetchSanciones();
      setTimeout(() => setCreateOk(null), 3000);
    } catch (e) {
      setCreateError(e.message || "Error creando sanción");
    } finally {
      setCreating(false);
    }
  };

  const toYMD = (raw) => {
    // si ya viene como 'YYYY-MM-DD', devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) return String(raw);

    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw); // fallback: lo mandamos como viene

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const onDelete = async (sancion) => {
    if (!window.confirm("¿Seguro que desea eliminar esta sanción?")) return;

    try {
      const token = localStorage.getItem("token");
      const ee = new Date(sancion.fecha_inicio);
      ee.setDate(ee.getDate() + 1);
      const fechaInicioYMD = toYMD(ee);
      // usa el nuevo endpoint /sancion/<ci>/<fecha_inicio>
      await deleteSancion(sancion.ci_participante, fechaInicioYMD, token);
      fetchSanciones();
    } catch (e) {
      alert(e.message || "Error eliminando sanción");
    }
  };

  return (
    <div className="sanciones-container">
      <div className="sanciones-wrapper">
        <div className="sanciones-header">
          <h2 className="sanciones-title">Sanciones</h2>
          {user?.is_admin && (
            <span className="admin-badge">Vista Administrador</span>
          )}
        </div>

        <div className="sanciones-actions">
          <button onClick={fetchSanciones} disabled={loading} className="btn-refresh">
            {loading ? "Actualizando..." : "Refrescar"}
          </button>
        </div>

        {loadError && <div className="error-message">{loadError}</div>}

        {!loading && sanciones.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <p>No hay sanciones registradas.</p>
          </div>
        )}

        {sanciones.length > 0 && (
          <div className="sanciones-table-wrapper">
            <table className="sanciones-table">
              <thead>
                <tr>
                  {user?.is_admin && <th>CI</th>}
                  <th>Motivo</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  {user?.is_admin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {sanciones.map((s, i) => (
                  <tr key={i}>
                    {user?.is_admin && <td>{s.ci_participante}</td>}
                    <td>{s.motivo}</td>
                    <td>{formatFecha(s.fecha_inicio)}</td>
                    <td>{formatFecha(s.fecha_fin)}</td>
                    {user?.is_admin && (
                      <td>
                        <button
                          onClick={() => onDelete(s)}
                          className="btn-delete"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {user?.is_admin && (
          <div className="create-section">
            <h3 className="create-section-title">Crear Nueva Sanción</h3>
            <div className="create-form">
              <div className="form-group">
                <label className="form-label">CI del Participante</label>
                <input
                  name="ci_participante"
                  placeholder="Ingrese la cédula de identidad"
                  value={form.ci_participante}
                  onChange={onChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Motivo</label>
                <textarea
                  name="motivo"
                  placeholder="Describa el motivo de la sanción"
                  value={form.motivo}
                  onChange={onChange}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={form.fecha_inicio}
                  onChange={onChange}
                  className="form-date"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={form.fecha_fin}
                  onChange={onChange}
                  className="form-date"
                />
              </div>

              <button onClick={onCreate} disabled={creating} className="btn-submit">
                {creating ? "Creando..." : "Crear Sanción"}
              </button>

              {createError && <div className="error-message">{createError}</div>}
              {createOk && <div className="success-message">✓ {createOk}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
