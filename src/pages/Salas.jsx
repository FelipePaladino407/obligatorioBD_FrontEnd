import { useEffect, useState } from "react";

export default function Salas() {
    const [salas, setSalas] = useState([]);
    const [nuevaSala, setNuevaSala] = useState("");

    useEffect(() => {
        loadSalas();
    }, []);

    const loadSalas = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch("http://127.0.0.1:5000/api/v1/salas/", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            setSalas(data);
        }
    };

    const crearSala = async () => {
        const token = localStorage.getItem("token");

        const res = await fetch("http://127.0.0.1:5000/api/v1/salas/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ nombre: nuevaSala })
        });

        if (res.ok) {
            setNuevaSala("");
            loadSalas();
        }
    };

    return (
        <div>
            <h2>Salas</h2>

            <input
                type="text"
                placeholder="Nombre de la sala"
                value={nuevaSala}
                onChange={(e) => setNuevaSala(e.target.value)}
            />

            <button onClick={crearSala}>Crear Sala</button>

            <ul>
                {salas.map((s) => (
                    <li key={s.id_sala}>{s.nombre}</li>
                ))}
            </ul>
        </div>
    );
}
