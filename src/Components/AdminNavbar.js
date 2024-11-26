import React, { useState, useEffect } from 'react';
import './AdminNavbar.css';
import { getAuth, signOut, createUserWithEmailAndPassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getDatabase, ref, push, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import Company_Logo from '../img/meetapp.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(() => {
    const savedState = localStorage.getItem('dropdownOpen');
    return savedState ? JSON.parse(savedState) : false;
  });
  const [userName, setUserName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserData, setNewUserData] = useState({ firstName: '', lastName: '', email: '', role: '' });
  const [newRoomData, setNewRoomData] = useState({ roomName: '', capacity: 0, isAvailable: true, openingTime: '', closingTime: '' });

  // Obtener el usuario de Firebase
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const displayName = user.displayName || user.email;
        setUserName(displayName);
      } else {
        setUserName('');
      }
    });

    return () => unsubscribe();
  }, []);

  // Persistir el estado del dropdown
  useEffect(() => {
    localStorage.setItem('dropdownOpen', JSON.stringify(dropdownOpen));
  }, [dropdownOpen]);

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.navbar-profile')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

  const toggleDropdown = (event) => {
    event.stopPropagation();
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
    setError('');
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("No hay usuario autenticado");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      console.log("Contraseña actualizada exitosamente");
      setIsModalOpen(false);
      // Aquí puedes agregar lógica adicional, como mostrar un mensaje de éxito
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError("La contraseña actual es incorrecta");
      } else {
        setError("Error al cambiar la contraseña: " + err.message);
      }
    }
  };


  const handleNewUserCreation = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, role } = newUserData;

    if (!firstName || !lastName || !email || !role) {
        alert("Por favor, completa todos los campos.");
        return;
    }
    console.log("Creando usuario...");
    try {
        const auth = getAuth();
        const tempPassword = 'TempPass123!';
        const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
        const user = userCredential.user;
        console.log('Usuario creado:', user);
        const uid = user.uid;
        const standardPassword = `${firstName[0]}${lastName}${uid.slice(-3)}`;
        console.log('Contraseña standard:', standardPassword);
        // Reautenticación con las credenciales temporales
        const credential = EmailAuthProvider.credential(email, tempPassword);
        await reauthenticateWithCredential(user, credential);

        // Ahora puedes actualizar la contraseña
        await updatePassword(user, standardPassword); // Esta línea es correcta
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    if (modalType === 'newUser') {
      setNewUserData(prevData => ({
        ...prevData,
        [name]: value
      }));
    } else if (modalType === 'newRoom') {
      setNewRoomData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
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
                <h2 className='modal-title'>Change Password</h2>
                <input
                  type="password"
                  className='modal-inputs' 
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                  type="password"
                  className='modal-inputs' 
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {error && <p className="error">{error}</p>}
                <button className="modal-button" onClick={handleChangePassword}>Change Password</button>
              </>
            )}
            {modalType === 'newUser' && (
              <>
                <h2 className='modal-title'>Create New User</h2>
                <form onSubmit={handleNewUserCreation}>
                  <input type="text" className='modal-inputs'  name="firstName" placeholder="First Name" onChange={handleInputChange} required />
                  <input type="text" className='modal-inputs'  name="lastName" placeholder="Last Name" onChange={handleInputChange} required />
                  <input type="email" className='modal-inputs'  name="email" placeholder="Email" onChange={handleInputChange} required />
                  <select name="role" className='modal-inputs'  onChange={handleInputChange} required>
                    <option value="">Select Role</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="modal-button" type="submit">Create User</button>
                </form>
              </>
            )}
            {modalType === 'newRoom' && (
              <>
                <h2 className='modal-title'>Create New Meeting Room</h2>
                <form onSubmit={handleNewRoomCreation}>
                  <input 
                    type="text" 
                    className='modal-inputs' 
                    name="roomName" 
                    placeholder="Room Name" 
                    onChange={handleInputChange} 
                    required 
                  />
                  <input 
                    type="number" 
                    className='modal-inputs' 
                    name="capacity" 
                    placeholder="Capacity" 
                    onChange={handleInputChange} 
                    required 
                  />
                  <div>
                    <label>Available:</label>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        className='modal-inputs' 
                        name="isAvailable" 
                        checked={newRoomData.isAvailable}
                        onChange={handleInputChange} 
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <label>Openning Time:</label>
                  <input 
                    type="time" 
                    className='modal-inputs' 
                    name="openingTime" 
                    placeholder="Opening Time" 
                    onChange={handleInputChange} 
                    required 
                  />
                  <label>Closing Time:</label>
                  <input 
                    type="time" 
                    className='modal-inputs' 
                    name="closingTime" 
                    placeholder="Closing Time" 
                    onChange={handleInputChange} 
                    required 
                  />
                  <button className="modal-button" type="submit">Create Room</button>
              </form>
              </>
            )}
            <button className="modal-button" onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;