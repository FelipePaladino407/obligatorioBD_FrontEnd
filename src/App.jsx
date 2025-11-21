import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import Reservas from "./pages/Reservas";
import Reportes from "./pages/Reportes";
import Sanciones from "./pages/Sanciones";
import Salas from "./pages/Salas";
import Perfil from "./pages/Perfil";
import Usuarios from "./pages/Usuarios";
import AppLayout from "./layout/AppLayout";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  return (
    <BrowserRouter>
    <AuthProvider>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login onLogin={() => setLoggedIn(true)} />}
        />

        {/* RUTAS INTERNAS */}
        {loggedIn ? (
          <Route path="/app" element={<AppLayout />}>

            <Route path="reservas" element={<Reservas />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="sanciones" element={<Sanciones />} />
            <Route path="salas" element={<Salas />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="usuarios" element={<Usuarios />} />

          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}

      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
