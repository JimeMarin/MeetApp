import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import './App.css';
import Admin from './Components/Admin';


function App() {
  return (
    <Router>
      
        <Routes>
          
          <Route path="*" element={<Login />} />         
          
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/admin" element={<Admin />} />
          
        </Routes>
      
    </Router>
  );
}

export default App;
