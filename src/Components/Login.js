import React, { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from './firebaseConfig'; 
import { getDatabase, ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import Company_Logo from '../img/meetapp.png';
import './Login.css';
import AdminDash from './AdminDash.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Establecer la persistencia basada en la opción "Remember me"
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      // Iniciar sesión
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Manejar "Remember me"
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // No limpiar el email si "Remember me" está activado
      if (!rememberMe) {
        setEmail('');
      }
      setPassword('');

      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();

        // Redirección basada en el rol del usuario
        if (userData.role === 'admin') {
            navigate('/AdminDash'); // Redirigir al dashboard de empleados
        } else if (userData.role === 'user') {
            navigate('/Dashboard');
          } else {
            alert('Acceso denegado. No tienes permiso para acceder a esta área.');
            await auth.signOut(); // Deslogar si no es un rol válido
            navigate('/'); // Redirigir a la página inicial
        }
      } else {
          alert('Usuario no encontrado.');
          await auth.signOut(); // Deslogar si no se encuentra el usuario
          navigate('/'); // Redirigir a la página inicial
      }
    } catch (error) {      
      console.error('Inicio de sesión fallido:', error);
      alert('Correo electrónico o contraseña inválidos');
    }
  };

  const handleRememberMeChange = (e) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    if (!isChecked) {
      localStorage.removeItem('rememberedEmail');
    }
    else{
      localStorage.setItem('rememberedEmail', email);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      alert('Password reset email sent. Please check your inbox.');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      alert('Error sending password reset email. Please try again.');
    }
  };

  const handleResetPassword = () => {
    navigate('/reset');
  };

  return (
    <div className="login-container">
      <div className="left-side">
        <div className="company-logo">
        <img src={Company_Logo} alt="Company Logo" />
        </div>
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
              autoComplete="username"
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
              autoComplete="current-password"
              required
            />
          </div>
          <div className="options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <div className="forgot-password">
              <button type="button" onClick={handleForgotPassword}>
                Forgot my password
              </button>
              <button type="button" onClick={handleResetPassword}>
                Reset my password
              </button>
            </div>
          </div>
          {resetEmailSent && (
            <p className="reset-email-sent">Password reset email sent. Please check your inbox.</p>
          )}
          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;