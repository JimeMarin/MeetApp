import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, child } from 'firebase/database';
import { sendEmail } from './emailService'; // Un servicio para enviar emails (puedes crearlo)
import './Booking.css';

const Booking = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState(1);
  const [availableCapacities, setAvailableCapacities] = useState([]);
  const [facilities, setFacilities] = useState(false);
  const [IT, setIT] = useState(false);
  const [recurrence, setRecurrence] = useState('once');
  const [allUsers, setAllUsers] = useState([]);

  // Fetch available rooms from database
  useEffect(() => {
    const fetchRooms = async () => {
      const db = getDatabase();
      const dbRef = ref(db);

      try {
        const snapshot = await get(child(dbRef, 'meetingRooms'));
        if (snapshot.exists()) {
          const rooms = snapshot.val();
          setAvailableRooms(Object.values(rooms));
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    const fetchUsers = async () => {
      const db = getDatabase();
      const dbRef = ref(db);

      try {
        const snapshot = await get(child(dbRef, 'users')); // Suponiendo que los usuarios están almacenados aquí
        if (snapshot.exists()) {
          const users = snapshot.val();
          setAllUsers(Object.values(users).map(user => user.email));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchRooms();
    fetchUsers();
  }, []);

  const handleAddAttendee = (email) => {
    if (email && !attendees.includes(email)) {
      setAttendees([...attendees, email]);
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
    if (!selectedRoom || attendees.length === 0) {
      alert('Please select a room and add at least one attendee');
      return;
    }

    // Send email to attendees
    attendees.forEach(attendee => {
      sendEmail(attendee, `Booking Confirmation`, emailMessage);
    });

    // Send notifications to facilities and IT if needed
    if (facilities) sendEmail('facilities@company.com', 'Facilities Assistance Request', `Assistance needed for room: ${selectedRoom}`);
    if (IT) sendEmail('it@company.com', 'IT Assistance Request', `IT assistance needed for room: ${selectedRoom}`);

    // Save booking to Firebase
    const db = getDatabase();
    const bookingRef = ref(db, 'bookings');
    const newBooking = {
      room: selectedRoom,
      attendees: attendees,
      message: emailMessage,
      assistance: {
        facilities,
        IT
      },
      recurrence
    };
    try {
      await bookingRef.push(newBooking);
      alert('Room booked successfully');
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Error booking the room');
    }
  };

  return (
    <div className="booking-container">
      <header className="booking-header">
        <a href="/dashboard" className="logo-link">
          <img src="/path-to-your-logo.png" alt="Company Logo" className="company-logo" />
        </a>
        <div className="user-menu">
          <img src="/path-to-profile-pic.png" alt="User Profile" className="profile-pic" />
          <div className="user-name-dropdown">
            <span>User Name</span>
          </div>
        </div>
      </header>

      <div className="booking-body">
        <h1>Book a Meeting Room</h1>

        <label htmlFor="room-select">Select Room</label>
        <select id="room-select" onChange={(e) => handleRoomChange(e.target.value)} value={selectedRoom}>
          <option value="">-- Select a Room --</option>
          {availableRooms.map(room => (
            <option key={room.roomName} value={room.roomName}>
              {room.roomName}
            </option>
          ))}
        </select>

        <label>Add Attendees</label>
        <div className="attendees-section">
          <input
            type="email"
            placeholder="Enter attendee email"
            list="attendees-list"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddAttendee(e.target.value);
            }}
          />
          <datalist id="attendees-list">
            {allUsers.map(user => (
              <option key={user} value={user} />
            ))}
          </datalist>

          <ul>
            {attendees.map(att => (
              <li key={att}>{att}</li>
            ))}
          </ul>

          <label htmlFor="capacity-select">Select Capacity</label>
          <select
            id="capacity-select"
            onChange={(e) => setSelectedCapacity(e.target.value)}
            value={selectedCapacity}
          >
            {availableCapacities.map(cap => (
              <option key={cap} value={cap}>
                {cap}
              </option>
            ))}
          </select>
        </div>

        <label>Email Message</label>
        <textarea
          value={emailMessage}
          onChange={(e) => setEmailMessage(e.target.value)}
          placeholder="Enter the message to be sent to the attendees"
        />

        <div className="assistance-section">
          <p>On the day of the meeting I need assistance from:</p>
          <label>
            <input
              type="checkbox"
              checked={facilities}
              onChange={() => setFacilities(!facilities)}
            />
            Facilities
          </label>
          <label>
            <input
              type="checkbox"
              checked={IT}
              onChange={() => setIT(!IT)}
            />
            IT
          </label>
        </div>

        <label>Recurrence</label>
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
        >
          <option value="once">Once</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="annually">Annually</option>
        </select>

        <button onClick={handleBook}>Book</button>
      </div>
    </div>
  );
};

export default Booking;
