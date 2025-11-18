import { useEffect, useState } from "react";

export default function Perfil() {
    const [perfil, setPerfil] = useState(null);

    useEffect(() => {
        const fetchPerfil = async () => {
            const token = localStorage.getItem("token");

            const res = await fetch("http://127.0.0.1:5000/api/v1/participanters/me", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setPerfil(data);
            }
        };

        fetchPerfil();
    }, []);

    if (!perfil) return <p>Cargando...</p>;

    return (
        <div>
            <h2>Mi Perfil</h2>

            <p><b>Nombre:</b> {perfil.nombre}</p>
            <p><b>Correo:</b> {perfil.correo}</p>
            <p><b>Rol:</b> {perfil.rol}</p>

            <button>Editar Perfil</button>
        </div>
    );
}
