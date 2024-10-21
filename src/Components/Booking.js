import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import './Booking.css';

const Booking = () => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState(1);
  const [availableCapacities, setAvailableCapacities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  const location = useLocation();
  const { date, startTime, endTime } = location.state || {};

  useEffect(() => {
    console.log("Date:", date);
    console.log("Start time:", startTime);
    console.log("End time:", endTime);
    fetchAvailableRooms();
  }, [date, startTime, endTime]);

  const fetchAvailableRooms = async () => {
    const db = getDatabase();
    const roomsRef = ref(db, 'meetingRooms');
    const bookingsRef = ref(db, 'bookings');
  
    try {
      console.log("Fetching rooms and bookings...");
      const roomsSnapshot = await get(roomsRef);
      const allRooms = roomsSnapshot.val();
      console.log("All rooms:", allRooms);
  
      const bookingsQuery = query(
        bookingsRef,
        orderByChild('date'),
        equalTo(date)
      );
      const bookingsSnapshot = await get(bookingsQuery);
      const bookings = bookingsSnapshot.val() || {};
      console.log("Bookings for the selected date:", bookings);
  
      const availableRooms = Object.entries(allRooms).filter(([roomId, room]) => {
        const conflictingBooking = Object.values(bookings).find(booking => 
          booking.room === room.roomName &&
          ((booking.startTime <= startTime && booking.endTime > startTime) ||
           (booking.startTime < endTime && booking.endTime >= endTime) ||
           (booking.startTime >= startTime && booking.endTime <= endTime))
        );
        console.log(`Room ${room.roomName} available: ${!conflictingBooking}`);
        return !conflictingBooking;
      }).map(([_, room]) => room);
  
      console.log("Available rooms:", availableRooms);
      setAvailableRooms(availableRooms);
    } catch (error) {
      console.error('Error fetching available rooms:', error);
    }
  };

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
    const selected = availableRooms.find(room => room.roomName === roomName);
    if (selected) {
      setSelectedRoom(roomName);
      setAvailableCapacities([...Array(selected.capacity).keys()].map(i => i + 1));
      setSelectedCapacity(1);
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
        <p>Date: {new Date(date).toLocaleDateString()}</p>
        <p>Time: {startTime} - {endTime}</p>
        
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