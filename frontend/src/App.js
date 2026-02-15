import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import CategoryProducts from './pages/CategoryProducts';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Employee from './pages/Employee';
import User from './pages/User';
import UserManagement from './pages/UserManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import ProductManagement from './pages/ProductManagement';
import LeadManagement from './pages/LeadManagement';
import EmployeeLeadManagement from './pages/EmployeeLeadManagement';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/category/:category" element={<CategoryProducts />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/employees" element={<EmployeeManagement />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/leads" element={<LeadManagement />} />
          <Route path="/employee" element={<Employee />} />
          <Route path="/employee/leads" element={<EmployeeLeadManagement />} />
          <Route path="/user" element={<User />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

