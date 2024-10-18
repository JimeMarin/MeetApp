import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; 
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, child } from 'firebase/database'; 
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';
import Navbar from './Navbar'; 

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Escuchar los cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchReservations(user.uid); // Llamar a la función para obtener las reservas del usuario
      } else {
        navigate('/login'); // Redirigir a login si no está autenticado
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Función para obtener las reservas del usuario autenticado
  const fetchReservations = async (uid) => {
    const db = getDatabase();
    const reservationsRef = ref(db, `bookings/${uid}`); // Ruta a las reservas del usuario

    try {
      const snapshot = await get(reservationsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Convertir el objeto de reservas en un array
        const fetchedReservations = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));

        setReservations(fetchedReservations); // Actualiza el estado con las reservas obtenidas
      } else {
        console.log('No bookings found.');
        setReservations([]); // Limpia las reservas si no hay datos
      }
    } catch (error) {
      console.error('Error al obtener las reservas:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login'); 
  };

  const handlePasswordChange = () => {
    alert('Change password');
  };

  const handleSearch = async () => {
    const db = getDatabase();
    const dbRef = ref(db);
  
    try {
      const snapshot = await get(child(dbRef, 'meetingRooms'));
      if (snapshot.exists()) {
        const rooms = snapshot.val();
        const availableRooms = [];
  
        const userStartTime = new Date(`${date.toDateString()} ${startTime}`);
        const userEndTime = new Date(`${date.toDateString()} ${endTime}`);
  
        Object.keys(rooms).forEach((roomId) => {
          const room = rooms[roomId];
          const roomStartTime = new Date(`${date.toDateString()} ${room.startTime}`);
          const roomEndTime = new Date(`${date.toDateString()} ${room.endTime}`);
  
          if (userEndTime <= roomStartTime || userStartTime >= roomEndTime) {
            availableRooms.push(room.roomName);
          }
        });
  
        if (availableRooms.length > 0) {
          alert(`Salas disponibles: ${availableRooms.join(', ')}`);          
          navigate('/booking');
        } else {
          alert('No rooms available for the selected time.');
        }
      } else {
        alert('No rooms found.');
      }
    } catch (error) {
      console.error('Error finding rooms:', error);
      alert('There was an error finding a room.');
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar user={user} auth={auth} />

      <div className="dashboard-body">
        <h6>Dashboard</h6>
        <h2>Overview</h2>
        <ul className="reservation-list">
          {reservations.length > 0 ? (
            reservations.map((reservation, index) => (
              <li key={reservation.id}>
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
