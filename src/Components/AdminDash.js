import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { getDatabase, ref, push, set, onValue, remove, query, orderByChild, equalTo, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';
import Navbar from './AdminNavbar';
import meetapp from '../img/meetapp.png';

const AdminDash = () => {
  const [user, setUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [newRoomData, setNewRoomData] = useState({
    roomName: '',
    capacity: '',
    startTime: '',
    endTime: ''
  });
  const [emailToDelete, setEmailToDelete] = useState('');
  const [isConfirmPopupVisible, setIsConfirmPopupVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
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

  const handleNewUserCreation = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, role } = newUserData;
    
    try {
        // Crear usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, 'tempPassword123');
        const uid = userCredential.user.uid;

        // Generar contraseña estándar
        const standardPassword = `${firstName[0]}${lastName[0]}${uid.slice(-3)}`;

        // Actualizar la contraseña del usuario
        await userCredential.user.updatePassword(standardPassword);

        // Obtener referencia a la base de datos
        const db = getDatabase();

        // Crear entrada en la tabla 'users' de Realtime Database
        await set(ref(db, 'users/' + uid), {
            firstName,
            lastName,
            email,
            role, // 'user' o 'admin', según lo seleccionado
            isActive: true
        });

        alert(`User successfully created. Password: ${standardPassword}`);
        setShowUserForm(false);
        // Aquí puedes agregar lógica adicional, como resetear el formulario
    } catch (error) {
        console.error('Error creating the user', error);
        alert(`Error creating the user: ${error.message}`);
    }
};

  const handleNewRoomCreation = async (e) => {
    e.preventDefault();
    try {
      const db = getDatabase();
      const roomRef = ref(db, 'meetingRooms');
      const newRoomRef = push(roomRef);
      await set(newRoomRef, {
        roomName: newRoomData.roomName,
        capacity: newRoomData.capacity,
        startTime: newRoomData.startTime,
        endTime: newRoomData.endTime
      });
      alert(`Room created: ${newRoomData.roomName}`);
      setShowRoomForm(false);
    } catch (error) {
      alert(`Error creating room: ${error.message}`);
    }
  };

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

  const handleInputChange = (e) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value });
  };

  const handleRoomInputChange = (e) => {
    setNewRoomData({ ...newRoomData, [e.target.name]: e.target.value });
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
      {showUserForm && (
        <div className="popup-form">
          <div className="popup-content">
            <h2>Create New User</h2>
            <form onSubmit={handleNewUserCreation}>
              <label>First Name</label>
              <input type="text" name="firstName" value={newUserData.firstName} onChange={handleInputChange} required />
              <label>Last Name</label>
              <input type="text" name="lastName" value={newUserData.lastName} onChange={handleInputChange} required />
              <label>Email</label>
              <input type="email" name="email" value={newUserData.email} onChange={handleInputChange} required />
              <label>Password</label>
              <input type="password" name="password" value={newUserData.password} onChange={handleInputChange} required />
              <button type="submit">Register</button>
              <button type="button" onClick={() => setShowUserForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
      {showRoomForm && (
        <div className="popup-form">
          <div className="popup-content">
            <h2>Create New Meeting Room</h2>
            <form onSubmit={handleNewRoomCreation}>
              <label>Room Name</label>
              <input type="text" name="roomName" value={newRoomData.roomName} onChange={handleRoomInputChange} required />
              <label>Capacity</label>
              <input type="number" name="capacity" value={newRoomData.capacity} onChange={handleRoomInputChange} required />
              <label>Start Time</label>
              <input type="time" name="startTime" value={newRoomData.startTime} onChange={handleRoomInputChange} required />
              <label>End Time</label>
              <input type="time" name="endTime" value={newRoomData.endTime} onChange={handleRoomInputChange} required />
              <button type="submit">Create Room</button>
              <button type="button" onClick={() => setShowRoomForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDash;