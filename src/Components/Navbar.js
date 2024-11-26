import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { getAuth, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Company_Logo from '../img/meetapp.png';

const Navbar = ({ onChangePassword, onLogout }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(() => {
    const savedState = localStorage.getItem('dropdownOpen');
    return savedState ? JSON.parse(savedState) : false;
  });
  
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

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

  useEffect(() => {
    localStorage.setItem('dropdownOpen', JSON.stringify(dropdownOpen));
  }, [dropdownOpen]);

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
    const user = auth.currentUser ;

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

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/Dashboard')}>
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
                <h2 className="modal-title">Change Password</h2>
                <input
                  type="password"
                  className="user-modal"
                  placeholder="Current password"  
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="user-modal"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {error && <p className="error">{error}</p>}
                <button className='user-button' onClick={handleChangePassword}>Change Password</button>
                <button className="user-button" onClick={() => setIsModalOpen(false)}>Close</button>
              </>
            )}
          </div>
        </div>
      )}
      
    </nav>
  );
};

export default Navbar;