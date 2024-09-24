import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Asegúrate de tener tu config de Firebase
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';
import meetapp from '../img/meetapp.png';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
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

    // Lógica para obtener las reservaciones del usuario desde una base de datos (puedes añadirla aquí)
    // Por ahora, utilizamos datos simulados
    setReservations([
      { place: 'Conference Room A', date: '2024-09-25' },
      { place: 'Conference Room B', date: '2024-10-01' },
    ]);

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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSearch = () => {
    // Lógica para buscar disponibilidad de salas en la fecha y hora seleccionada
    alert(`Buscar sala para el ${date.toDateString()} desde las ${startTime} hasta las ${endTime}`);
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
              </div>
            )}
          </div>
        )}
      </header>

      <div className="dashboard-body">
        <h6>Dashboard</h6>
        <h2>Overview</h2>
        <ul className="reservation-list">
          {reservations.length > 0 ? (
            reservations.map((reservation, index) => (
              <li key={index}>
                <h3>{reservation.place}</h3>
                <p>{reservation.date}</p>
                <button>Edit</button>
              </li>
            ))
          ) : (
            <li>No reservations found</li>
          )}
        </ul>

        <h2>New Bookings</h2>
        <div className="booking-section">
          <Calendar onChange={setDate} value={date} />
          <div className="time-selection">
            <label htmlFor="startTime">Start Time:</label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <label htmlFor="endTime">End Time:</label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
