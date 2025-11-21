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

export async function getReservas(token) {
  return request("/reserva/mias", "GET", null, token);
}

export async function createReserva(payload, token) {
  return request("/reserva/", "POST", payload, token);
}

export async function logout(token) {
  return request("/auth/logout", "POST", null, token);
}

export default {
  getSalas,
  getReservas,
  createReserva,
  logout,
};
