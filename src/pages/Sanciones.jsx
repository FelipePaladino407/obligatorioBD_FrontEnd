import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getParticipantes, getSanciones, createSancion, deleteSancion } from "../services/api";

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
      const data = await getSanciones(token);
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

      setCreateOk("Sanción creada");
      setForm({ ci_participante: "", motivo: "", fecha_inicio: "", fecha_fin: "" });
      fetchSanciones();
    } catch (e) {
      setCreateError(e.message || "Error creando sanción");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (ci) => {
    if (!window.confirm("¿Seguro querés eliminar esta sanción?")) return;

    try {
      const token = localStorage.getItem("token");
      await deleteSancion(ci, token);
      fetchSanciones();
    } catch (e) {
      alert(e.message || "Error eliminando sanción");
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>Sanciones</h2>
      {user?.is_admin && <p style={{ color: "#0a7" }}>Vista administrador</p>}

      <button onClick={fetchSanciones} disabled={loading}>
        {loading ? "Actualizando..." : "Refrescar"}
      </button>

      {loadError && <div style={{ color: "#900" }}>{loadError}</div>}

      {!loading && sanciones.length === 0 && <p>No hay sanciones registradas.</p>}

      {sanciones.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr>
              {user?.is_admin && <th>CI</th>}
              <th>Motivo</th>
              <th>Inicio</th>
              <th>Fin</th>
              {user?.is_admin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {sanciones.map((s, i) => (
              <tr key={i} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
                {user?.is_admin && <td>{s.ci_participante}</td>}
                <td>{s.motivo}</td>
                <td>{formatFecha(s.fecha_inicio)}</td>
                <td>{formatFecha(s.fecha_fin)}</td>
                {user?.is_admin && (
                  <td>
                    <button
                      onClick={() => onDelete(s.ci_participante)}
                      style={{ background: "#a00", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {user?.is_admin && (
        <div style={{ border: "1px solid #ddd", padding: 16, marginTop: 20 }}>
          <h3>Crear sanción</h3>
          <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
            <input
              name="ci_participante"
              placeholder="CI participante"
              value={form.ci_participante}
              onChange={onChange}
            />
            <textarea
              name="motivo"
              placeholder="Motivo"
              value={form.motivo}
              onChange={onChange}
            />
            <input
              type="date"
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={onChange}
            />
            <input
              type="date"
              name="fecha_fin"
              value={form.fecha_fin}
              onChange={onChange}
            />
            <button type="submit" disabled={creating}>
              {creating ? "Creando..." : "Crear sanción"}
            </button>
            {createError && <div style={{ color: "#a00" }}>{createError}</div>}
            {createOk && <div style={{ color: "#0a7" }}>{createOk}</div>}
          </form>
        </div>
      )}
    </div>
  );
}
