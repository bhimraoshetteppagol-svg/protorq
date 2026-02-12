import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LeadManagement.css';

const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
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

    fetchLeads();
    fetchEmployees();
  }, [navigate]);

  useEffect(() => {
    console.log('Employees state updated:', employees);
  }, [employees]);

  const fetchLeads = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/leads');
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees');
      console.log('Employees fetched:', response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleAssign = (lead) => {
    setSelectedLead(lead);
    setShowAssignModal(true);
  };

  const handleAssignEmployee = async (employeeEmail) => {
    try {
      if (!selectedLead) {
        console.error('No lead selected');
        alert('No lead selected. Please try again.');
        return;
      }

      console.log('Assigning employee:', employeeEmail, 'to lead:', selectedLead._id);
      console.log('Current lead data:', selectedLead);
      
      // Safely get requesterNumber with fallback
      const requesterNumber = (selectedLead && selectedLead.requesterNumber) 
        ? String(selectedLead.requesterNumber).trim() 
        : '';
      
      // Preserve all existing lead data when updating
      // Set status to "assigned" when assigning an employee
      const updateData = {
        assignedEmployee: employeeEmail,
        productName: selectedLead.productName || '',
        quantityRequested: selectedLead.quantityRequested || 1,
        requesterEmail: selectedLead.requesterEmail || '',
        requesterNumber: requesterNumber,
        status: 'assigned' // Change status to "assigned" when employee is assigned
      };
      
      console.log('Update data being sent:', updateData);
      console.log('RequesterNumber value:', updateData.requesterNumber);
      console.log('RequesterNumber type:', typeof updateData.requesterNumber);
      
      const response = await axios.put(`http://localhost:5000/api/leads/${selectedLead._id}`, updateData);
      console.log('Assignment successful:', response.data);
      setShowAssignModal(false);
      setSelectedLead(null);
      fetchLeads(); // Refresh the list
      alert(`Lead successfully assigned to ${employeeEmail}`);
    } catch (error) {
      console.error('Error assigning employee:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error stack:', error.stack);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to assign employee. Please try again.';
      alert(errorMessage);
    }
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const handleCloseModals = () => {
    setShowAssignModal(false);
    setShowDetailsModal(false);
    setSelectedLead(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading leads...</div>;
  }

  return (
    <div className="lead-management-container">
      <div className="lead-management-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/admin')} className="back-button">
            ← Back
          </button>
          <h1>Lead Management</h1>
        </div>
        <div className="header-stats">
          <span className="stat-badge">Total: {leads.length}</span>
          <span className="stat-badge pending">
            Pending: {leads.filter(l => !l.assignedEmployee || l.assignedEmployee === '').length}
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="leads-grid">
        {leads.map((lead) => (
          <div key={lead._id} className="lead-card">
            <div className="lead-card-header">
              <div className="lead-status-badge">
                {lead.status || 'pending'}
              </div>
            </div>
            
            <div className="lead-card-body">
              <h3 className="lead-product-name">{lead.productName}</h3>
              
              <div className="lead-info-row">
                <span className="info-label">Quantity:</span>
                <span className="info-value">{lead.quantityRequested}</span>
              </div>
              
              <div className="lead-info-row">
                <span className="info-label">Requester:</span>
                <span className="info-value">{lead.requesterEmail}</span>
              </div>
              
              <div className="lead-info-row">
                <span className="info-label">Contact Number:</span>
                <span className="info-value">{(lead && lead.requesterNumber) ? lead.requesterNumber : 'Not provided'}</span>
              </div>
              
              <div className="lead-info-row">
                <span className="info-label">Assigned To:</span>
                <span className={`info-value ${!lead.assignedEmployee || lead.assignedEmployee === '' ? 'unassigned' : ''}`}>
                  {lead.assignedEmployee || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="lead-card-footer">
              {!lead.assignedEmployee || lead.assignedEmployee === '' ? (
                <button
                  onClick={() => handleAssign(lead)}
                  className="assign-button"
                >
                  Assign
                </button>
              ) : (
                <button
                  onClick={() => handleViewDetails(lead)}
                  className="details-button"
                >
                  More Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {leads.length === 0 && (
        <div className="no-leads">
          <p>No leads found</p>
        </div>
      )}

      {/* Assign Employee Modal */}
      {showAssignModal && selectedLead && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Employee</h2>
              <button className="close-button" onClick={handleCloseModals} type="button">×</button>
            </div>
            <div className="modal-body">
              <p className="lead-info-text">
                <strong>Product:</strong> {selectedLead?.productName || 'N/A'}<br />
                <strong>Quantity:</strong> {selectedLead?.quantityRequested || 'N/A'}<br />
                <strong>Requester:</strong> {selectedLead?.requesterEmail || 'N/A'}<br />
                <strong>Contact Number:</strong> {(selectedLead && selectedLead.requesterNumber) ? selectedLead.requesterNumber : 'Not provided'}
              </p>
              
              <div className="employees-list">
                <h3>Select an Employee:</h3>
                {employees.length > 0 ? (
                  <div className="employee-options">
                    {employees.map((employee) => (
                      <button
                        key={employee._id || employee.email}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Employee button clicked:', employee.email);
                          handleAssignEmployee(employee.email);
                        }}
                        className="employee-option-button"
                        type="button"
                      >
                        {employee.email}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p className="no-employees-text">No employees available</p>
                    <p className="no-employees-text" style={{ fontSize: '12px', marginTop: '10px' }}>
                      Make sure you have employees in the system. Go to Employee Management to add employees.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {showDetailsModal && selectedLead && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lead Details</h2>
              <button className="close-button" onClick={handleCloseModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <div className="detail-item">
                  <span className="detail-label">Product Name:</span>
                  <span className="detail-value">{selectedLead.productName}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Quantity Requested:</span>
                  <span className="detail-value">{selectedLead.quantityRequested}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Requester Email:</span>
                  <span className="detail-value">{selectedLead.requesterEmail}</span>
                </div>
                
                    <div className="detail-item">
                      <span className="detail-label">Requester Number:</span>
                      <span className="detail-value">{(selectedLead && selectedLead.requesterNumber) ? selectedLead.requesterNumber : 'Not provided'}</span>
                    </div>
                
                <div className="detail-item">
                  <span className="detail-label">Assigned Employee:</span>
                  <span className="detail-value">{selectedLead.assignedEmployee || 'Not assigned'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-${selectedLead.status || 'pending'}`}>
                    {selectedLead.status || 'pending'}
                  </span>
                </div>
                
                {selectedLead.createdAt && (
                  <div className="detail-item">
                    <span className="detail-label">Created At:</span>
                    <span className="detail-value">{formatDate(selectedLead.createdAt)}</span>
                  </div>
                )}
                
                {selectedLead.updatedAt && (
                  <div className="detail-item">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">{formatDate(selectedLead.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseModals} className="close-details-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;

