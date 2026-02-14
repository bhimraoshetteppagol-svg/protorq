import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LeadManagement.css';

const EmployeeLeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [error, setError] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
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
    // Check if user is employee
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

    setEmployeeEmail(parsedUser.email);
    // Initialize verify data with employee email
    setVerifyData(prev => ({
      ...prev,
      primaryEmail: parsedUser.email
    }));
    fetchLeads(parsedUser.email);
  }, [navigate]);

  const fetchLeads = async (email) => {
    try {
      const response = await axios.get('http://localhost:5000/api/leads');
      // Filter leads assigned to this employee
      const assignedLeads = response.data.filter(
        lead => lead.assignedEmployee && lead.assignedEmployee.toLowerCase() === email.toLowerCase()
      );
      setLeads(assignedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
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
        primaryEmail: quotation.verify?.primaryEmail || employeeEmail,
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
        const response = await axios.get(`http://localhost:5000/api/quotation/${lead._id}`, {
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

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedLead(null);
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
      primaryEmail: employeeEmail,
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

      const response = await axios.post('http://localhost:5000/api/quotation/generate', quotationData, {
        responseType: 'blob'
      });

      // Create blob URL for preview
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfGenerated(true);
      
      // Refresh leads to show updated status (completed)
      fetchLeads(employeeEmail);
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      let errorMessage = 'Failed to generate PDF. Please try again.';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 5000.';
      } else if (error.response?.data) {
        // Try to read error message from blob response
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
      primaryEmail: employeeEmail,
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
      await axios.post('http://localhost:5000/api/quotation/send', {
        leadId: selectedLead._id,
        requesterEmail: selectedLead.requesterEmail
      });
      alert('Quotation sent successfully!');
      handleCloseQuotationModal();
      // Refresh leads to show updated status
      fetchLeads(employeeEmail);
    } catch (error) {
      console.error('Error sending quotation:', error);
      alert('Failed to send quotation. Please try again.');
    }
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
          <button onClick={() => navigate('/employee')} className="back-button">
            ← Back
          </button>
          <h1>My Assigned Leads</h1>
        </div>
        <div className="header-stats">
          <span className="stat-badge">Total: {leads.length}</span>
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
                <span className="info-value">{lead.assignedEmployee || 'Unassigned'}</span>
              </div>
            </div>

            <div className="lead-card-footer">
              <button
                onClick={() => handleViewDetails(lead)}
                className="details-button"
              >
                More Details
              </button>
              <button
                onClick={() => handleGenerateQuotation(lead)}
                className="quotation-button"
              >
                Generate Quotation
              </button>
            </div>
          </div>
        ))}
      </div>

      {leads.length === 0 && (
        <div className="no-leads">
          <p>No leads assigned to you yet</p>
        </div>
      )}

      {/* Lead Details Modal */}
      {showDetailsModal && selectedLead && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lead Details</h2>
              <button className="close-button" onClick={handleCloseModal}>×</button>
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
              <button onClick={handleCloseModal} className="close-details-button">
                Close
              </button>
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
                Create your customized quotation for <span className="editable-text">requirement</span>
                <span className="edit-icon">✏️</span>
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
                            <span>{verifyData.primaryEmail || employeeEmail}</span>
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

export default EmployeeLeadManagement;

