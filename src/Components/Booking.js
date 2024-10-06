import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, push, child } from 'firebase/database';
import Navbar from './Navbar';  // Asegúrate de que la ruta es correcta
import './Booking.css';

const Booking = () => {
  // Estados para manejar las salas disponibles, asistentes, etc.
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState(1);
  const [availableCapacities, setAvailableCapacities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Obtenemos las salas y usuarios desde Firebase
  useEffect(() => {
    const fetchRoomsAndUsers = async () => {
      const db = getDatabase();
      const dbRef = ref(db);

      try {
        // Obtener salas
        const roomsSnapshot = await get(child(dbRef, 'meetingRooms'));
        if (roomsSnapshot.exists()) {
          const rooms = roomsSnapshot.val();
          setAvailableRooms(Object.values(rooms));
        }

        // Obtener usuarios
        const usersSnapshot = await get(child(dbRef, 'users'));
        if (usersSnapshot.exists()) {
          const users = usersSnapshot.val();
          setAllUsers(Object.values(users).map(user => user.email));
        }
      } catch (error) {
        console.error('Error fetching rooms and users:', error);
      }
    };

    fetchRoomsAndUsers();
  }, []);

  // Manejo de cambio en la sala seleccionada
  const handleRoomChange = (roomName) => {
    const selected = availableRooms.find(room => room.roomName === roomName);
    if (selected) {
      setSelectedRoom(roomName);
      const capacity = selected.capacity; // Obtén la capacidad desde el objeto `selected`
      
      // Ajusta las capacidades desde 1 hasta la capacidad del room
      setAvailableCapacities([...Array(capacity).keys()].map(i => i + 1));
      setSelectedCapacity(1); // Establecer el valor inicial del capacity
    
    }
  };
  

  // Guardar la reserva (en este caso solo un ejemplo de estructura)
  const handleBook = async () => {
    if (!selectedRoom) {
      alert('Please select a room');
      return;
    }

    // Ejemplo de reserva
    const db = getDatabase();
    const bookingRef = ref(db, 'bookings');
    const newBooking = {
      room: selectedRoom,
      attendees: attendees,
      message: emailMessage,
      capacity: selectedCapacity,
      // Más detalles como fecha, hora, asistencia, etc.
    };

    try {
      await push(bookingRef, newBooking);
      alert('Room booked successfully');
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Error booking the room');
    }
  };

  return (
    <div className="booking-container">
      {/* Incluimos el componente Navbar */}
      <Navbar />
      
      <div className="booking-body">
               
        <select onChange={(e) => handleRoomChange(e.target.value)} value={selectedRoom}>
          <option value="">Select a room</option>
          {availableRooms.map(room => (
            <option key={room.roomName} value={room.roomName}>
              {room.roomName}
            </option>
          ))}
        </select>

        <label>Add Attendees</label>
        <input
          type="email"
          placeholder="Add attendees (optional)"
          list="attendees-list"
          onKeyDown={(e) => {
            if (e.key === 'Enter') setAttendees([...attendees, e.target.value]);
          }}
        />
        <datalist id="attendees-list">
          {allUsers.map(user => (
            <option key={user} value={user} />
          ))}
        </datalist>

        <label>Select number of attendees</label>
        <select onChange={(e) => setSelectedCapacity(Number(e.target.value))} value={selectedCapacity}>
  {availableCapacities.map(cap => (
    <option key={cap} value={cap}>{cap}</option>
  ))}
</select>


        <label>Email Message</label>
        <textarea
          value={emailMessage}
          onChange={(e) => setEmailMessage(e.target.value)}
          placeholder="Message to attendees"
        />

        <button onClick={handleBook}>Book</button>
      </div>
    </div>
  );
};

export default Booking;
