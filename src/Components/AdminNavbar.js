import React, { useState, useEffect } from 'react';
import './AdminNavbar.css';
import { getAuth, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, push, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import Company_Logo from '../img/meetapp.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const displayName = user.displayName || user.email;
      setUserName(displayName);
    }
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
    }
  };

  const handleChangePassword = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    try {
      await user.updatePassword(newPassword);
      alert('Contraseña cambiada exitosamente');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      alert('Error al cambiar la contraseña');
    }
  };

  const handleNewUserCreation = async (e) => {
    e.preventDefault();
    const { email, password, firstName, lastName } = newUserData;
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const db = getDatabase();
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      await set(userRef, {
        firstName,
        lastName,
        email
      });
      alert('User successfully created');
      setIsModalOpen(false);
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
      await set(newRoomRef, newRoomData);
      alert(`Room created: ${newRoomData.roomName}`);
      setIsModalOpen(false);
    } catch (error) {
      alert(`Error creating room: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    if (modalType === 'newUser') {
      setNewUserData({ ...newUserData, [e.target.name]: e.target.value });
    } else if (modalType === 'newRoom') {
      setNewRoomData({ ...newRoomData, [e.target.name]: e.target.value });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/AdminDash')}>
        <img src={Company_Logo} alt="Company Logo" />
      </div>

      <div className={`navbar-profile ${dropdownOpen ? 'active' : ''}`}>
        <div className="profile-info" onClick={toggleDropdown}>
          <span className="user-name">{userName}</span>
        </div>

        {dropdownOpen && (
          <div className="dropdown-menu">
            <button className="dropdown-item" onClick={() => { setModalType('changePassword'); setIsModalOpen(true); }}>
              Change My Password
            </button>
            <button className="dropdown-item" onClick={() => { setModalType('newUser'); setIsModalOpen(true); }}>
              Create New User
            </button>
            <button className="dropdown-item" onClick={() => { setModalType('newRoom'); setIsModalOpen(true); }}>
              Create New Meeting Room
            </button>
            <button className="dropdown-item" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="navbar-divider"></div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            {modalType === 'changePassword' && (
              <>
                <h2>Change Password</h2>
                <input
                  type="password"
                  placeholder="Contraseña Anterior"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Nueva Contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button onClick={handleChangePassword}>Actualizar Contraseña</button>
              </>
            )}
            {modalType === 'newUser' && (
              <>
                <h2>Create New User</h2>
                <form onSubmit={handleNewUserCreation}>
                  <input type="text" name="firstName" placeholder="First Name" onChange={handleInputChange} required />
                  <input type="text" name="lastName" placeholder="Last Name" onChange={handleInputChange} required />
                  <input type="email" name="email" placeholder="Email" onChange={handleInputChange} required />
                  <input type="password" name="password" placeholder="Password" onChange={handleInputChange} required />
                  <button type="submit">Create User</button>
                </form>
              </>
            )}
            {modalType === 'newRoom' && (
              <>
                <h2>Create New Meeting Room</h2>
                <form onSubmit={handleNewRoomCreation}>
                  <input type="text" name="roomName" placeholder="Room Name" onChange={handleInputChange} required />
                  <input type="number" name="capacity" placeholder="Capacity" onChange={handleInputChange} required />
                  <input type="time" name="startTime" placeholder="Start Time" onChange={handleInputChange} required />
                  <input type="time" name="endTime" placeholder="End Time" onChange={handleInputChange} required />
                  <button type="submit">Create Room</button>
                </form>
              </>
            )}
            <button onClick={() => setIsModalOpen(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;