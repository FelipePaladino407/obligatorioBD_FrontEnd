import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export default function Sanciones() {
  const { user } = useAuth();
  const [sanciones, setSanciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createOk, setCreateOk] = useState(null);

  const API_URL = (process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api/v1").replace(/\/$/, "");

  const listEndpoint = user?.is_admin
    ? `${API_URL}/sancion/`      // admin: todas
    : `${API_URL}/sancion/me`;   // usuario: propias

  const fetchSanciones = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoadError("Token no encontrado");
        setLoading(false);
        return;
      }
      const res = await fetch(listEndpoint, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      if (!res.ok) {
        const txt = await res.text();
        setLoadError(`HTTP ${res.status} ${txt.slice(0,100)}`);
        setSanciones([]);
        return;
      }
      const data = await res.json();
      // Admin recibe array directo. Usuario podría recibir { sanciones: [...] }
      const list = user.is_admin ? data : (Array.isArray(data) ? data : data?.sanciones);
      if (!Array.isArray(list)) {
        setLoadError("Formato inesperado");
        setSanciones([]);
      } else {
        setSanciones(list);
      }
    } catch (e) {
      setLoadError(`NetworkError (¿URL/puerto/CORS?): ${e.message || e.toString()}`);
    } finally {
      setLoading(false);
    }
  }, [user, listEndpoint]);

  useEffect(() => {
    fetchSanciones();
  }, [fetchSanciones]);

  const formatFecha = (raw) => {
    if (!raw) return "—";
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
  };

  // Form creación (solo admin)
  const [form, setForm] = useState({
    ci_participante: "",
    motivo: "",
    fecha_inicio: "",
    fecha_fin: ""
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateOk(null);
    if (!form.ci_participante || !form.motivo || !form.fecha_inicio || !form.fecha_fin) {
      setCreateError("Completa todos los campos");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setCreateError("Token no encontrado");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/sancion/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          ci_participante: form.ci_participante.trim(),
          motivo: form.motivo.trim(),
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin
        })
      });
      if (!res.ok) {
        const txt = await res.text();
        setCreateError(`HTTP ${res.status} ${txt.slice(0,120)}`);
        return;
      }
      setCreateOk("Sanción creada");
      setForm({ ci_participante: "", motivo: "", fecha_inicio: "", fecha_fin: "" });
      fetchSanciones();
    } catch (e) {
      setCreateError(`NetworkError: ${e.message || e.toString()}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>Sanciones</h2>
      {user?.is_admin && <p style={{ color: "#0a7" }}>Vista administrador</p>}

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={fetchSanciones}
          disabled={loading}
          style={{
            padding: "6px 14px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14
          }}
        >
          {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      {loadError && (
        <div style={{ background: "#fee", color: "#900", padding: "8px 12px", borderRadius: 6, marginBottom: 16 }}>
          {loadError}
        </div>
      )}

      {!loading && !loadError && sanciones.length === 0 && (
        <p>No hay sanciones {user?.is_admin ? "registradas." : "para tu usuario."}</p>
      )}

      {!loadError && sanciones.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 28 }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              {user?.is_admin && <th style={th}>CI</th>}
              <th style={th}>Motivo</th>
              <th style={th}>Inicio</th>
              <th style={th}>Fin</th>
              <th style={th}>Duración (días)</th>
            </tr>
          </thead>
          <tbody>
            {sanciones.map((s, i) => {
              const ini = new Date(s.fecha_inicio);
              const fin = new Date(s.fecha_fin);
              const dur =
                !isNaN(ini.getTime()) && !isNaN(fin.getTime())
                  ? Math.max(0, Math.round((fin - ini) / 86400000))
                  : null;
              return (
                <tr key={i} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
                  {user?.is_admin && <td style={td}>{s.ci_participante || "—"}</td>}
                  <td style={td}>{s.motivo || "—"}</td>
                  <td style={td}>{formatFecha(s.fecha_inicio)}</td>
                  <td style={td}>{formatFecha(s.fecha_fin)}</td>
                  <td style={td}>{dur === null ? "—" : dur}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {user?.is_admin && (
        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, background: "#fcfcfc" }}>
          <h3 style={{ marginTop: 0 }}>Crear sanción</h3>
            <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
              <div>
                <label>CI participante<br />
                  <input
                    name="ci_participante"
                    value={form.ci_participante}
                    onChange={onChange}
                    style={input}
                    placeholder="54055666"
                  />
                </label>
              </div>
              <div>
                <label>Motivo<br />
                  <textarea
                    name="motivo"
                    value={form.motivo}
                    onChange={onChange}
                    rows={3}
                    style={{ ...input, resize: "vertical" }}
                    placeholder="Detalle del motivo"
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ flex: 1 }}>Fecha inicio<br />
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={form.fecha_inicio}
                    onChange={onChange}
                    style={input}
                  />
                </label>
                <label style={{ flex: 1 }}>Fecha fin<br />
                  <input
                    type="date"
                    name="fecha_fin"
                    value={form.fecha_fin}
                    onChange={onChange}
                    style={input}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: "10px 18px",
                  background: "#0a7",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: creating ? "not-allowed" : "pointer",
                  fontWeight: 600
                }}
              >
                {creating ? "Creando..." : "Crear sanción"}
              </button>
              {createError && <div style={{ color: "#a00", fontSize: 13 }}>{createError}</div>}
              {createOk && <div style={{ color: "#0a7", fontSize: 13 }}>{createOk}</div>}
            </form>
        </div>
      )}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #ddd",
  fontWeight: 600
};
const td = {
  padding: "6px 10px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top"
};
const input = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
  background: "#fff"
};