import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; 
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, query, orderByChild, equalTo, update, remove } from 'firebase/database';
import Calendar from 'react-calendar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';
import Navbar from './Navbar'; 

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [newAttendees, setNewAttendees] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [newDate, setNewDate] = useState(new Date());
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [newRoom, setNewRoom] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchReservations();
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // En el componente DatePicker, asegúrate de usar la zona horaria local
  <DatePicker
    selected={newDate}
    onChange={(date) => setNewDate(date)}
    dateFormat="yyyy-MM-dd"
    timeZone="UTC"
  />

  const fetchReservations = async () => {
    const db = getDatabase();
    const reservationsRef = ref(db, 'bookings');
  
    try {
      const snapshot = await get(reservationsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        const fetchedReservations = Object.entries(data).map(([bookingId, booking]) => ({
          id: bookingId,
          room: booking.room,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime
        }));
  
        setReservations(fetchedReservations);
      } else {
        console.log('No se encontraron reservas.');
        setReservations([]);
      }
    } catch (error) {
      console.error('Error al obtener las reservas:', error);
    }
  };

  const handleSearch = async () => {
    const db = getDatabase();
    const roomsRef = ref(db, 'meetingRooms');
    const bookingsRef = ref(db, 'bookings');
  
    try {
      console.log("Fetching rooms and bookings...");
  
      const roomsSnapshot = await get(roomsRef);
      if (!roomsSnapshot.exists()) {
        console.log("No rooms found in the database");
        alert("No rooms found in the database. Please contact the administrator.");
        return;
      }
      const rooms = roomsSnapshot.val();
      console.log("Rooms:", rooms);
  
      const bookingsQuery = query(bookingsRef, orderByChild('date'), equalTo(date.toISOString().split('T')[0]));
      const bookingsSnapshot = await get(bookingsQuery);
      const bookings = bookingsSnapshot.val() || {};
      console.log("Bookings for the selected date:", bookings);
  
      const availableRooms = [];
      const userStartTime = new Date(`${date.toDateString()} ${startTime}`);
      const userEndTime = new Date(`${date.toDateString()} ${endTime}`);
  
      console.log("Checking room availability...");
      Object.entries(rooms).forEach(([roomId, room]) => {
        console.log(`Checking room: ${room.roomName}`);
        
        const roomStartTime = new Date(`${date.toDateString()} ${room.startTime}`);
        const roomEndTime = new Date(`${date.toDateString()} ${room.endTime}`);
        
        const isRoomTimeConflict = (roomStartTime <= userEndTime && roomEndTime >= userStartTime);
        
        const isBookingConflict = Object.values(bookings).some(booking => 
          booking.room === room.roomName &&
          ((new Date(`${date.toDateString()} ${booking.startTime}`) < userEndTime &&
            new Date(`${date.toDateString()} ${booking.endTime}`) > userStartTime))
        );
  
        const isAvailable = !isRoomTimeConflict && !isBookingConflict;
  
        if (isAvailable) {
          console.log(`Room ${room.roomName} is available`);
          availableRooms.push(room.roomName);
        } else {
          console.log(`Room ${room.roomName} is not available`);
        }
      });
  
      console.log("Available rooms:", availableRooms);
  
      if (availableRooms.length > 0) {
        const message = `
          Date: ${date.toLocaleDateString()}
          Start Time: ${startTime}
          End Time: ${endTime}
          Available Rooms: ${availableRooms.join(', ')}
        `;
        alert(message);
        
        navigate('/booking', { 
          state: { 
            date: date.toISOString().split('T')[0], 
            startTime, 
            endTime, 
            availableRooms 
          } 
        });
      } else {
        alert('No rooms available for the selected time.');
      }
    } catch (error) {
      console.error('Error finding rooms:', error);
      alert(`There was an error finding available rooms: ${error.message}`);
    }
  };

  const handleEdit = async (reservation) => {
    setSelectedReservation(reservation);
    setNewDate(new Date(reservation.date + 'T00:00:00'));
    setNewStartTime(reservation.startTime);
    setNewEndTime(reservation.endTime);
    setNewRoom(reservation.room);
    setNewAttendees(reservation.attendees || []);
    
    // Fetch available rooms
    const rooms = await fetchAvailableRooms();
    setAvailableRooms(rooms);
    
    setShowPopup(true);
  };
  
  const fetchAvailableRooms = async () => {
    const db = getDatabase();
    const roomsRef = ref(db, 'meetingRooms');
    
    try {
      const snapshot = await get(roomsRef);
      if (snapshot.exists()) {
        return Object.values(snapshot.val()).map(room => room.roomName);
      }
      return [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  };
  
  const handleUpdateReservation = async () => {
    const db = getDatabase();
    const bookingsRef = ref(db, 'bookings');
  
    try {
      const formattedDate = newDate.toLocaleDateString('en-CA');
  
      const confirmationMessage = `
        Are you sure you want to update this reservation?
        
        New Room: ${newRoom}
        New Date: ${formattedDate}
        New Time: ${newStartTime} - ${newEndTime}
        
        Click OK to confirm or Cancel to abort.
      `;
  
      if (window.confirm(confirmationMessage)) {
        // Verificar si solo se están editando los asistentes
        const isOnlyAttendeesChanged = 
          selectedReservation.room === newRoom &&
          selectedReservation.date === formattedDate &&
          selectedReservation.startTime === newStartTime &&
          selectedReservation.endTime === newEndTime;
  
        if (isOnlyAttendeesChanged) {
          // Si solo se cambian los asistentes, actualizar directamente
          await update(ref(db, `bookings/${selectedReservation.id}`), {
            attendees: newAttendees
          });
  
          alert('Attendees updated successfully');
          setShowPopup(false);
          fetchReservations();
        } else {
          // Si se cambian otros campos, verificar disponibilidad
          const availableRooms = await checkAvailability(newDate, newStartTime, newEndTime);
          
          if (availableRooms.includes(newRoom)) {
            await update(ref(db, `bookings/${selectedReservation.id}`), {
              room: newRoom,
              date: formattedDate,
              startTime: newStartTime,
              endTime: newEndTime,
              attendees: newAttendees
            });
  
            alert('Reservation updated successfully');
            setShowPopup(false);
            fetchReservations();
          } else {
            alert('The selected room is not available for this time');
          }
        }
      } else {
        console.log('Reservation update cancelled by user');
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Error updating reservation');
    }
  }
  
  const handleCancelReservation = async () => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      const db = getDatabase();
      const bookingRef = ref(db, `bookings/${selectedReservation.id}`);
  
      try {
        await remove(bookingRef);
        alert('Reservation cancelled successfully');
        setShowPopup(false);
        fetchReservations();
      } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('Error cancelling reservation');
      }
    }
  };

  const checkAvailability = async (date, startTime, endTime) => {
    const db = getDatabase();
    const roomsRef = ref(db, 'meetingRooms');
    const bookingsRef = ref(db, 'bookings');
  
    try {
      const [roomsSnapshot, bookingsSnapshot] = await Promise.all([
        get(roomsRef),
        get(query(bookingsRef, orderByChild('date'), equalTo(date.toISOString().split('T')[0])))
      ]);
  
      const rooms = roomsSnapshot.val();
      const bookings = bookingsSnapshot.val() || {};
  
      const userStartTime = new Date(`${date.toDateString()} ${startTime}`);
      const userEndTime = new Date(`${date.toDateString()} ${endTime}`);
  
      const availableRooms = Object.entries(rooms).filter(([roomId, room]) => {
        const roomStartTime = new Date(`${date.toDateString()} ${room.startTime}`);
        const roomEndTime = new Date(`${date.toDateString()} ${room.endTime}`);
        
        const isRoomTimeConflict = (roomStartTime <= userEndTime && roomEndTime >= userStartTime);
        
        const isBookingConflict = Object.values(bookings).some(booking => 
          booking.room === room.roomName &&
          booking.id !== selectedReservation.id &&
          ((new Date(`${date.toDateString()} ${booking.startTime}`) < userEndTime &&
            new Date(`${date.toDateString()} ${booking.endTime}`) > userStartTime))
        );
  
        return !isRoomTimeConflict && !isBookingConflict;
      }).map(([_, room]) => room.roomName);
  
      return availableRooms;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
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
            reservations.map((reservation) => (
              <li key={reservation.id}>
                <h3>{reservation.room}</h3>
                <p>Date: {reservation.date}</p>
                <p>Time: {reservation.startTime} - {reservation.endTime}</p>
                <button onClick={() => handleEdit(reservation)}>Edit</button>
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

        {showPopup && (
          <div className="popup">
            <h3>Edit Reservation</h3>
            <select 
              value={newRoom} 
              onChange={(e) => setNewRoom(e.target.value)}
            >
              {availableRooms.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
            <DatePicker
              selected={newDate}
              onChange={(date) => setNewDate(date)}
              dateFormat="yyyy-MM-dd"
              timeZone="UTC"
            />
            <input
              type="time"
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
            />
            <input
              type="time"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
            />
            <input
              type="text"
              value={newAttendees.join(', ')}
              onChange={(e) => setNewAttendees(e.target.value.split(', '))}
              placeholder="Add attendees (comma separated)"
            />
            <button onClick={handleUpdateReservation}>Update Reservation</button>
            <button onClick={handleCancelReservation}>Cancel Reservation</button>
            <button onClick={() => setShowPopup(false)}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;