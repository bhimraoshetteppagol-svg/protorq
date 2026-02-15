import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import './EmployeeManagement.css';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/admin');
      return;
    }

    fetchEmployees();
  }, [navigate]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setFormData({
      email: '',
      password: '',
      role: 'employee'
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email,
      password: '',
      role: employee.role
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/employees/${employeeId}`);
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingEmployee) {
        // Update existing employee
        const updateData = { email: formData.email };
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await axios.put(`${API_URL}/api/employees/${editingEmployee._id}`, updateData);
      } else {
        // Create new employee
        if (!formData.password) {
          setError('Password is required for new employees');
          return;
        }
        await axios.post(`${API_URL}/api/employees`, formData);
      }

      setShowModal(false);
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error('Error saving employee:', error);
      setError(error.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      email: '',
      password: '',
      role: 'employee'
    });
    setError('');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="employee-management-container">
      <div className="employee-management-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/admin')} className="back-button">
            ← Back
          </button>
          <h1>Employee Management</h1>
        </div>
        <button onClick={handleAddEmployee} className="add-employee-button">
          <span className="button-icon">+</span>
          Add Employee
        </button>
      </div>

      {error && !showModal && <div className="error-message">{error}</div>}

      <div className="employees-grid">
        {employees.map((employee) => (
          <div key={employee._id} className="employee-card">
            <div className="employee-card-content">
              <div className="employee-info">
                <h3>{employee.email}</h3>
                <p className="employee-role">Role: {employee.role}</p>
              </div>
              <div className="employee-actions">
                <button
                  onClick={() => handleEdit(employee)}
                  className="edit-button"
                  title="Edit Employee"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(employee._id)}
                  className="delete-button"
                  title="Delete Employee"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="no-employees">
          <p>No employees found</p>
        </div>
      )}

      {/* Modal for Add/Edit Employee */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="employee-form">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password {editingEmployee && <span className="optional">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingEmployee}
                  placeholder="Enter password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {editingEmployee ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

