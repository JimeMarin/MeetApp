import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, query, orderByChild, equalTo, push } from "firebase/database";
import { useLocation, useNavigate } from 'react-router-dom';

import Navbar from './Navbar';
import './Booking.css';

const Booking = () => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState(1);
  const [availableCapacities, setAvailableCapacities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();
  const db = getDatabase();

  const location = useLocation();
  const { date, startTime, endTime, availableRooms } = location.state || {};

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

  const handleRoomChange = async (roomName) => {
    console.log("Sala seleccionada:", roomName);
    const selected = availableRooms.find(room => room === roomName);
    if (selected) {
      setSelectedRoom(roomName);
      
      try {
        // Crear una consulta para buscar la sala por nombre
        const roomsRef = ref(db, 'meetingRooms');
        const roomQuery = query(roomsRef, orderByChild('roomName'), equalTo(roomName));
        
        const snapshot = await get(roomQuery);
        
        if (snapshot.exists()) {
          // Obtener el primer (y único) resultado
          const roomData = Object.values(snapshot.val())[0];
          console.log("Datos de la sala obtenidos:", roomData);
          
          const capacity = parseInt(roomData.capacity, 10);
          setAvailableCapacities([...Array(capacity).keys()].map(i => i + 1));
          setSelectedCapacity(1);
        } else {
          console.log("The room was not found.");
        }
      } catch (error) {
        console.error("Error obtaining room data:", error);
      }
    }
  };


  const handleBook = async () => {
    if (!selectedRoom) {
      alert('Please select a room');
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
    };

    try {
      await push(bookingRef, newBooking);
      alert('Room booked successfully');
      navigate('/dashboard');
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