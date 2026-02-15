import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Page.css';

const Admin = () => {
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeSection, setActiveSection] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [assignFormData, setAssignFormData] = useState({ employeeEmail: '', comment: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    return localStorage.getItem('theme') || 'light';
  });
  const [activeNavButton, setActiveNavButton] = useState('home');
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
    fetchLeads();
  }, [navigate]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const fetchLeads = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/leads');
      const leadsData = response.data;
      const sortedLeads = leadsData.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setLeads(sortedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees');
      console.log('Employees fetched:', response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error response:', error.response?.data);
      setError('Failed to load employees');
      setEmployees([]); // Set empty array on error
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    }
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
    setError('');
    if (section === 'users') {
      fetchUsers();
    } else if (section === 'employees') {
      fetchEmployees();
    } else if (section === 'products') {
      fetchProducts();
    } else if (section === 'leads') {
      fetchLeads();
      fetchEmployees(); // Fetch employees for assign functionality
    }
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const handleAssign = async (lead) => {
    setSelectedLead(lead);
    setAssignFormData({ employeeEmail: '', comment: '' });
    setError('');
    setShowAssignModal(true);
    // Ensure employees are loaded when modal opens
    if (employees.length === 0) {
      await fetchEmployees();
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!assignFormData.employeeEmail) {
      setError('Please select an employee');
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/leads/${selectedLead._id}/assign`, {
        assignedEmployee: assignFormData.employeeEmail,
        comment: assignFormData.comment || ''
      });
      setShowAssignModal(false);
      setSelectedLead(null);
      fetchLeads(); // Refresh leads list
    } catch (error) {
      console.error('Error assigning lead:', error);
      setError(error.response?.data?.message || 'Failed to assign lead');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/leads/${leadId}`);
      fetchLeads(); // Refresh leads list
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead. Please try again.');
    }
  };

  const handleViewQuotation = (leadId) => {
    // Open quotation PDF in a new tab
    const quotationUrl = `http://localhost:5000/api/quotation/${leadId}`;
    window.open(quotationUrl, '_blank');
  };

  const handleAdd = () => {
    setEditingItem(null);
    if (activeSection === 'users') {
      setFormData({ email: '', password: '', role: 'user' });
    } else if (activeSection === 'employees') {
      setFormData({ email: '', password: '', role: 'employee' });
    } else if (activeSection === 'products') {
      setFormData({ productName: '', productDescription: '', price: '', category: 'Couplings' });
    }
    setError('');
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (activeSection === 'users' || activeSection === 'employees') {
      setFormData({ email: item.email, password: '', role: item.role });
    } else if (activeSection === 'products') {
      setFormData({
        productName: item.productName,
        productDescription: item.productDescription,
        price: item.price.toString(),
        category: item.category
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      if (activeSection === 'users') {
        await axios.delete(`http://localhost:5000/api/users/${itemId}`);
        fetchUsers();
      } else if (activeSection === 'employees') {
        await axios.delete(`http://localhost:5000/api/employees/${itemId}`);
        fetchEmployees();
      } else if (activeSection === 'products') {
        await axios.delete(`http://localhost:5000/api/products/${itemId}`);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (activeSection === 'users') {
        if (editingItem) {
          const updateData = { email: formData.email };
          if (formData.password) {
            updateData.password = formData.password;
          }
          await axios.put(`http://localhost:5000/api/users/${editingItem._id}`, updateData);
        } else {
          await axios.post('http://localhost:5000/api/users', formData);
        }
        fetchUsers();
      } else if (activeSection === 'employees') {
        if (editingItem) {
          const updateData = { email: formData.email };
          if (formData.password) {
            updateData.password = formData.password;
          }
          await axios.put(`http://localhost:5000/api/employees/${editingItem._id}`, updateData);
        } else {
          await axios.post('http://localhost:5000/api/employees', formData);
        }
        fetchEmployees();
      } else if (activeSection === 'products') {
        if (editingItem) {
          await axios.put(`http://localhost:5000/api/products/${editingItem._id}`, formData);
        } else {
          await axios.post('http://localhost:5000/api/products', formData);
        }
        fetchProducts();
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving item:', error);
      setError(error.response?.data?.message || 'Failed to save item');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${month} ${day}, ${year}, ${hours}:${minutesStr} ${ampm}`;
  };

  const maskEmail = (email) => {
    if (!email) return 'N/A';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const username = parts[0];
    const domain = parts[1];
    if (username.length <= 3) {
      return `***@${domain}`;
    }
    return `***${username.slice(-3)}@${domain}`;
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    if (phone.startsWith('+91')) {
      return phone;
    }
    if (phone.startsWith('91')) {
      return `+${phone}`;
    }
    if (phone.length === 10) {
      return `+91-${phone}`;
    }
    return phone;
  };

  const renderContent = () => {
    if (activeSection === 'users') {
      return (
        <>
          <div className="leads-section-header">
            <h2 className="leads-section-title">User Management</h2>
            <button className="admin-action-btn" onClick={handleAdd}>Add User</button>
          </div>
          <div className="leads-list">
            {users.length === 0 ? (
              <div className="no-leads-message">No users found</div>
            ) : (
              users.map((userItem) => (
                <div key={userItem._id} className="lead-entry">
                  <div className="lead-left">
                    <div className="lead-product">{userItem.email}</div>
                    <div className="lead-name">Role: {userItem.role}</div>
                  </div>
                  <div className="lead-right">
                    <button 
                      className="admin-action-btn" 
                      onClick={() => handleEdit(userItem)}
                      style={{ marginRight: '8px' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="admin-action-btn logout-btn" 
                      onClick={() => handleDelete(userItem._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      );
    } else if (activeSection === 'employees') {
      return (
        <>
          <div className="leads-section-header">
            <h2 className="leads-section-title">Employee Management</h2>
            <button className="admin-action-btn" onClick={handleAdd}>Add Employee</button>
          </div>
          <div className="leads-list">
            {employees.length === 0 ? (
              <div className="no-leads-message">No employees found</div>
            ) : (
              employees.map((employee) => (
                <div key={employee._id} className="lead-entry">
                  <div className="lead-left">
                    <div className="lead-product">{employee.email}</div>
                    <div className="lead-name">Role: {employee.role}</div>
                  </div>
                  <div className="lead-right">
                    <button 
                      className="admin-action-btn" 
                      onClick={() => handleEdit(employee)}
                      style={{ marginRight: '8px' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="admin-action-btn logout-btn" 
                      onClick={() => handleDelete(employee._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      );
    } else if (activeSection === 'products') {
      return (
        <>
          <div className="leads-section-header">
            <h2 className="leads-section-title">Product Management</h2>
            <button className="admin-action-btn" onClick={handleAdd}>Add Product</button>
          </div>
          <div className="leads-list">
            {products.length === 0 ? (
              <div className="no-leads-message">No products found</div>
            ) : (
              products.map((product) => (
                <div key={product._id} className="lead-entry">
                  <div className="lead-left">
                    <div className="lead-product">{product.productName}</div>
                    <div className="lead-name">{product.category} - ₹{product.price}</div>
                    <div className="lead-date">{product.productDescription}</div>
                  </div>
                  <div className="lead-right">
                    <button 
                      className="admin-action-btn" 
                      onClick={() => handleEdit(product)}
                      style={{ marginRight: '8px' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="admin-action-btn logout-btn" 
                      onClick={() => handleDelete(product._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      );
    } else if (activeSection === 'leads') {
      return (
        <>
          <div className="leads-section-header">
            <h2 className="leads-section-title">Lead Management</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>
                Total: {leads.length} | 
                Pending: {leads.filter(l => !l.assignedEmployee || l.assignedEmployee === '' || l.status === 'pending').length} | 
                Assigned: {leads.filter(l => l.assignedEmployee && l.assignedEmployee !== '' && l.status === 'assigned').length} | 
                Completed: {leads.filter(l => l.status === 'completed').length}
              </span>
            </div>
          </div>
          <div className="leads-list">
            {leads.length === 0 ? (
              <div className="no-leads-message">No leads found</div>
            ) : (
              leads.map((lead) => (
                <div key={lead._id} className="lead-entry">
                  <div className="lead-left">
                    <div className="lead-date">
                      {formatDate(lead.createdAt)} • Status: <span style={{ 
                        color: lead.status === 'completed' ? '#28a745' : 
                               lead.status === 'assigned' ? '#007bff' : 
                               lead.status === 'in-progress' ? '#ffc107' : '#6c757d',
                        fontWeight: '600'
                      }}>{lead.status || 'pending'}</span>
                    </div>
                    <div className="lead-product">{lead.productName}</div>
                    <div className="lead-name">
                      <strong>Email:</strong> {lead.requesterEmail}
                    </div>
                    <div className="lead-name" style={{ marginTop: '4px' }}>
                      <strong>Phone:</strong> {lead.requesterNumber ? formatPhone(lead.requesterNumber) : 'Not provided'}
                    </div>
                    <div className="lead-name" style={{ marginTop: '4px' }}>
                      <strong>Quantity:</strong> {lead.quantityRequested || 0}
                    </div>
                    {lead.assignedEmployee && lead.assignedEmployee !== '' && (
                      <div className="lead-name" style={{ marginTop: '4px', color: '#007bff' }}>
                        <strong>Assigned To:</strong> {lead.assignedEmployee}
                      </div>
                    )}
                  </div>
                  <div className="lead-right">
                    <div className="lead-contact-info" style={{ flexDirection: 'column', gap: '8px', alignItems: 'flex-end', height: '100%', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all', textAlign: 'right', maxWidth: '300px' }}>
                          ID: {lead._id}
                        </div>
                        {lead.quotation && (
                          <div 
                            onClick={() => handleViewQuotation(lead._id)}
                            style={{ 
                              fontSize: '12px', 
                              color: '#28a745', 
                              fontWeight: '600',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#1e7e34'}
                            onMouseLeave={(e) => e.target.style.color = '#28a745'}
                            title="Click to view quotation PDF"
                          >
                            ✓ Quotation Generated
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginTop: 'auto', alignItems: 'center' }}>
                        {/* Assign Button - Only clickable for pending leads */}
                        <button 
                          className="circular-action-btn assign-btn" 
                          onClick={() => handleAssign(lead)}
                          disabled={lead.status !== 'pending' && lead.status !== undefined}
                          title={lead.status === 'pending' || !lead.status ? "Assign Lead" : "Lead already assigned"}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                          </svg>
                        </button>
                        {/* More Details Button */}
                        <button 
                          className="circular-action-btn details-btn" 
                          onClick={() => handleViewDetails(lead)}
                          title="More Details"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        {/* Delete Button */}
                        <button 
                          className="circular-action-btn delete-btn" 
                          onClick={() => handleDeleteLead(lead._id)}
                          title="Delete Lead"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      );
    }
  };

  if (!user || loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className={`admin-dashboard-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Top Navigation Bar */}
      <div className="top-nav-bar">
        <div className="nav-left">
          <button className="nav-icon-button" onClick={toggleTheme} title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
            {theme === 'light' ? (
              // Sun icon for light mode
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </div>
        <div className="nav-right">
          <button 
            className="admin-action-btn logout-btn" 
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        {/* Admin Action Buttons (replacing stats cards) */}
        <div className="stats-cards-container">
          <button 
            className={`stat-card ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => handleSectionClick('users')}
            title="User Management"
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value">User Management</div>
          </button>
          <button 
            className={`stat-card ${activeSection === 'employees' ? 'active' : ''}`}
            onClick={() => handleSectionClick('employees')}
            title="Employee Management"
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value">Employee Management</div>
          </button>
          <button 
            className={`stat-card ${activeSection === 'products' ? 'active' : ''}`}
            onClick={() => handleSectionClick('products')}
            title="Product Management"
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value">Product Management</div>
          </button>
          <button 
            className={`stat-card ${activeSection === 'leads' ? 'active' : ''}`}
            onClick={() => handleSectionClick('leads')}
            title="Lead Management"
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value">Lead Management</div>
          </button>
        </div>

        {/* Dynamic Content Section */}
        <div className="leads-section">
          {renderContent()}
        </div>
      </div>

      {/* Background Blur Layer */}
      <div className="bottom-nav-blur-layer"></div>

      {/* Bottom Navigation Bar */}
      <div className="bottom-nav-container">
        <div className="bottom-nav-bar">
          <div className="bottom-nav-buttons">
            <button 
              className={`bottom-nav-icon ${activeNavButton === 'home' ? 'active' : ''}`} 
              onClick={() => {
                setActiveNavButton('home');
                handleSectionClick('leads');
              }} 
              title="Home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span className="bottom-nav-label">Home</span>
            </button>
            <button 
              className={`bottom-nav-icon ${activeNavButton === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveNavButton('ai')}
              title="AI"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <span className="bottom-nav-label">AI Assistant</span>
            </button>
            <button 
              className={`bottom-nav-icon ${activeNavButton === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveNavButton('documents')}
              title="Documents"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span className="bottom-nav-label">Reports</span>
            </button>
            <button 
              className={`bottom-nav-icon ${activeNavButton === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveNavButton('settings')}
              title="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
              </svg>
              <span className="bottom-nav-label">Settings</span>
            </button>
            <button 
              className={`bottom-nav-icon ${activeNavButton === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveNavButton('profile')}
              title="Profile"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="bottom-nav-label">Profile</span>
            </button>
          </div>
          <div className="bottom-nav-status">
            <p>Your LeadsCruise AI is working 24x7!</p>
          </div>
        </div>
      </div>

      {/* Chat Button */}
      <button className="chat-button" title="Chat">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Edit' : 'Add'} {activeSection === 'users' ? 'User' : activeSection === 'employees' ? 'Employee' : 'Product'}</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              {(activeSection === 'users' || activeSection === 'employees') ? (
                <>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password:</label>
                    <input
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingItem}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role:</label>
                    <input
                      type="text"
                      value={formData.role || ''}
                      disabled
                      style={{ background: '#f5f5f5' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Product Name:</label>
                    <input
                      type="text"
                      value={formData.productName || ''}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      value={formData.productDescription || ''}
                      onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Price:</label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category:</label>
                    <select
                      value={formData.category || 'Couplings'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="Couplings">Couplings</option>
                      <option value="Gear pump">Gear pump</option>
                      <option value="Torque Limiters">Torque Limiters</option>
                    </select>
                  </div>
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="admin-action-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-action-btn logout-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {showDetailsModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Lead Details</h3>
              <button 
                onClick={() => setShowDetailsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Lead ID:</strong>
                  <span style={{ color: '#333' }}>{selectedLead._id}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Product Name:</strong>
                  <span style={{ color: '#333' }}>{selectedLead.productName}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Quantity Requested:</strong>
                  <span style={{ color: '#333' }}>{selectedLead.quantityRequested || 0}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Requester Email:</strong>
                  <span style={{ color: '#333' }}>{selectedLead.requesterEmail}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Contact Number:</strong>
                  <span style={{ color: '#333' }}>{selectedLead.requesterNumber ? formatPhone(selectedLead.requesterNumber) : 'Not provided'}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Status:</strong>
                  <span style={{ 
                    color: selectedLead.status === 'completed' ? '#28a745' : 
                           selectedLead.status === 'assigned' ? '#007bff' : 
                           selectedLead.status === 'in-progress' ? '#ffc107' : '#6c757d',
                    fontWeight: '600'
                  }}>{selectedLead.status || 'pending'}</span>
                </div>
                {selectedLead.assignedEmployee && selectedLead.assignedEmployee !== '' && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Assigned To:</strong>
                    <span style={{ color: '#007bff' }}>{selectedLead.assignedEmployee}</span>
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Created At:</strong>
                  <span style={{ color: '#333' }}>{formatDate(selectedLead.createdAt)}</span>
                </div>
                {selectedLead.updatedAt && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Last Updated:</strong>
                    <span style={{ color: '#333' }}>{formatDate(selectedLead.updatedAt)}</span>
                  </div>
                )}
                {selectedLead.quotation && (
                  <div style={{ marginBottom: '12px', padding: '8px', background: '#d4edda', borderRadius: '4px' }}>
                    <strong style={{ color: '#28a745', display: 'block', marginBottom: '4px' }}>✓ Quotation Generated</strong>
                    <span style={{ color: '#155724', fontSize: '12px' }}>Quotation has been created for this lead</span>
                  </div>
                )}
                {selectedLead.comments && selectedLead.comments.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '12px' }}>Comments:</strong>
                    {selectedLead.comments.map((comment, index) => (
                      <div key={index} style={{ marginBottom: '12px', padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>
                            {comment.authorType === 'admin' ? 'Admin' : 'Employee'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <div style={{ color: '#333', fontSize: '14px' }}>{comment.comment}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="admin-action-btn" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Lead Modal */}
      {showAssignModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Lead</h3>
            {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label>Lead Details:</label>
                <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '14px' }}>
                  <div><strong>Product:</strong> {selectedLead.productName}</div>
                  <div><strong>Quantity:</strong> {selectedLead.quantityRequested}</div>
                  <div><strong>Requester:</strong> {selectedLead.requesterEmail}</div>
                </div>
              </div>
              <div className="form-group">
                <label>Select Employee:</label>
                <select
                  value={assignFormData.employeeEmail}
                  onChange={(e) => setAssignFormData({ ...assignFormData, employeeEmail: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.length === 0 ? (
                    <option value="" disabled>Loading employees...</option>
                  ) : (
                    employees.map((employee) => (
                      <option key={employee._id} value={employee.email}>
                        {employee.email}
                      </option>
                    ))
                  )}
                </select>
                {employees.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    No employees found. Please add employees first.
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Additional Comment (Optional):</label>
                <textarea
                  value={assignFormData.comment}
                  onChange={(e) => setAssignFormData({ ...assignFormData, comment: e.target.value })}
                  placeholder="Add any additional comments..."
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="admin-action-btn" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="submit" className="admin-action-btn logout-btn">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
