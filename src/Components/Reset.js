import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Reset.css';

const Reset = () => {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      
      const userCredential = await signInWithEmailAndPassword(auth, email, currentPassword);
      const user = userCredential.user;

   
      await updatePassword(user, newPassword);

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000); 
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="reset-container">
      <h2>Reset Password</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">Password successfully updated! Redirecting to login...</p>}
      <form onSubmit={handleResetPassword}>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="reset-button">Reset Password</button>
      </form>
    </div>
  );
};

export default Reset;