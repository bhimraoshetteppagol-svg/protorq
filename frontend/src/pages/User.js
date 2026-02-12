import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Page.css';

const User = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'user') {
      // Redirect to appropriate page based on role
      if (parsedUser.role === 'admin') {
        navigate('/admin');
      } else if (parsedUser.role === 'employee') {
        navigate('/employee');
      } else {
        navigate('/login');
      }
      return;
    }

    setUser(parsedUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>User Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      <div className="page-content">
        <div className="welcome-card">
          <h2>Welcome, User!</h2>
          <p>You are logged in as a <strong>User</strong></p>
          <p>Email: {user.email}</p>
        </div>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>My Account</h3>
            <p>Manage your account settings</p>
          </div>
          
          <div className="dashboard-card">
            <h3>Services</h3>
            <p>Browse available services</p>
          </div>
          
          <div className="dashboard-card">
            <h3>Support</h3>
            <p>Get help and support</p>
          </div>
          
          <div className="dashboard-card">
            <h3>History</h3>
            <p>View your activity history</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default User;

