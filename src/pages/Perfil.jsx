import { useAuth } from "../context/AuthContext";

export default function Perfil() {
    const { user } = useAuth();

    if (!user) return <p>Cargando...</p>;

    return (
        <div>
            <h2>Mi Perfil</h2>

            <p><b>Nombre:</b> {user.nombre} {user.apellido}</p>
            <p><b>Correo:</b> {user.email}</p>
            <p><b>CI:</b> {user.ci}</p>
            <p><b>Carrera:</b> {user.carrera}</p>
            <p><b>Facultad:</b> {user.facultad}</p>
            <p><b>Rol:</b> {user.rol} ({user.tipo_programa})</p>

            <button>Editar Perfil</button>
            {(user.is_admin && <button>Administrar Usuarios</button>)}
        </div>
    );
}
