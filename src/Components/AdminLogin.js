import React, { useState } from 'react';
import './Login.css';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig'; 
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
      navigate('/AdminDash'); 
      
      console.log('Login exitoso');
    } catch (error) {
      console.error('Error al iniciar sesión: ', error);
    }
  };

  const handlePasswordReset = () => {
    // Lógica para enviar correo de restablecimiento de contraseña
    console.log('Restablecer contraseña');
  };

  return (
    <div className="login-container">
      <div className="left-side">
        <img src="../img/meetapp.png" alt="Company Logo" className="company-logo" />
      </div>
      <div className="right-side">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Welcome Back</h2>
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
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <div className="forgot-password">
              <button type="button" onClick={handlePasswordReset}>
                Forgot my password
              </button>
              <button type="button" onClick={handlePasswordReset}>
                Reset my password
              </button>
            </div>
          </div>
          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
