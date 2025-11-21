import { useEffect, useState } from "react";

export default function Perfil() {
    const [perfil, setPerfil] = useState(null);

    useEffect(() => {
        const fetchPerfil = async () => {
            const token = localStorage.getItem("token");

            const res = await fetch("http://127.0.0.1:8080/api/v1/participante/me", {
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

            <p><b>Nombre:</b> {perfil.nombre} {perfil.apellido}</p>
            <p><b>Correo:</b> {perfil.email}</p>
            <p><b>CI:</b> {perfil.ci}</p>
            <p><b>Carrera:</b> {perfil.carrera}</p>
            <p><b>Facultad:</b> {perfil.facultad}</p>
            <p><b>Rol:</b> {perfil.rol} ({perfil.tipo_programa})</p>

            <button>Editar Perfil</button>
        </div>
    );
}
