import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Page.css';

const Admin = () => {
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
    if (parsedUser.role !== 'admin') {
      // Redirect to appropriate page based on role
      if (parsedUser.role === 'employee') {
        navigate('/employee');
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
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      <div className="page-content">
        <div className="welcome-card">
          <h2>Welcome, Admin!</h2>
          <p>You are logged in as an <strong>Admin</strong></p>
          <p>Email: {user.email}</p>
        </div>
        
        <div className="dashboard-grid">
          <div className="dashboard-card" onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>
            <h3>User Management</h3>
            <p>Manage all users in the system</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/admin/employees')} style={{ cursor: 'pointer' }}>
            <h3>Employee Management</h3>
            <p>Manage all employees in the system</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/admin/products')} style={{ cursor: 'pointer' }}>
            <h3>Product Management</h3>
            <p>Manage all products in the system</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/admin/leads')} style={{ cursor: 'pointer' }}>
            <h3>Lead Management</h3>
            <p>Manage all leads and assignments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

