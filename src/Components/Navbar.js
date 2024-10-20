import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { getAuth, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Company_Logo from '../img/meetapp.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

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
      console.error("Error loging out: ", error);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError('No authenticated user.');
      return;
    }

    try {
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);

      // Cambiar la contraseña
      await updatePassword(user, newPassword);

      alert('Password successfully changed!');
      setIsModalOpen(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message);
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
            <button className="dropdown-item" onClick={() => setIsModalOpen(true)}>
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
            <h2>Change Password</h2>
            {error && <p className="error-message">{error}</p>}
            <input
              type="password"
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button onClick={handleChangePassword}>Update Password</button>
            <button onClick={() => {
              setIsModalOpen(false);
              setOldPassword('');
              setNewPassword('');
              setError('');
            }}>Cancel</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;