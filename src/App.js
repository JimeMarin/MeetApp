import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import './App.css';
import AdminDash from './Components/AdminDash';
import AdminLogin from './Components/AdminLogin';
import Booking from './Components/Booking';
import Navbar from './Components/Navbar';
import Reset from './Components/Reset';


function App() {
  return (
    <Router>
      
        <Routes>
          <Route path="/*" element={<Login />} />
          <Route path="/reset" element={<Reset />} />     
          <Route path="/navbar" element={<Navbar />} />
          <Route path="/adminlogin" element={<AdminLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admindash" element={<AdminDash />} />
          <Route path="/booking" element={<Booking />} />
          
        </Routes>
      
    </Router>
  );
}

export default App;
