import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data);
      
      // Get unique categories
      const uniqueCategories = [...new Set(response.data.map(product => product.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryProducts = (category) => {
    return products.filter(product => product.category === category);
  };

  const getCategoryCount = (category) => {
    return getCategoryProducts(category).length;
  };

  const handleCategoryClick = (category) => {
    // Navigate to products filtered by category
    navigate(`/category/${encodeURIComponent(category)}`);
  };

  if (loading) {
    return <div className="home-loading">Loading...</div>;
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Our Product Catalog</h1>
          <p className="hero-subtitle">Discover premium industrial products designed for excellence</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Get Started
            </button>
            <button className="btn-secondary" onClick={() => navigate('/login')}>
              View Products
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <h2 className="section-title">Our Product Categories</h2>
          <p className="section-subtitle">Explore our wide range of industrial products</p>
        </div>
        
        <div className="categories-container">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="category-card"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="category-icon">
                {category === 'Couplings' && (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                  </svg>
                )}
                {category === 'Gear pump' && (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                  </svg>
                )}
                {category === 'Torque Limiters' && (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>
                    <path d="M8.93 8.93l2.83 2.83M12.24 12.24l2.83 2.83M15.07 15.07l2.83 2.83"></path>
                  </svg>
                )}
              </div>
              <h3 className="category-name">{category}</h3>
              <p className="category-count">{getCategoryCount(category)} Products</p>
              <div className="category-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose Us</h2>
          <p className="section-subtitle">Quality products and exceptional service</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h3>Premium Quality</h3>
            <p>All our products are manufactured to the highest industry standards</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Quick and reliable shipping to get your products when you need them</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>Expert Support</h3>
            <p>Our team of experts is here to help you find the perfect solution</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💎</div>
            <h3>Best Prices</h3>
            <p>Competitive pricing without compromising on quality</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">{products.length}+</div>
            <div className="stat-label">Products</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{categories.length}</div>
            <div className="stat-label">Categories</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Satisfaction</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of satisfied customers who trust our products</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Sign In Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;

