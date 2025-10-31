import { useEffect, useState } from "react";

export default function Reservas() {
    const [reservas, setReservas] = useState([]);

    useEffect(() => {
        const fetchReservas = async () => {
            const token = localStorage.getItem("token");
            const res = await fetch("http://127.0.0.1:5000/api/v1/reserva/", {
            });
            if (res.ok) {
                const data = await res.json();
                setReservas(data);
            } else {
                console.error("Error al obtener reservas");
            }
        };
        fetchReservas();
    }, []);

    return (
        <div style={{ maxWidth: 600, margin: "50px auto" }}>
            <h2>Todas las Reservas</h2>
            {reservas.length === 0 ? (
                <p>No hay reservas registradas.</p>
            ) : (
                <ul>
                    {reservas.map((r) => (
                        <li key={r.id_reserva}>
                            📅 {r.fecha} — 🏢 {r.edificio} — 💺 {r.nombre_sala} — 🔖 {r.estado}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
