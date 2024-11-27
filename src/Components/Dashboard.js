  import React, { useState, useEffect } from 'react';
  import { onAuthStateChanged, getAuth } from 'firebase/auth'; 
  import { useNavigate } from 'react-router-dom';
  import { getDatabase, ref, get, query, orderByChild, equalTo, update, remove, onValue } from 'firebase/database';
  import Calendar from 'react-calendar';
  import { sendEmails } from './SendEmail'; 
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
    const auth = getAuth();

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

    useEffect(() => {
      const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
          setShowPopup(false);
        }
      };
    
      document.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }, []);

    
    <DatePicker
      selected={newDate}
      onChange={(date) => setNewDate(date)}
      dateFormat="yyyy-MM-dd"
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={60}    
    />

    const fetchReservations = () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.error("Unauthenticated user");
        return;
      }
      const db = getDatabase();
      const reservationsRef = ref(db, `bookings/${user.uid}`);
      
      onValue(reservationsRef, (snapshot) => {
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
          console.log('No bookings found.');
          setReservations([]);
        }
      });
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
        Object.entries(rooms).forEach(([room]) => {
          console.log(`Checking room: ${room.roomName}`);
          
          if (!room.isAvailable) {
            console.log(`Room ${room.roomName} is not available (isAvailable: false)`);
            return;
          }
    
          const roomOpeningTime = new Date(`${date.toDateString()} ${room.openingTime}`);
          const roomClosingTime = new Date(`${date.toDateString()} ${room.closingTime}`);
          
          const isWithinOperatingHours = (userStartTime >= roomOpeningTime && userEndTime <= roomClosingTime);
          
          const isBookingConflict = Object.values(bookings).some(booking => 
            booking.room === room.roomName &&
            ((new Date(`${date.toDateString()} ${booking.startTime}`) < userEndTime &&
              new Date(`${date.toDateString()} ${booking.endTime}`) > userStartTime))
          );
    
          const isAvailable = isWithinOperatingHours && !isBookingConflict;
    
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
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found.");
        return;
      }
      const db = getDatabase();
      const bookingRef = ref(db, `bookings/${user.uid}/${selectedReservation.id}`);
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
          const isOnlyAttendeesChanged = 
            selectedReservation.room === newRoom &&
            selectedReservation.date === formattedDate &&
            selectedReservation.startTime === newStartTime &&
            selectedReservation.endTime === newEndTime;
  
          if (isOnlyAttendeesChanged) {
            await update(bookingRef, {
              attendees: newAttendees
            });
            alert('Attendees updated successfully');
          } else {
            const availableRooms = await checkAvailability(newDate, newStartTime, newEndTime);
            if (availableRooms.includes(newRoom)) {
              await update(bookingRef, {
                room: newRoom,
                date: formattedDate,
                startTime: newStartTime,
                endTime: newEndTime,
                attendees: newAttendees
              });
              alert('Reservation updated successfully');
            } else {
              alert('The selected room is not available for this time');
            }
          }
          setShowPopup(false);
          fetchReservations();
        } else {
          console.log('Reservation update cancelled by user');
        }
      } catch (error) {
        console.error('Error updating reservation:', error);
        alert('Error updating reservation');
      }
    };
    
    const handleCancelReservation = async () => {
      if (window.confirm('Are you sure you want to cancel this reservation?')) {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          console.error("No authenticated user found.");
          return;
        }
        const db = getDatabase();
        const bookingRef = ref(db, `bookings/${user.uid}/${selectedReservation.id}`);
        try {
          const snapshot = await get(bookingRef);
          const bookingData = snapshot.val();
    
          await remove(bookingRef);
    
          // Enviar email de cancelación principal
          await sendEmails(bookingData, true);
    
          // Enviar email de cancelación a Facilities si estaba marcado
          if (bookingData.contactFacilitiesChecked) {
            const facilitiesBooking = {
              ...bookingData,
              attendees: ['j.marinp@outlook.com'],
              message: 'A booking that required facilities support has been cancelled.'
            };
            await sendEmails(facilitiesBooking, true);
          }
    
          // Enviar email de cancelación a IT si estaba marcado
          if (bookingData.contactITChecked) {
            const itBooking = {
              ...bookingData,
              attendees: ['jimemarinp@gmail.com'],
              message: 'A booking that required IT support has been cancelled.'
            };
            await sendEmails(itBooking, true);
          }
    
          alert('Reservation cancelled successfully and notifications sent');
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
          if (!room.isAvailable) return false;
    
          const roomOpeningTime = new Date(`${date.toDateString()} ${room.openingTime}`);
          const roomClosingTime = new Date(`${date.toDateString()} ${room.closingTime}`);
          
          const isWithinOperatingHours = (userStartTime >= roomOpeningTime && userEndTime <= roomClosingTime);
          
          const isBookingConflict = Object.values(bookings).some(booking => 
            booking.room === room.roomName &&
            booking.id !== selectedReservation.id &&
            ((new Date(`${date.toDateString()} ${booking.startTime}`) < userEndTime &&
              new Date(`${date.toDateString()} ${booking.endTime}`) > userStartTime))
          );
    
          return isWithinOperatingHours && !isBookingConflict;
        }).map(([_, room]) => room.roomName);
    
        return availableRooms;
      } catch (error) {
        console.error('Error checking availability:', error);
        throw error;
      }
    };

    return (
      <div className="dashboard-container">      
        <Navbar user={user}/>      
        <hr className="navbar-hr"></hr>
        <div className="dashboard-body">
          <h6>Dashboard</h6>
          <br/>
          <h2>Overview</h2>
          <hr className="dashboard-hr"></hr>
          <br/>
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
          <br/>
          <h2>New Bookings</h2>
          <hr className='dashboard-hr'></hr>
          <br/>
          <div className="booking-section">
            <div><Calendar onChange={setDate} value={date} /></div>
            <div className="time-selection">
              <div className='time-row'>
                <div>
                <label htmlFor="startTime">Start Time:</label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step="3600"
                  min="00:00"
                  max="23:59"
                />
                </div>
                <div>
                <label htmlFor="endTime">End Time:</label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  step="3600"
                  data-format="24h"
                />
                </div>
              </div>
              <br/>
              <button onClick={handleSearch}>Search</button>            
            </div>
          </div>
          {showPopup && (
            <div 
            className="popup-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPopup(false);
              }
            }}
          >
            <div className="popup" >  
              <div className='rightside'>
              <select 
                value={newRoom} 
                onChange={(e) => setNewRoom(e.target.value)}
              >
                {availableRooms.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
              <button onClick={handleCancelReservation}>Cancel Reservation</button>
              </div>
              <div className='leftside'>
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
              <button onClick={() => setShowPopup(false)}>Close</button>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  export default Dashboard;