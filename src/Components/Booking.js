import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, query, orderByChild, equalTo, push } from "firebase/database";
import { useLocation, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { getCurrentUser } from './AuthUtils';
import { sendEmails } from './SendEmail';
import Navbar from './Navbar';
import './Booking.css';

const Booking = () => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [newAttendee, setNewAttendee] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState(1);
  const [availableCapacities, setAvailableCapacities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();
  const db = getDatabase();
  const location = useLocation();
  const { date, startTime, endTime, availableRooms } = location.state || {};
  const [ContactFacilitiesChecked, setContactFacilitiesChecked] = useState(false);
  const [ContactITChecked, setContactITChecked] = useState(false);


  useEffect(() => {
    const storedAttendees = localStorage.getItem('attendees');
    if (storedAttendees) {
      setAttendees(JSON.parse(storedAttendees));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('attendees', JSON.stringify(attendees));
  }, [attendees]);

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
    console.log("handleBook called. Current attendees:", attendees);

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
      date: date, // Asegúrate de que 'date' esté en formato YYYY-MM-DD
      startTime: startTime,
      endTime: endTime,
    };
    console.log("Booking data:", newBooking);

    try {
      await push(bookingRef, newBooking);
      console.log("Booking saved successfully");
      alert('Room booked successfully');

      // Enviar correos electrónicos si hay asistentes
      if (attendees.length > 0) {
        console.log("Attempting to send emails to:", attendees);
        const currentUser = getCurrentUser();
        await sendEmails({
          ...newBooking,
          userName: currentUser.name,
          userEmail: currentUser.email
        });
      } else {
        console.log("No attendees, skipping email send");
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Error booking the room');
    }
  };

  const addAttendee = () => {
    if (newAttendee.trim() !== '' && !attendees.includes(newAttendee.trim())) {
      setAttendees([...attendees, newAttendee.trim()]);
      setNewAttendee('');
    }
  };

  const handleContactFacilities = async (checked) => {
    setContactFacilitiesChecked(checked);
    if (checked) {
      const facilitiesBooking = {
        room: selectedRoom,
        attendees: ['j.marinp@outlook.com'],
        message: 'A user has requested facilities support for their room booking.',
        capacity: selectedCapacity,
        date: date,
        startTime: startTime,
        endTime: endTime
      };
      await sendEmails(facilitiesBooking);
    }
  };

  const handleContactIT = async (checked) => {
    setContactITChecked(checked);
    if (checked) {
      const ITBooking = {
        room: selectedRoom,
        attendees: ['jimemarinp@gmail.com'],
        message: 'A user has requested IT support for their room booking.',
        capacity: selectedCapacity,
        date: date,
        startTime: startTime,
        endTime: endTime
      };
      await sendEmails(ITBooking);
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

        <div>
          <label htmlFor="attendee-input">Add Attendees</label>
          <div style={{ display: 'flex' }}>
            <input
              id="attendee-input"
              type="email"
              value={newAttendee}
              onChange={(e) => setNewAttendee(e.target.value)}
              onBlur={addAttendee}
              placeholder="Add attendees (optional)"
              list="attendees-list"
            />

          </div>
          <datalist id="attendees-list">
            {allUsers.map(user => (
              <option key={user} value={user} />
            ))}
          </datalist>
        </div>

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
        <div>
          <label>On the day of the meeting I need assistance from:</label>
          <div>
            <input
              type="checkbox"
              id="Facilities"
              name="Facilities"
              checked={ContactFacilitiesChecked}
              onChange={(e) => handleContactFacilities(e.target.checked)}
            />
            <label htmlFor="Facilities">Facilities</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="IT"
              name="IT"
              checked={ContactITChecked}
              onChange={(e) => handleContactIT(e.target.checked)}
            />
            <label htmlFor="IT">IT</label>
          </div>
        </div>
        <button onClick={handleBook}>Book</button>
      </div>
    </div>
  );
};

export default Booking;