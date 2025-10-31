import { useState } from "react";
import Login from "./components/Login";
import Reservas from "./components/Reservas";

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token"); // borra el token
    setLoggedIn(false); // vuelve al login
  };

  return loggedIn ? (
    <div>
      <button 
        onClick={handleLogout} 
        style={{ position: "absolute", top: 10, right: 10, padding: "5px 10px" }}
      >
        Cerrar Sesión
      </button>
      <Reservas />
    </div>
  ) : (
    <Login onLogin={() => setLoggedIn(true)} />
  );
}

export default App;
