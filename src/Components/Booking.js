import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, query, orderByChild, equalTo, push } from "firebase/database";
import { useLocation, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { getCurrentUser } from './AuthUtils';
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
      date: date,
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
        await sendEmails(newBooking);
      } else {
        console.log("No attendees, skipping email send");
      }  

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Error booking the room');
    }
  };

  const sendEmails = async (booking) => {
    console.log("sendEmails called. Attendees:", booking.attendees);
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      console.error('No user is currently logged in');
      return;
    }
    
    console.log('Current user:', currentUser);
    console.log('Booking details:', booking);
  
    const templateParams = {
      from_name: currentUser.name || 'Unknown User',
      from_email: currentUser.email,
      to_email: booking.attendees.join(', '),
      subject: `Room Booking: ${booking.room}`,
      message: booking.message, // Este es el mensaje que el usuario ingresó
      room: booking.room,
      date: new Date(booking.date).toLocaleDateString(),
      start_time: booking.startTime,
      end_time: booking.endTime, 
    };
    console.log('Email template params:', templateParams);
  
    try {
      console.log("Attempting to send email with EmailJS");
      const result = await emailjs.send(
        'service_ufvxwq5',
        'template_vzpjouz',
        templateParams,
        'p1yL7ZtB9h0RV17-X'
      );
      console.log('Email sent successfully:', result.text);
      console.log('Email status:', result.status);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const addAttendee = () => {
    if (newAttendee.trim() !== '' && !attendees.includes(newAttendee.trim())) {
      setAttendees([...attendees, newAttendee.trim()]);
      setNewAttendee('');
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
            {/* <button type="button" onClick={addAttendee}>Add</button> */}
          </div>
          <datalist id="attendees-list">
            {allUsers.map(user => (
              <option key={user} value={user} />
            ))}
          </datalist>
        </div>
  
        {/* { <div>
          <h3>Current Attendees:</h3>
          {attendees.length > 0 ? (
            <ul>
              {attendees.map((attendee, index) => (
                <li key={index}>
                  {attendee}
                  <button onClick={() => setAttendees(attendees.filter((_, i) => i !== index))}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No attendees added yet.</p>
          )}
        </div> } */}
  
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