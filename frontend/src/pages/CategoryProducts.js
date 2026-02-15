import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { setQuotationFormData, getQuotationFormData } from '../utils/cookies';
import './CategoryProducts.css';

const CategoryProducts = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState({});
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      // Filter products by category
      const categoryProducts = response.data.filter(
        product => product.category === decodeURIComponent(category)
      );
      setProducts(categoryProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const qty = parseInt(quantity) || 1;
    if (qty < 1) return;
    setQuantities({
      ...quantities,
      [productId]: qty
    });
  };

  const handleGetQuotation = (product) => {
    setSelectedProduct(product);
    // Load saved form data from cookies
    const savedData = getQuotationFormData();
    setFormData({
      email: savedData.email || '',
      phoneNumber: savedData.phoneNumber || ''
    });
    setError('');
    setShowQuotationModal(true);
  };

  const handleCloseModal = () => {
    setShowQuotationModal(false);
    setSelectedProduct(null);
    setFormData({
      email: '',
      phoneNumber: ''
    });
    setError('');
  };

  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!formData.email || !formData.phoneNumber) {
      setError('Please fill in all fields');
      setSubmitting(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setSubmitting(false);
      return;
    }

    try {
      const quantity = quantities[selectedProduct._id] || 1;
      
      // Create lead entry
      const leadData = {
        productName: selectedProduct.productName,
        quantityRequested: quantity,
        requesterEmail: formData.email.trim().toLowerCase(),
        requesterNumber: formData.phoneNumber.trim(),
        assignedEmployee: ''
      };

      await axios.post(`${API_URL}/api/leads`, leadData);
      
      // Save form data to cookies for future use
      setQuotationFormData(formData.email.trim().toLowerCase(), formData.phoneNumber.trim());
      
      // Success - close modal and show success message
      handleCloseModal();
      alert(`Quotation request for ${quantity} x ${selectedProduct.productName} has been submitted successfully!`);
      
      // Reset quantity for this product
      setQuantities({
        ...quantities,
        [selectedProduct._id]: 1
      });
    } catch (error) {
      console.error('Error submitting quotation:', error);
      setError(error.response?.data?.message || 'Failed to submit quotation request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="category-loading">Loading products...</div>;
  }

  if (error) {
    return <div className="category-error">{error}</div>;
  }

  const decodedCategory = decodeURIComponent(category);

  return (
    <div className="category-products-container">
      {/* Header Section */}
      <div className="category-header">
        <button onClick={() => navigate('/home')} className="back-button">
          ← Back to Home
        </button>
        <div className="header-content">
          <h1 className="category-title">{decodedCategory}</h1>
          <p className="category-subtitle">{products.length} Products Available</p>
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="products-section">
          <div className="products-grid">
            {products.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-card-header">
                  <div className="product-category-badge">{product.category}</div>
                </div>
                
                <div className="product-card-body">
                  <h3 className="product-name">{product.productName}</h3>
                  <p className="product-description">{product.productDescription}</p>
                  
                  <div className="product-price-section">
                    <span className="price-label">Price:</span>
                    <span className="product-price">${product.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="product-card-footer">
                  <div className="quantity-section">
                    <label htmlFor={`quantity-${product._id}`} className="quantity-label">Quantity:</label>
                    <input
                      type="number"
                      id={`quantity-${product._id}`}
                      min="1"
                      value={quantities[product._id] || 1}
                      onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                      className="quantity-input"
                    />
                  </div>
                  <button
                    onClick={() => handleGetQuotation(product)}
                    className="quotation-button"
                  >
                    Get Quotation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-products">
          <p>No products found in this category.</p>
          <button onClick={() => navigate('/home')} className="btn-primary">
            Back to Home
          </button>
        </div>
      )}

      {/* Quotation Request Modal */}
      {showQuotationModal && selectedProduct && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content quotation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Quotation</h2>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmitQuotation} className="quotation-form">
              <div className="product-info-summary">
                <p><strong>Product:</strong> {selectedProduct.productName}</p>
                <p><strong>Quantity:</strong> {quantities[selectedProduct._id] || 1}</p>
                <p><strong>Price per unit:</strong> ${selectedProduct.price.toFixed(2)}</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label htmlFor="quotation-email">Email Address *</label>
                <input
                  type="email"
                  id="quotation-email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="quotation-phone">Phone Number *</label>
                <input
                  type="tel"
                  id="quotation-phone"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryProducts;

