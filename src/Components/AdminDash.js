import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig'; 
import { getDatabase, ref, push, set, onValue, remove, query, orderByChild, equalTo } from 'firebase/database'; // Importar consulta
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';
import meetapp from '../img/meetapp.png';

const AdminDash = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [emailToDelete, setEmailToDelete] = useState(''); // Email a eliminar
  const [isConfirmPopupVisible, setIsConfirmPopupVisible] = useState(false); // Control del popup de confirmación
  const [selectedUserId, setSelectedUserId] = useState(null); // ID del usuario seleccionado para eliminar

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

    // Obtener usuarios
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setUsers(usersList);
      }
    });

    // Obtener salas de reunión
    onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomsList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setRooms(roomsList);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleNewUserCreation = async (e) => {
    e.preventDefault();
    const { email, password } = newUserData;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      //add to your realtimedatabase AGREGAR LO MISMO QUE PARA ROOMS Y PUSH LOS IDS
      const db = getDatabase();
      const userRef = ref(db, 'users');

      alert('User successfully created');
      setShowUserForm(false);
    } catch (error) {
      alert(`Error creating user: ${error.message}`);
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

  // Buscar el usuario por email en la base de datos y mostrar confirmación
  const handleSearchEmailToDelete = async (e) => {
    e.preventDefault();
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const emailQuery = query(usersRef, orderByChild('email'), equalTo(emailToDelete));

    onValue(emailQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userId = Object.keys(data)[0]; // Obtener el ID del usuario
        showConfirmationPopup(userId);
      } else {
        alert('User not found');
      }
    });
  };

  // Eliminar usuario
  const handleDeleteUser = (userId) => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    remove(userRef)
      .then(() => {
        alert('User deleted successfully');
        hideConfirmationPopup();
      })
      .catch((error) => alert(`Error deleting user: ${error.message}`));
  };

  // Mostrar el popup de confirmación
  const showConfirmationPopup = (userId) => {
    setSelectedUserId(userId);
    setIsConfirmPopupVisible(true);
  };

  // Ocultar el popup de confirmación
  const hideConfirmationPopup = () => {
    setIsConfirmPopupVisible(false);
    setSelectedUserId(null);
  };

  // Eliminar sala de reunión
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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <a href="/dashboard" className="logo-link">
          <img src={meetapp} alt="Company Logo" className="company-logo" />
        </a>
        {user && (
          <div className={`user-menu ${menuOpen ? "open" : ""}`} onClick={toggleMenu}>
            <img src="/path-to-profile-pic.png" alt="User Profile" className="profile-pic" />
            <div className="user-info">
              <span>{user.displayName}</span>
              <span className="dropdown-arrow"></span>
            </div>
            {menuOpen && (
              <div className="dropdown-content">
                <button onClick={handleLogout}>Logout</button>
                <button onClick={() => setShowUserForm(true)}>Create New User</button>
                <button onClick={() => setShowRoomForm(true)}>Create New Meeting Room</button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="dashboard-body">
        <h1>Administrator Dashboard</h1>

        <h2>Delete a User by Email</h2>
        <form onSubmit={handleSearchEmailToDelete}>
          <label>Enter user email:</label>
          <input
            type="email"
            value={emailToDelete}
            onChange={(e) => setEmailToDelete(e.target.value)}
            required
          />
          <button type="submit">Search and Delete</button>
        </form>

        {/* Popup de confirmación */}
        {isConfirmPopupVisible && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>Are you sure you want to delete this user?</h2>
              <p>This action cannot be undone.</p>
              <button onClick={() => handleDeleteUser(selectedUserId)}>Yes, delete</button>
              <button onClick={hideConfirmationPopup}>Cancel</button>
            </div>
          </div>
        )}

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
              <input
                type="text"
                name="firstName"
                value={newUserData.firstName}
                onChange={handleInputChange}
                required
              />
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={newUserData.lastName}
                onChange={handleInputChange}
                required
              />
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={newUserData.email}
                onChange={handleInputChange}
                required
              />
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={newUserData.password}
                onChange={handleInputChange}
                required
              />
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
              <input
                type="text"
                name="roomName"
                value={newRoomData.roomName}
                onChange={handleRoomInputChange}
                required
              />
              <label>Capacity</label>
              <input
                type="number"
                name="capacity"
                value={newRoomData.capacity}
                onChange={handleRoomInputChange}
                required
              />
              <label>Start Time</label>
              <input
                type="time"
                name="startTime"
                value={newRoomData.startTime}
                onChange={handleRoomInputChange}
                required
              />
              <label>End Time</label>
              <input
                type="time"
                name="endTime"
                value={newRoomData.endTime}
                onChange={handleRoomInputChange}
                required
              />
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
