import { useEffect, useState } from "react";

export default function Reservas() {
    const [reservas, setReservas] = useState([]);

    useEffect(() => {
        const fetchReservas = async () => {
            const token = localStorage.getItem("token");

            const res = await fetch("http://127.0.0.1:5000/api/v1/reserva/", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
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
        <div>
            <h2>Todas las Reservas</h2>
            {reservas.length === 0 ? (
                <p>No hay reservas.</p>
            ) : (
                <ul>
                    {reservas.map((r) => (
                        <li key={r.id_reserva}>
                            📅 {r.fecha} — 🏢 {r.edificio} — {r.nombre_sala} — {r.estado}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
