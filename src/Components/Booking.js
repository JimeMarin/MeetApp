import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, push } from 'firebase/database';
import { useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import Navbar from './Navbar';
import './Booking.css';

const Booking = () => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState(1);
  const [availableCapacities, setAvailableCapacities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const location = useLocation();
  const { date, startTime, endTime, availableRooms } = location.state || {};

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    console.log("Date:", date);
    console.log("Start time:", startTime);
    console.log("End time:", endTime);
    console.log("Available rooms:", availableRooms);
    if (date && startTime && endTime && availableRooms) {
      console.log("All required data is present");
    } else {
      console.error("Missing date, start time, end time, or available rooms");
    }
    fetchUsers();
  }, [date, startTime, endTime, availableRooms]);

  const fetchUsers = async () => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');

    try {
      const usersSnapshot = await get(usersRef);
      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        setAllUsers(Object.values(users).map(user => user.email));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleRoomChange = (roomName) => {
    const selected = availableRooms.find(room => room === roomName);
    if (selected) {
      setSelectedRoom(roomName);
      // Aquí deberías obtener la capacidad de la sala seleccionada
      // Por ahora, usaremos un valor fijo de 10 como ejemplo
      const capacity = 10;
      setAvailableCapacities([...Array(capacity).keys()].map(i => i + 1));
      setSelectedCapacity(1);
    }
  };

  const handleBook = async () => {
    if (!selectedRoom) {
      alert('Please select a room');
      return;
    }
    if (!user) {
      alert('You must be logged in to book a room');
      return;
    }

    const db = getDatabase();
    const bookingRef = ref(db, 'bookings');
    const newBooking = {
      room: selectedRoom,
      attendees: attendees,
      message: emailMessage,
      capacity: selectedCapacity,
      date: date,
      startTime: startTime,
      endTime: endTime,
      userId: user.uid 
    };

    try {
      await push(bookingRef, newBooking);
      alert('Room booked successfully');
      // Aquí podrías redirigir al usuario o limpiar el formulario
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Error booking the room');
    }
  };

  return (
    <div className="booking-container">
      <Navbar />
      
      <div className="booking-body">
        <h2>Book a Room</h2>
        <p>Date: {date ? new Date(date).toLocaleDateString() : 'Not selected'}</p>
        <p>Time: {startTime && endTime ? `${startTime} - ${endTime}` : 'Not selected'}</p>
        
        <select onChange={(e) => handleRoomChange(e.target.value)} value={selectedRoom}>
          <option value="">Select a room</option>
          {availableRooms && availableRooms.map(room => (
            <option key={room} value={room}>
              {room}
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