const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users with role "user"
router.get('/users', async (req, res) => {
  try {
    console.log('GET /api/users endpoint called');
    const users = await User.find({ role: 'user' }).select('-password');
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get single user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (only allow role 'user' for this endpoint)
    const user = new User({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user'
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.params.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update email if provided
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email.toLowerCase().trim();
    }

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// ========== EMPLOYEE ROUTES ==========

// Get all users with role "employee"
router.get('/employees', async (req, res) => {
  try {
    console.log('GET /api/employees endpoint called');
    const employees = await User.find({ role: 'employee' }).select('-password');
    console.log(`Found ${employees.length} employees`);
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get single employee by ID
router.get('/employees/:id', async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Create new employee
router.post('/employees', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if employee exists
    const existingEmployee = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create employee (only allow role 'employee' for this endpoint)
    const employee = new User({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'employee'
    });

    await employee.save();

    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employee._id.toString(),
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update employee
router.put('/employees/:id', async (req, res) => {
  try {
    const { email, password } = req.body;
    const employeeId = req.params.id;

    // Find employee
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update email if provided
    if (email) {
      // Check if email is already taken by another employee
      const existingEmployee = await User.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: employeeId }
      });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      employee.email = email.toLowerCase().trim();
    }

    // Update password if provided
    if (password) {
      employee.password = await bcrypt.hash(password, 10);
    }

    await employee.save();

    res.json({
      message: 'Employee updated successfully',
      employee: {
        id: employee._id.toString(),
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete employee
router.delete('/employees/:id', async (req, res) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

module.exports = router;

