const baseUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api/v1";

async function request(path, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const txt = await res.text();
    let errMsg = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(txt || "{}");
      errMsg = j.error || j.message || JSON.stringify(j);
    } catch (e) {
      if (txt) errMsg = txt;
    }
    const err = new Error(errMsg);
    err.status = res.status;
    throw err;
  }

  // try parse json, otherwise return text
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

export async function getSalas(token) {
  return request("/sala/", "GET", null, token);
}

// nuevo: obtener estados calculados de todas las salas
export async function getSalasEstado(token) {
  return request("/sala/estado", "GET", null, token);
}

export async function updateSala(payload, token, edificio, sala) {
  return request(`/sala/${edificio}/${sala}`, "PATCH", payload, token);
}

export async function getReservas(token) {
  return request("/reserva/mias", "GET", null, token);
}

export async function getReservasAll(token) {
  return request("/reserva/", "GET", null, token);
}

export async function createReserva(payload, token) {
  return request("/reserva/", "POST", payload, token);
}

export async function logout(token) {
  return request("/auth/logout", "POST", null, token);
}

export async function getReportes(params, token) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  return request(`/reportes/?${qs.toString()}`, "GET", null, token);
}

export async function getParticipantes(token) {
  return request("/participante/", "GET", null, token);
}

export async function updateParticipante(ci, payload, token) {
  // payload debe venir con { participante: {...}, programa: {...} }
  return request(`/participante/${ci}`, "PATCH", payload, token);
}

export async function createSala(payload, token) {
  return request("/sala/", "POST", payload, token);
}

export async function cancelReserva(id, token) {
  const res = await fetch(`${baseUrl}/reserva/${id}/cancelar`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  // leemos el body como texto una sola vez
  const raw = await res.text();

  let data;
  try {
    data = JSON.parse(raw); // intentamos parsear como JSON
  } catch {
    // si no es JSON, lo dejamos como texto
    data = { error: raw };
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || "Error al cancelar reserva");
  }

  return data;
}

export async function deleteReserva(id, token) {
  return request(`/reserva/${id}`, "DELETE", null, token);
}

export async function getSanciones(token, me = false) {
  // me = true: sanciones del usuario logueado
  const path = me ? "/sancion/me" : "/sancion/";
  return request(path, "GET", null, token);
}

export async function createSancion(payload, token) {
  return request("/sancion/", "POST", payload, token);
}

export async function getUsuarios(token) {
  return request("/usuarios/", "GET", null, token);
}

export async function deleteSancion(ci, fecha_inicio, token) {
  const ciStr = String(ci);
  const fiStr = String(fecha_inicio); // debe venir ya como "YYYY-MM-DD"
  // nuevo endpoint: DELETE /sancion/<ci> con body JSON { fecha_inicio }
  return request(
    `/sancion/${encodeURIComponent(ciStr)}`,
    "DELETE",
    { fecha_inicio: fiStr },
    token
  );
}

// nuevo: actualizar datos del participante logueado
export async function updateMyProfile(payload, token) {
  // payload puede incluir: { nombre?, apellido?, email? }
  return request("/participante/me", "PATCH", payload, token);
}

export async function createParticipante(data, token) {
  return request("/participante/", "POST", data, token);
}

export async function deleteParticipante(ci, token) {
  return request(`/participante/${ci}`, "DELETE", null, token);
}


export default {
  getSalas,
  // nuevo export
  getSalasEstado,
  getReservas,
  createReserva,
  logout,
  getReportes,
  getParticipantes,
  updateParticipante,
  createSala,
  cancelReserva,
  deleteReserva,
  getSanciones,
  createSancion,
  getUsuarios,
  deleteSancion,
  updateMyProfile, // nuevo
  createParticipante,
  deleteParticipante,
};
