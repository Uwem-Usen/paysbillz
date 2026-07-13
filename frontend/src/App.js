import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Airtime from './pages/Airtime';
import Data from './pages/Data';
import Electricity from './pages/Electricity';
import TV from './pages/TV';
import Transactions from './pages/Transactions';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/airtime" element={<PrivateRoute><Airtime /></PrivateRoute>} />
        <Route path="/data" element={<PrivateRoute><Data /></PrivateRoute>} />
        <Route path="/electricity" element={<PrivateRoute><Electricity /></PrivateRoute>} />
        <Route path="/tv" element={<PrivateRoute><TV /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;