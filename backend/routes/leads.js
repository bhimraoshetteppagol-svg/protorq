const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// Get all leads
router.get('/leads', async (req, res) => {
  try {
    console.log('GET /api/leads endpoint called');
    const leads = await Lead.find().sort({ createdAt: -1 });
    console.log(`Found ${leads.length} leads`);
    res.json(leads);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get single lead by ID
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Create new lead
router.post('/leads', async (req, res) => {
  try {
    const { productName, quantityRequested, requesterEmail, requesterNumber, assignedEmployee } = req.body;

    // Validate input
    if (!productName || !quantityRequested || !requesterEmail) {
      return res.status(400).json({ message: 'Product name, quantity, and requester email are required' });
    }

    if (typeof quantityRequested !== 'number' || quantityRequested < 1) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    // Create lead
    const lead = new Lead({
      productName: productName.trim(),
      quantityRequested: parseInt(quantityRequested),
      requesterEmail: requesterEmail.trim().toLowerCase(),
      requesterNumber: requesterNumber ? requesterNumber.trim() : '',
      assignedEmployee: assignedEmployee ? assignedEmployee.trim() : ''
    });

    await lead.save();

    res.status(201).json({
      message: 'Lead created successfully',
      lead: lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Assign lead to employee (must be before generic update route)
router.put('/leads/:id/assign', async (req, res) => {
  try {
    const { assignedEmployee, comment } = req.body;
    const leadId = req.params.id;

    if (!assignedEmployee) {
      return res.status(400).json({ message: 'Employee email is required' });
    }

    // Find lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Update assignment
    lead.assignedEmployee = assignedEmployee.trim();
    lead.status = 'assigned';

    // Add comment if provided
    if (comment && comment.trim()) {
      if (!lead.comments) {
        lead.comments = [];
      }
      lead.comments.push({
        comment: comment.trim(),
        authorType: 'admin',
        createdAt: new Date()
      });
    }

    await lead.save();

    res.json({
      message: 'Lead assigned successfully',
      lead: lead
    });
  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update lead
router.put('/leads/:id', async (req, res) => {
  try {
    const { productName, quantityRequested, requesterEmail, requesterNumber, assignedEmployee, status } = req.body;
    const leadId = req.params.id;

    console.log('Update lead request body:', req.body);
    console.log('RequesterNumber from body:', requesterNumber);

    // Find lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    console.log('Current lead before update:', {
      productName: lead.productName,
      quantityRequested: lead.quantityRequested,
      requesterEmail: lead.requesterEmail,
      requesterNumber: lead.requesterNumber,
      assignedEmployee: lead.assignedEmployee
    });

    // Update fields if provided, otherwise preserve existing values
    if (productName !== undefined && productName !== null && productName !== '') {
      lead.productName = String(productName).trim();
    }
    if (quantityRequested !== undefined && quantityRequested !== null) {
      if (typeof quantityRequested !== 'number' || quantityRequested < 1) {
        return res.status(400).json({ message: 'Quantity must be a positive number' });
      }
      lead.quantityRequested = parseInt(quantityRequested);
    }
    if (requesterEmail !== undefined && requesterEmail !== null && requesterEmail !== '') {
      lead.requesterEmail = String(requesterEmail).trim().toLowerCase();
    }
    // Always handle requesterNumber - it can be an empty string
    if (requesterNumber !== undefined) {
      // If it's null or empty string, set it to empty string
      if (requesterNumber === null || requesterNumber === '') {
        lead.requesterNumber = '';
      } else {
        lead.requesterNumber = String(requesterNumber).trim();
      }
    }
    // If requesterNumber is not in the request body, keep existing value
    if (assignedEmployee !== undefined && assignedEmployee !== null) {
      lead.assignedEmployee = assignedEmployee === '' ? '' : String(assignedEmployee).trim();
    }
    if (status !== undefined && status !== null && status !== '') {
      lead.status = status;
    }

    console.log('Lead after update (before save):', {
      productName: lead.productName,
      quantityRequested: lead.quantityRequested,
      requesterEmail: lead.requesterEmail,
      requesterNumber: lead.requesterNumber,
      assignedEmployee: lead.assignedEmployee
    });

    await lead.save();

    console.log('Lead saved successfully');

    res.json({
      message: 'Lead updated successfully',
      lead: lead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete lead
router.delete('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

module.exports = router;

