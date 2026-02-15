import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import './Page.css';
import './LeadManagement.css';

const Employee = () => {
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [activeSection, setActiveSection] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [activeNavButton, setActiveNavButton] = useState('home');
  const [currentStep, setCurrentStep] = useState(1);
  const [currency, setCurrency] = useState('₹');
  const [products, setProducts] = useState([]);
  const [termsData, setTermsData] = useState({
    discount: '5',
    applicableTaxes: '',
    taxesIncluded: false,
    shippingCharges: '100',
    shippingIncluded: false,
    deliveryPeriod: '1',
    deliveryUnit: 'Days',
    paymentTerms: '',
    additionalInformation: '',
    documents: []
  });
  const [verifyData, setVerifyData] = useState({
    primaryEmail: '',
    alternateEmail: '',
    primaryPhone: '',
    alternatePhone: '',
    pnsPhone: '',
    primaryPhoneSelected: false,
    alternatePhoneSelected: false,
    pnsPhoneSelected: true,
    addressType: 'Primary',
    addressLine1: '',
    addressLine2: '',
    addressPhone: ''
  });
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [quotationExists, setQuotationExists] = useState(false);
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
    fetchLeads(parsedUser.email);
  }, [navigate]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const fetchLeads = async (email) => {
    try {
      const response = await axios.get(`${API_URL}/api/leads`);
      // Filter leads assigned to this employee
      const assignedLeads = response.data.filter(
        lead => lead.assignedEmployee && lead.assignedEmployee.toLowerCase() === email.toLowerCase()
      );
      const sortedLeads = assignedLeads.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setLeads(sortedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
    setError('');
    if (section === 'leads') {
      if (user) {
        fetchLeads(user.email);
      }
    }
  };


  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const handleViewQuotation = (leadId) => {
    const quotationUrl = `${API_URL}/api/quotation/${leadId}`;
    window.open(quotationUrl, '_blank');
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

  const handleGenerateQuotation = async (lead) => {
    setSelectedLead(lead);
    
    // Check if quotation already exists
    if (lead.quotation && lead.quotation.products && lead.quotation.products.length > 0) {
      // Quotation exists - load it and go directly to step 4
      setQuotationExists(true);
      
      // Load quotation data
      const quotation = lead.quotation;
      setProducts(quotation.products.map((p, index) => ({
        id: Date.now() + index,
        productName: p.productName || '',
        description: p.description || '',
        quantity: p.quantity || 1,
        price: p.price || '',
        unit: p.unit || 'Unit',
        image: null,
        selected: p.selected !== false
      })));
      setTermsData({
        discount: quotation.terms?.discount || '5',
        applicableTaxes: quotation.terms?.applicableTaxes || '',
        taxesIncluded: quotation.terms?.taxesIncluded || false,
        shippingCharges: quotation.terms?.shippingCharges || '100',
        shippingIncluded: quotation.terms?.shippingIncluded || false,
        deliveryPeriod: quotation.terms?.deliveryPeriod || '1',
        deliveryUnit: quotation.terms?.deliveryUnit || 'Days',
        paymentTerms: quotation.terms?.paymentTerms || '',
        additionalInformation: quotation.terms?.additionalInformation || '',
        documents: []
      });
      setVerifyData({
        primaryEmail: quotation.verify?.primaryEmail || user?.email || '',
        alternateEmail: quotation.verify?.alternateEmail || '',
        primaryPhone: quotation.verify?.primaryPhone || '',
        alternatePhone: quotation.verify?.alternatePhone || '',
        pnsPhone: quotation.verify?.pnsPhone || '',
        primaryPhoneSelected: quotation.verify?.primaryPhoneSelected || false,
        alternatePhoneSelected: quotation.verify?.alternatePhoneSelected || false,
        pnsPhoneSelected: quotation.verify?.pnsPhoneSelected || false,
        addressType: quotation.verify?.addressType || 'Primary',
        addressLine1: quotation.verify?.addressLine1 || '',
        addressLine2: quotation.verify?.addressLine2 || '',
        addressPhone: quotation.verify?.addressPhone || ''
      });
      setCurrency(quotation.currency || '₹');
      
      // Go directly to step 4 and load PDF from MongoDB
      setCurrentStep(4);
      
      // Load existing PDF from MongoDB
      try {
        const response = await axios.get(`${API_URL}/api/quotation/${lead._id}`, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
        setPdfGenerated(true);
      } catch (error) {
        console.error('Error loading PDF from MongoDB:', error);
        // If PDF not found (404), regenerate it
        if (error.response?.status === 404) {
          console.log('PDF not found in MongoDB, regenerating...');
          setPdfGenerated(false);
          setTimeout(() => {
            handleGeneratePdf();
          }, 500);
        } else {
          // Other errors - show error message
          alert('Error loading PDF. Please try generating it again.');
          setPdfGenerated(false);
        }
      }
    } else {
      // No quotation exists - start fresh
      setQuotationExists(false);
      
      // Initialize products array with the lead's product
      setProducts([{
        id: Date.now(),
        productName: lead.productName || '',
        description: '',
        quantity: lead.quantityRequested || 1,
        price: '',
        unit: 'Unit',
        image: null,
        selected: true
      }]);
      setCurrentStep(1);
      setCurrency('₹');
      setPdfGenerated(false);
      setPdfUrl('');
    }
    
    setShowQuotationModal(true);
  };

  const handleCloseQuotationModal = () => {
    setShowQuotationModal(false);
    setSelectedLead(null);
    setProducts([]);
    setCurrentStep(1);
    setQuotationExists(false);
    setTermsData({
      discount: '5',
      applicableTaxes: '',
      taxesIncluded: false,
      shippingCharges: '100',
      shippingIncluded: false,
      deliveryPeriod: '1',
      deliveryUnit: 'Days',
      paymentTerms: '',
      additionalInformation: '',
      documents: []
    });
    setVerifyData({
      primaryEmail: user?.email || '',
      alternateEmail: '',
      primaryPhone: '',
      alternatePhone: '',
      pnsPhone: '',
      primaryPhoneSelected: false,
      alternatePhoneSelected: false,
      pnsPhoneSelected: true,
      addressType: 'Primary',
      addressLine1: '',
      addressLine2: '',
      addressPhone: ''
    });
    setPdfGenerated(false);
    setPdfUrl('');
    setGeneratingPdf(false);
  };

  const handleAddProduct = () => {
    setProducts([...products, {
      id: Date.now(),
      productName: '',
      description: '',
      quantity: 1,
      price: '',
      unit: 'Unit',
      image: null,
      selected: true
    }]);
  };

  const handleRemoveProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleProductChange = (id, field, value) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleSelectAll = () => {
    const allSelected = products.every(p => p.selected);
    setProducts(products.map(p => ({ ...p, selected: !allSelected })));
  };

  const handleClearAll = () => {
    setProducts([]);
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Auto-generate PDF when reaching step 4
      if (nextStep === 4 && !pdfGenerated) {
        setTimeout(() => {
          handleGeneratePdf();
        }, 500);
      }
    }
  };

  const handleStepClick = (step) => {
    // If quotation exists, only allow step 4, prevent clicking steps 1-3
    if (quotationExists && step < 4) {
      return; // Don't allow navigation to steps 1-3 if quotation exists
    }
    
    setCurrentStep(step);
    // Auto-generate PDF when clicking on step 4
    if (step === 4 && !pdfGenerated) {
      setTimeout(() => {
        handleGeneratePdf();
      }, 500);
    }
  };

  const handleTermsChange = (field, value) => {
    setTermsData({
      ...termsData,
      [field]: value
    });
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setTermsData({
      ...termsData,
      documents: [...termsData.documents, ...files].slice(0, 4)
    });
  };

  const handleVerifyChange = (field, value) => {
    setVerifyData({
      ...verifyData,
      [field]: value
    });
  };

  const handleGeneratePdf = async () => {
    if (!selectedLead) return;
    
    setGeneratingPdf(true);
    try {
      // Collect all quotation data
      const quotationData = {
        leadId: selectedLead._id,
        products: products.filter(p => p.selected),
        terms: termsData,
        verify: verifyData,
        currency: currency,
        requesterEmail: selectedLead.requesterEmail,
        requesterNumber: selectedLead.requesterNumber
      };

      const response = await axios.post(`${API_URL}/api/quotation/generate`, quotationData, {
        responseType: 'blob'
      });

      // Create blob URL for preview
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfGenerated(true);
      
      // Refresh leads to show updated status (completed)
      if (user) {
        fetchLeads(user.email);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      let errorMessage = 'Failed to generate PDF. Please try again.';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 5000.';
      } else if (error.response?.data) {
        if (error.response.data instanceof Blob) {
          error.response.data.text().then(text => {
            try {
              const json = JSON.parse(text);
              errorMessage = json.message || errorMessage;
            } catch (e) {
              errorMessage = text || errorMessage;
            }
            alert(`Failed to generate PDF: ${errorMessage}`);
          });
          return;
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      alert(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleModify = () => {
    // Reset to allow full cycle - clear quotation exists flag
    setQuotationExists(false);
    setCurrentStep(1);
    setPdfGenerated(false);
    setPdfUrl('');
    
    // Reset to initial product state
    if (selectedLead) {
      setProducts([{
        id: Date.now(),
        productName: selectedLead.productName || '',
        description: '',
        quantity: selectedLead.quantityRequested || 1,
        price: '',
        unit: 'Unit',
        image: null,
        selected: true
      }]);
    }
    
    // Reset terms and verify data
    setTermsData({
      discount: '5',
      applicableTaxes: '',
      taxesIncluded: false,
      shippingCharges: '100',
      shippingIncluded: false,
      deliveryPeriod: '1',
      deliveryUnit: 'Days',
      paymentTerms: '',
      additionalInformation: '',
      documents: []
    });
    setVerifyData({
      primaryEmail: user?.email || '',
      alternateEmail: '',
      primaryPhone: '',
      alternatePhone: '',
      pnsPhone: '',
      primaryPhoneSelected: false,
      alternatePhoneSelected: false,
      pnsPhoneSelected: false,
      addressType: 'Primary',
      addressLine1: '',
      addressLine2: '',
      addressPhone: ''
    });
  };

  const handleSendQuotation = async () => {
    if (!selectedLead || !pdfGenerated) return;
    
    try {
      await axios.post(`${API_URL}/api/quotation/send`, {
        leadId: selectedLead._id,
        requesterEmail: selectedLead.requesterEmail
      });
      alert('Quotation sent successfully!');
      handleCloseQuotationModal();
      // Refresh leads to show updated status
      if (user) {
        fetchLeads(user.email);
      }
    } catch (error) {
      console.error('Error sending quotation:', error);
      alert('Failed to send quotation. Please try again.');
    }
  };

  const renderContent = () => {
    if (activeSection === 'leads') {
      return (
        <>
          <div className="leads-section-header">
            <h2 className="leads-section-title">My Assigned Leads</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>
                Total: {leads.length} | 
                Pending: {leads.filter(l => l.status === 'pending' || !l.status).length} | 
                In Progress: {leads.filter(l => l.status === 'in-progress').length} | 
                Completed: {leads.filter(l => l.status === 'completed').length}
              </span>
            </div>
          </div>
          <div className="leads-list">
            {leads.length === 0 ? (
              <div className="no-leads-message">No leads assigned to you yet</div>
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
                        <button 
                          className="circular-action-btn assign-btn" 
                          onClick={() => handleGenerateQuotation(lead)}
                          title="Generate Quotation"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
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
    } else if (activeSection === 'tasks') {
      return (
        <>
          <div className="leads-section-header">
            <h2 className="leads-section-title">My Tasks</h2>
          </div>
          <div className="leads-list">
            <div className="no-leads-message">No tasks assigned yet</div>
          </div>
        </>
      );
    } else if (activeSection === 'profile') {
      return (
        <>
          <div className="leads-section-header">
            <h2 className="leads-section-title">My Profile</h2>
          </div>
          <div className="leads-list">
            <div className="lead-entry">
              <div className="lead-left">
                <div className="lead-product">Employee Information</div>
                <div className="lead-name">
                  <strong>Email:</strong> {user?.email}
                </div>
                <div className="lead-name" style={{ marginTop: '4px' }}>
                  <strong>Role:</strong> {user?.role}
                </div>
              </div>
            </div>
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
        {/* Employee Action Buttons */}
        <div className="stats-cards-container">
          <button 
            className={`stat-card ${activeSection === 'leads' ? 'active' : ''}`}
            onClick={() => handleSectionClick('leads')}
            title="Lead Management"
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value">Lead Management</div>
          </button>
          <button 
            className="stat-card"
            disabled
            title="User Management (Disabled)"
            style={{ cursor: 'not-allowed', opacity: 0.5 }}
          >
            <div className="stat-value">User Management</div>
          </button>
          <button 
            className={`stat-card ${activeSection === 'tasks' ? 'active' : ''}`}
            onClick={() => handleSectionClick('tasks')}
            title="Tasks"
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value">Tasks</div>
          </button>
          <button 
            className={`stat-card ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => handleSectionClick('profile')}
            title="Profile"
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value">Profile</div>
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
              onClick={() => {
                setActiveNavButton('profile');
                handleSectionClick('profile');
              }}
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
                  <span style={{ color: '#333' }}>{selectedLead.productName || 'N/A'}</span>
                </div>
                {selectedLead.quantityRequested && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Quantity Requested:</strong>
                    <span style={{ color: '#333' }}>{selectedLead.quantityRequested}</span>
                  </div>
                )}
                {selectedLead.requesterEmail && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Requester Email:</strong>
                    <span style={{ color: '#333' }}>{selectedLead.requesterEmail}</span>
                  </div>
                )}
                {selectedLead.requesterNumber && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Contact Number:</strong>
                    <span style={{ color: '#333' }}>{formatPhone(selectedLead.requesterNumber)}</span>
                  </div>
                )}
                {selectedLead.status && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Status:</strong>
                    <span style={{ 
                      color: selectedLead.status === 'completed' ? '#28a745' : 
                             selectedLead.status === 'assigned' ? '#007bff' : 
                             selectedLead.status === 'in-progress' ? '#ffc107' : '#6c757d',
                      fontWeight: '600'
                    }}>{selectedLead.status}</span>
                  </div>
                )}
                {selectedLead.createdAt && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Created At:</strong>
                    <span style={{ color: '#333' }}>{formatDate(selectedLead.createdAt)}</span>
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

      {/* Quotation Generation Modal */}
      {showQuotationModal && selectedLead && (
        <div className="modal-overlay quotation-modal-overlay" onClick={handleCloseQuotationModal}>
          <div className="quotation-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="quotation-modal-header">
              <h2 className="quotation-title">
                Create your customized quotation for requirement
              </h2>
              <div className="quotation-header-actions">
                <button className="minimize-button" onClick={handleCloseQuotationModal}>−</button>
                <button className="close-quotation-button" onClick={handleCloseQuotationModal}>×</button>
              </div>
            </div>

            <div className="quotation-modal-body">
              {/* Left Panel - Steps */}
              <div className="quotation-steps-panel">
                <div className="quotation-steps">
                  <div 
                    className={`quotation-step ${currentStep === 1 ? 'active' : ''} ${quotationExists ? 'disabled' : ''}`}
                    onClick={() => !quotationExists && handleStepClick(1)}
                    style={{ 
                      cursor: quotationExists ? 'not-allowed' : 'pointer',
                      opacity: quotationExists ? 0.5 : 1
                    }}
                  >
                    1. Select Product
                  </div>
                  <div 
                    className={`quotation-step ${currentStep === 2 ? 'active' : ''} ${quotationExists ? 'disabled' : ''}`}
                    onClick={() => !quotationExists && handleStepClick(2)}
                    style={{ 
                      cursor: quotationExists ? 'not-allowed' : 'pointer',
                      opacity: quotationExists ? 0.5 : 1
                    }}
                  >
                    2. Terms & Conditions
                  </div>
                  <div 
                    className={`quotation-step ${currentStep === 3 ? 'active' : ''} ${quotationExists ? 'disabled' : ''}`}
                    onClick={() => !quotationExists && handleStepClick(3)}
                    style={{ 
                      cursor: quotationExists ? 'not-allowed' : 'pointer',
                      opacity: quotationExists ? 0.5 : 1
                    }}
                  >
                    3. Verify Details
                  </div>
                  <div 
                    className={`quotation-step ${currentStep === 4 ? 'active' : ''}`}
                    onClick={() => handleStepClick(4)}
                  >
                    4. Generate Pdf
                  </div>
                </div>
              </div>

              {/* Right Panel - Content */}
              <div className="quotation-content-panel">
                {currentStep === 1 && (
                  <div className="quotation-step-content">
                    <div className="quotation-top-section">
                      {products.length === 0 ? (
                        <p className="no-product-text">No product picked from your catalog</p>
                      ) : (
                        <div className="product-actions">
                          <label className="select-all-checkbox">
                            <input
                              type="checkbox"
                              checked={products.every(p => p.selected)}
                              onChange={handleSelectAll}
                            />
                            <span>Select All</span>
                          </label>
                          <button className="clear-all-button" onClick={handleClearAll}>
                            Clear All
                          </button>
                        </div>
                      )}
                      <div className="currency-selector">
                        <span className="currency-label">Choose Your Currency</span>
                        <div className="currency-toggle">
                          <button
                            className={`currency-option ${currency === '₹' ? 'active' : ''}`}
                            onClick={() => setCurrency('₹')}
                          >
                            ₹
                          </button>
                          <button
                            className={`currency-option ${currency === '$' ? 'active' : ''}`}
                            onClick={() => setCurrency('$')}
                          >
                            $
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="products-list">
                      {products.map((product) => (
                        <div key={product.id} className="product-entry-block">
                          <div className="product-entry-header">
                            <input
                              type="checkbox"
                              checked={product.selected}
                              onChange={(e) => handleProductChange(product.id, 'selected', e.target.checked)}
                              className="product-checkbox"
                            />
                            <button
                              className="remove-product-button"
                              onClick={() => handleRemoveProduct(product.id)}
                            >
                              ×
                            </button>
                          </div>
                          <div className="product-entry-body">
                            <div className="product-image-upload">
                              <div className="image-placeholder">
                                <span className="camera-icon">📷</span>
                                <span>Add Image</span>
                              </div>
                            </div>
                            <div className="product-fields">
                              <div className="product-field">
                                <label>Product Name</label>
                                <input
                                  type="text"
                                  placeholder="Search your product..."
                                  value={product.productName}
                                  onChange={(e) => handleProductChange(product.id, 'productName', e.target.value)}
                                />
                              </div>
                              <div className="product-field">
                                <label>Description</label>
                                <textarea
                                  placeholder="Enter Product Details"
                                  value={product.description}
                                  onChange={(e) => handleProductChange(product.id, 'description', e.target.value)}
                                  rows="3"
                                />
                              </div>
                              <div className="product-field-row">
                                <div className="product-field">
                                  <label>Quantity</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={product.quantity}
                                    onChange={(e) => handleProductChange(product.id, 'quantity', parseInt(e.target.value) || 1)}
                                  />
                                </div>
                                <div className="product-field">
                                  <label>Price</label>
                                  <div className="price-input-wrapper">
                                    <span className="currency-symbol">{currency}</span>
                                    <input
                                      type="number"
                                      placeholder=""
                                      value={product.price}
                                      onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}
                                    />
                                    <span className="currency-symbol">{currency}</span>
                                  </div>
                                </div>
                                <div className="product-field">
                                  <label>Unit</label>
                                  <div className="unit-input-wrapper">
                                    <input
                                      type="text"
                                      value={product.unit}
                                      onChange={(e) => handleProductChange(product.id, 'unit', e.target.value)}
                                    />
                                    <span className="unit-suffix">/ Unit</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="quotation-action-buttons">
                      <button className="add-product-button" onClick={handleAddProduct}>
                        Add Product
                      </button>
                      <button className="next-button" onClick={handleNextStep}>
                        Next &gt;
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="quotation-step-content">
                    <div className="terms-conditions-form">
                      {/* Discount */}
                      <div className="form-field-group">
                        <label className="form-label">Discount</label>
                        <div className="input-with-suffix">
                          <input
                            type="number"
                            value={termsData.discount}
                            onChange={(e) => handleTermsChange('discount', e.target.value)}
                            className="form-input"
                          />
                          <div className="suffix-box">%</div>
                        </div>
                      </div>

                      {/* Applicable Taxes */}
                      <div className="form-field-group">
                        <label className="form-label">Applicable Taxes</label>
                        <div className="input-with-checkbox-row">
                          <div className="input-with-suffix">
                            <input
                              type="text"
                              placeholder="eg. 15"
                              value={termsData.applicableTaxes}
                              onChange={(e) => handleTermsChange('applicableTaxes', e.target.value)}
                              className="form-input"
                            />
                            <div className="suffix-box">%</div>
                          </div>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={termsData.taxesIncluded}
                              onChange={(e) => handleTermsChange('taxesIncluded', e.target.checked)}
                            />
                            <span>Included in product price</span>
                          </label>
                        </div>
                      </div>

                      {/* Shipping Charges */}
                      <div className="form-field-group">
                        <label className="form-label">Shipping Charges (Incl. GST)</label>
                        <div className="input-with-checkbox-row">
                          <div className="input-with-suffix">
                            <input
                              type="number"
                              value={termsData.shippingCharges}
                              onChange={(e) => handleTermsChange('shippingCharges', e.target.value)}
                              className="form-input"
                            />
                            <div className="suffix-box">{currency}</div>
                          </div>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={termsData.shippingIncluded}
                              onChange={(e) => handleTermsChange('shippingIncluded', e.target.checked)}
                            />
                            <span>Included in product price</span>
                          </label>
                        </div>
                      </div>

                      {/* Delivery Period */}
                      <div className="form-field-group">
                        <label className="form-label">Delivery Period</label>
                        <div className="delivery-period-row">
                          <select
                            value={termsData.deliveryPeriod}
                            onChange={(e) => handleTermsChange('deliveryPeriod', e.target.value)}
                            className="form-select"
                          >
                            {[...Array(30)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>--- {i + 1} ---</option>
                            ))}
                          </select>
                          <select
                            value={termsData.deliveryUnit}
                            onChange={(e) => handleTermsChange('deliveryUnit', e.target.value)}
                            className="form-select"
                          >
                            <option value="Days">--- Days ---</option>
                            <option value="Weeks">--- Weeks ---</option>
                            <option value="Months">--- Months ---</option>
                          </select>
                        </div>
                      </div>

                      {/* Payment Terms */}
                      <div className="form-field-group">
                        <label className="form-label">Payment Terms</label>
                        <input
                          type="text"
                          placeholder="e.g Advance Payment"
                          value={termsData.paymentTerms}
                          onChange={(e) => handleTermsChange('paymentTerms', e.target.value)}
                          className="form-input full-width"
                        />
                      </div>

                      {/* Additional Information */}
                      <div className="form-field-group">
                        <label className="form-label">Additional Information</label>
                        <textarea
                          placeholder="Share More Details"
                          value={termsData.additionalInformation}
                          onChange={(e) => handleTermsChange('additionalInformation', e.target.value)}
                          className="form-textarea"
                          rows="5"
                        />
                      </div>

                      {/* Attach Documents */}
                      <div className="form-field-group">
                        <div className="document-upload-section">
                          <div className="document-upload-left">
                            <input
                              type="file"
                              id="document-upload"
                              multiple
                              accept=".doc,.docx,.pdf,.xls,.xlsx,.jpg,.jpeg,.png,.ppt,.pptx"
                              onChange={handleDocumentUpload}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor="document-upload" className="attach-documents-button">
                              Attach Documents (Max 4)
                            </label>
                            <span className="file-types-text">(Doc, PDF, Excel, Image, PPT)</span>
                          </div>
                          <button className="next-button-inline" onClick={handleNextStep}>
                            Next →
                          </button>
                        </div>
                        {termsData.documents.length > 0 && (
                          <div className="uploaded-files">
                            {termsData.documents.map((file, index) => (
                              <div key={index} className="uploaded-file-item">
                                <span>{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newDocs = [...termsData.documents];
                                    newDocs.splice(index, 1);
                                    setTermsData({ ...termsData, documents: newDocs });
                                  }}
                                  className="remove-file-button"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="terms-navigation-buttons">
                      <button className="back-step-button" onClick={handleBackStep}>
                        ← Back
                      </button>
                      <button className="next-step-button" onClick={handleNextStep}>
                        Next →
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="quotation-step-content">
                    <div className="verify-details-form">
                      <h3 className="verify-details-title">Your Details</h3>

                      {/* Email Section */}
                      <div className="verify-section">
                        <div className="form-field-group">
                          <label className="form-label">Primary Email</label>
                          <div className="read-only-field">
                            <span>{verifyData.primaryEmail || user?.email || ''}</span>
                          </div>
                        </div>
                        <div className="form-field-group">
                          <label className="form-label">Alternate Email</label>
                          <div className="input-with-edit">
                            <input
                              type="email"
                              placeholder="Enter your secondary e-mail"
                              value={verifyData.alternateEmail}
                              onChange={(e) => handleVerifyChange('alternateEmail', e.target.value)}
                              className="form-input"
                            />
                            <span className="edit-icon-small">✏️</span>
                          </div>
                        </div>
                      </div>

                      {/* Phone No. Section */}
                      <div className="verify-section">
                        <label className="form-label">Phone No.</label>
                        <div className="phone-checkboxes">
                          <label className="phone-checkbox-item">
                            <input
                              type="checkbox"
                              checked={verifyData.primaryPhoneSelected}
                              onChange={(e) => handleVerifyChange('primaryPhoneSelected', e.target.checked)}
                            />
                            <span className="phone-label">Primary</span>
                            <input
                              type="tel"
                              placeholder="Enter phone number"
                              value={verifyData.primaryPhone}
                              onChange={(e) => handleVerifyChange('primaryPhone', e.target.value)}
                              className="phone-input"
                            />
                          </label>
                          <label className="phone-checkbox-item">
                            <input
                              type="checkbox"
                              checked={verifyData.alternatePhoneSelected}
                              onChange={(e) => handleVerifyChange('alternatePhoneSelected', e.target.checked)}
                            />
                            <span className="phone-label">Alternate</span>
                            <input
                              type="tel"
                              placeholder="Enter phone number"
                              value={verifyData.alternatePhone}
                              onChange={(e) => handleVerifyChange('alternatePhone', e.target.value)}
                              className="phone-input"
                            />
                          </label>
                          <label className="phone-checkbox-item">
                            <input
                              type="checkbox"
                              checked={verifyData.pnsPhoneSelected}
                              onChange={(e) => handleVerifyChange('pnsPhoneSelected', e.target.checked)}
                            />
                            <span className="phone-label">PNS</span>
                            <input
                              type="tel"
                              placeholder="Enter phone number"
                              value={verifyData.pnsPhone}
                              onChange={(e) => handleVerifyChange('pnsPhone', e.target.value)}
                              className="phone-input"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="verify-section">
                        <div className="form-field-group">
                          <label className="form-label">Address</label>
                          <select
                            value={verifyData.addressType}
                            onChange={(e) => handleVerifyChange('addressType', e.target.value)}
                            className="form-select"
                          >
                            <option value="Primary">Primary</option>
                            <option value="Alternate">Alternate</option>
                            <option value="Billing">Billing</option>
                          </select>
                        </div>
                        <div className="address-fields">
                          <input
                            type="text"
                            placeholder="Address Line 1"
                            value={verifyData.addressLine1}
                            onChange={(e) => handleVerifyChange('addressLine1', e.target.value)}
                            className="form-input full-width"
                          />
                          <input
                            type="text"
                            placeholder="Address Line 2"
                            value={verifyData.addressLine2}
                            onChange={(e) => handleVerifyChange('addressLine2', e.target.value)}
                            className="form-input full-width"
                          />
                          <input
                            type="tel"
                            placeholder="Enter phone number"
                            value={verifyData.addressPhone}
                            onChange={(e) => handleVerifyChange('addressPhone', e.target.value)}
                            className="form-input full-width"
                          />
                        </div>
                      </div>

                      {/* Note */}
                      <div className="verify-note">
                        <p>Note: Above details will be displayed in the quotation</p>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="verify-navigation-buttons">
                      <button className="back-step-button" onClick={handleBackStep}>
                        ← Back
                      </button>
                      <button className="generate-quotation-button" onClick={handleNextStep}>
                        Generate Quotation →
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="quotation-step-content">
                    {!pdfGenerated ? (
                      <div className="generate-pdf-section">
                        <div className="pdf-icon-large">📄</div>
                        <h2 className="view-quotation-title">View your Quotation</h2>
                        <button 
                          className="generate-pdf-button" 
                          onClick={handleGeneratePdf}
                          disabled={generatingPdf}
                        >
                          {generatingPdf ? 'Generating PDF...' : 'Generate PDF'}
                        </button>
                      </div>
                    ) : (
                      <div className="pdf-preview-section">
                        <div className="pdf-icon-large">📄</div>
                        <h2 className="view-quotation-title">View your Quotation</h2>
                        <iframe 
                          src={pdfUrl} 
                          className="pdf-preview-iframe"
                          title="Quotation PDF"
                        />
                      </div>
                    )}
                    
                    {/* Bottom Action Bar */}
                    <div className="quotation-action-bar">
                      <button className="modify-button" onClick={handleModify}>
                        ← Modify
                      </button>
                      <div className="notification-info">
                        {selectedLead?.requesterEmail?.split('@')[0] || 'Buyer'} will receive email, sms & app notification instantly
                      </div>
                      <button 
                        className="send-quotation-button" 
                        onClick={handleSendQuotation}
                        disabled={!pdfGenerated}
                      >
                        Send Quotation →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;
