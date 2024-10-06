import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { getAuth, signOut } from 'firebase/auth'; // Asegúrate de importar Firebase Authentication
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import Company_Logo from '../img/meetapp.png';

const Navbar = ({ onChangePassword, onLogout }) => {
  const navigate = useNavigate(); // Inicializa la función de navegación
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Obtener el usuario de Firebase
  useEffect(() => {
    const auth = getAuth(); // Inicializa el auth de Firebase
    const user = auth.currentUser;

    console.log(user); // Para verificar si el usuario está autenticado

    if (user) {
      // Si el usuario está autenticado, toma el nombre del usuario
      const displayName = user.displayName || user.email; // Si no tiene nombre, usa el email
      setUserName(displayName);
    }
  }, []);

  const toggleDropdown = () => {
    console.log('Profile clicked'); // Agregado para depuración
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth); // Cerrar sesión
      navigate('/login'); // Redirigir a /login
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
    }
  };

  const handleChangePassword = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    // Validar el antiguo password
    // Aquí necesitas implementar la lógica para validar el viejo password con Firebase
    // Esto puede incluir el uso de reauthentication

    // Si la autenticación es exitosa, cambia la contraseña
    try {
      await user.updatePassword(newPassword); // Cambiar la contraseña
      alert('Contraseña cambiada exitosamente'); // Mensaje de éxito
      setIsModalOpen(false); // Cerrar el modal
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      alert('Error al cambiar la contraseña');
    }
  };

  return (
    <nav className="navbar">
      {/* Logo de la empresa */}
      <div className="navbar-logo" onClick={() => navigate('/Dashboard')}>
        <img src={Company_Logo} alt="Company Logo" />
      </div>

      {/* Perfil del usuario */}
      <div className={`navbar-profile ${dropdownOpen ? 'active' : ''}`}>
        <div className="profile-info" onClick={toggleDropdown}>
          {/* Nombre completo del usuario de Firebase */}
          <span className="user-name">{userName}</span>
        </div>

        {/* Menú desplegable */}
        {dropdownOpen && (
          <div className="dropdown-menu">
            <button className="dropdown-item" onClick={() => setIsModalOpen(true)}>
              Change My Password
            </button>
            <button className="dropdown-item" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Línea divisoria */}
      <div className="navbar-divider"></div>

      {/* Modal para cambiar la contraseña */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Cambiar Contraseña</h2>
            <input
              type="password"
              placeholder="Contraseña Anterior"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Nueva Contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button onClick={handleChangePassword}>Actualizar Contraseña</button>
            <button onClick={() => setIsModalOpen(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
