import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Asegúrate de tener tu config de Firebase
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';
import meetapp from '../img/meetapp.png';

const Admin = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false); // Para el pop-up de crear usuario
  const [showRoomForm, setShowRoomForm] = useState(false); // Para el pop-up de crear sala de reunión
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [newRoomData, setNewRoomData] = useState({
    roomName: '',
    capacity: '',
    startTime: '',
    endTime: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Escucha el estado de autenticación del usuario
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        navigate('/login'); // Si no está autenticado, redirigir a login
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login'); // Redirigir al login después de cerrar sesión
  };

  const handlePasswordChange = () => {
    // Redirigir a una página de cambio de contraseña o abrir un modal
    alert('Cambiar contraseña');
  };

  const handleNewUserCreation = async (e) => {
    e.preventDefault();
    const { email, password } = newUserData;
    try {
      // Crear un nuevo usuario en Firebase Authentication
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Usuario creado exitosamente');
      setShowUserForm(false); // Cerrar el pop-up después de la creación
    } catch (error) {
      alert(`Error al crear usuario: ${error.message}`);
    }
  };

  const handleNewRoomCreation = (e) => {
    e.preventDefault();
    // Lógica para crear la sala de reunión (aquí puedes agregar la lógica para guardar la sala en Firebase)
    alert(`Sala creada: ${newRoomData.roomName} con capacidad para ${newRoomData.capacity} personas desde ${newRoomData.startTime} hasta ${newRoomData.endTime}`);
    setShowRoomForm(false); // Cerrar el pop-up después de la creación
  };

  const handleInputChange = (e) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value });
  };

  const handleRoomInputChange = (e) => {
    setNewRoomData({ ...newRoomData, [e.target.name]: e.target.value });
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <a href="/dashboard" className="logo-link">
        <img src={meetapp} alt="Company Logo" className="company-logo" />
        </a>
        {user && (
          <div className={`user-menu ${menuOpen ? "open" : ""}`} onClick={toggleMenu}>
            <img src="/path-to-profile-pic.png" alt="User Profile" className="profile-pic" />
            <div className="user-info">
              <span>{user.displayName}</span>
              <span className="dropdown-arrow"></span>
            </div>
            {menuOpen && (
              <div className="dropdown-content">
                <button onClick={handlePasswordChange}>Change Password</button>
                <button onClick={handleLogout}>Logout</button>
                <button onClick={() => setShowUserForm(true)}>Create New User</button>
                <button onClick={() => setShowRoomForm(true)}>Create New Meeting Room</button> {/* Opción Crear Sala de Reunión */}
              </div>
            )}
          </div>
        )}
      </header>

      <div className="dashboard-body">
        <h1>Administrator Dashboard</h1>
        {/* Aquí puedes añadir más contenido del dashboard */}
      </div>

      {/* Pop-up de Crear Usuario */}
      {showUserForm && (
        <div className="popup-form">
          <div className="popup-content">
            <h2>Create New User</h2>
            <form onSubmit={handleNewUserCreation}>
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={newUserData.firstName}
                onChange={handleInputChange}
                required
              />
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={newUserData.lastName}
                onChange={handleInputChange}
                required
              />
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={newUserData.email}
                onChange={handleInputChange}
                required
              />
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={newUserData.password}
                onChange={handleInputChange}
                required
              />
              <button type="submit">Register</button>
              <button type="button" onClick={() => setShowUserForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up de Crear Sala de Reunión */}
      {showRoomForm && (
        <div className="popup-form">
          <div className="popup-content">
            <h2>Create New Meeting Room</h2>
            <form onSubmit={handleNewRoomCreation}>
              <label>Room Name</label>
              <input
                type="text"
                name="roomName"
                value={newRoomData.roomName}
                onChange={handleRoomInputChange}
                required
              />
              <label>Capacity</label>
              <input
                type="number"
                name="capacity"
                value={newRoomData.capacity}
                onChange={handleRoomInputChange}
                required
              />
              <label>Start Time</label>
              <input
                type="time"
                name="startTime"
                value={newRoomData.startTime}
                onChange={handleRoomInputChange}
                required
              />
              <label>End Time</label>
              <input
                type="time"
                name="endTime"
                value={newRoomData.endTime}
                onChange={handleRoomInputChange}
                required
              />
              <button type="submit">Create Room</button>
              <button type="button" onClick={() => setShowRoomForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
