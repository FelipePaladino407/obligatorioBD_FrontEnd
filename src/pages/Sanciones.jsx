import { useEffect, useState } from "react";

export default function Sanciones() {
    const [sanciones, setSanciones] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");

            const res = await fetch("http://127.0.0.1:5000/api/v1/sanciones/", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSanciones(data);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <h2>Sanciones</h2>

            {sanciones.length === 0 ? (
                <p>No tenés sanciones wacho.</p>
            ) : (
                <ul>
                    {sanciones.map(s => (
                        <li key={s.id_sancion}>
                            ⚠️ Motivo: {s.motivo} — Estado: {s.estado}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
