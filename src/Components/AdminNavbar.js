import React, { useState, useEffect } from 'react';
import './AdminNavbar.css';
import { getAuth, signOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
    role: ''
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
      navigate('/adminlogin');
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
    }
  };

  const handleChangePassword = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert('No hay usuario autenticado. Por favor, inicia sesión nuevamente.');
      // Opcionalmente, redirige al usuario a la página de inicio de sesión
      // navigate('/login');
      return;
    }
  
    if (!newPassword) {
      alert('Por favor, ingresa una nueva contraseña.');
      return;
    }
  
    try {
      await user.updatePassword(newPassword);
      alert('Contraseña cambiada exitosamente');
      setNewPassword('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      let errorMessage = 'Error al cambiar la contraseña';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por seguridad, debes volver a iniciar sesión antes de cambiar tu contraseña.';
        // Aquí podrías implementar una lógica para cerrar sesión y redirigir al usuario a la página de inicio de sesión
        // handleLogout();
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      }
      
      alert(errorMessage);
    }
  };

  const handleNewUserCreation = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, role } = newUserData;
    
    if (!firstName || !lastName || !email || !role) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      const auth = getAuth();
      const tempPassword = 'TempPass123!';
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      const user = userCredential.user;

      const uid = user.uid;
      const standardPassword = `${firstName[0]}${lastName[0]}${uid.slice(-3)}`;

      await user.updatePassword(standardPassword);
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      const db = getDatabase();
      await set(ref(db, 'users/' + uid), {
        firstName,
        lastName,
        email,
        role,
        isActive: true
      });

      alert(`Usuario creado exitosamente. Contraseña: ${standardPassword}`);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert(`Error al crear usuario: ${error.message}`);
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
                placeholder="Nueva Contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button onClick={handleChangePassword}>Cambiar Contraseña</button>
            </>
          )}
            {modalType === 'newUser' && (
              <>
                <h2>Create New User</h2>
                <form onSubmit={handleNewUserCreation}>
                  <input type="text" name="firstName" placeholder="First Name" onChange={handleInputChange} required />
                  <input type="text" name="lastName" placeholder="Last Name" onChange={handleInputChange} required />
                  <input type="email" name="email" placeholder="Email" onChange={handleInputChange} required />
                  <select name="role" onChange={handleInputChange} required>
                    <option value="">Select Role</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
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
            <button onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;