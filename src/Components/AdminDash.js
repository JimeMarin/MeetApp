import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { getDatabase, ref, onValue, remove, query, orderByChild, equalTo, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';
import Navbar from './AdminNavbar';

const AdminDash = () => {
  const [user, setUser] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [emailToDelete, setEmailToDelete] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        navigate('/login');
      }
    });

    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const roomsRef = ref(db, 'meetingRooms');

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setUsers(usersList);
      }
    });

    onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomsList = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setRooms(roomsList);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSearchAndDeleteEmail = async (e) => {
    e.preventDefault();
    console.log("Searching for email:", emailToDelete);
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const emailQuery = query(usersRef, orderByChild('email'), equalTo(emailToDelete));
    try {
      const snapshot = await get(emailQuery);
      const data = snapshot.val();
      if (data) {
        const userId = Object.keys(data)[0];
        console.log("User found:", data[userId]);
        const confirmDelete = window.confirm(`Are you sure you want to delete the user with email ${emailToDelete}?`);
        if (confirmDelete) {
          handleDeleteUser(userId);
        }
      } else {
        console.log("User not found");
        alert("User not found");
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      alert(`Error searching for user: ${error.message}`);
    }
  }

  const handleDeleteUser = (userId) => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    remove(userRef)
      .then(() => {
        alert('User deleted successfully');
      })
      .catch((error) => alert(`Error deleting user: ${error.message}`));
  }

  const handleDeleteRoom = (roomId) => {
    const db = getDatabase();
    const roomRef = ref(db, `meetingRooms/${roomId}`);
    remove(roomRef)
      .then(() => alert('Room deleted successfully'))
      .catch((error) => alert(`Error deleting room: ${error.message}`));
  };

  return (
    <div className="dashboard-container">
      <Navbar user={user} auth={auth} />
      
      <div className="dashboard-body">
        <h1>Administrator Dashboard</h1>
        <h2>Delete a User by Email</h2>
        <form onSubmit={handleSearchAndDeleteEmail}>
          <label>Enter user email:</label>
          <input
            type="email"
            value={emailToDelete}
            onChange={(e) => setEmailToDelete(e.target.value)}
            required
          />
          <button type="submit">Search and Delete</button>
        </form>
        <h2>Manage Users</h2>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.firstName} {user.lastName} ({user.email})
              <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
            </li>
          ))}
        </ul>
        <h2>Manage Meeting Rooms</h2>
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>
              {room.roomName} - Capacity: {room.capacity}
              <button onClick={() => handleDeleteRoom(room.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDash;