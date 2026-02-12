import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Page.css';

const Employee = () => {
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
    if (parsedUser.role !== 'employee') {
      // Redirect to appropriate page based on role
      if (parsedUser.role === 'admin') {
        navigate('/admin');
      } else if (parsedUser.role === 'user') {
        navigate('/user');
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
        <h1>Employee Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      <div className="page-content">
        <div className="welcome-card">
          <h2>Welcome, Employee!</h2>
          <p>You are logged in as an <strong>Employee</strong></p>
          <p>Email: {user.email}</p>
        </div>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Tasks</h3>
            <p>View and manage your assigned tasks</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/employee/users')} style={{ cursor: 'pointer' }}>
            <h3>User Management</h3>
            <p>Manage all users in the system</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/employee/leads')} style={{ cursor: 'pointer' }}>
            <h3>Lead Management</h3>
            <p>View your assigned leads</p>
          </div>
          
          <div className="dashboard-card">
            <h3>Profile</h3>
            <p>Update your employee profile</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employee;

