import React, { useState, useEffect } from 'react';
import './AdminNavbar.css';
import { getAuth, signOut, createUserWithEmailAndPassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getDatabase, ref, push, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import Company_Logo from '../img/meetapp.png';


const Navbar = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleChangePassword(currentPassword, newPassword);
      // Mostrar mensaje de éxito
      console.log("Contraseña cambiada con éxito");
    } catch (error) {
      // Mostrar mensaje de error
      console.error(error.message);
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
                  placeholder="Contraseña Actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Nueva Contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {error && <p className="error">{error}</p>}
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