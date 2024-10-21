import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchReservations(user.uid);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchReservations = async (uid) => {
    // ... (código existente para obtener reservas)
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
          // Redirigir a la página de booking con los parámetros necesarios
          navigate('/booking', { 
            state: { 
              date: date.toISOString(), 
              startTime, 
              endTime, 
              availableRooms 
            } 
          });
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
          {/* ... (código existente para mostrar reservas) */}
        </ul>

        <h2>New Bookings</h2>
        <div className="booking-section">
          <Calendar 
            onChange={setDate} 
            value={date} 
            selectRange={false}
          />
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