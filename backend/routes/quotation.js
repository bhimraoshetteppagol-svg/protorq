const express = require('express');
const router = express.Router();
const PdfPrinter = require('pdfmake/js/Printer.js').default;
const Lead = require('../models/Lead');

// Fonts configuration - using pdfmake's standard fonts
// Standard fonts are built into PDF and don't require external files
const standardFonts = require('pdfmake/standard-fonts/Helvetica');
const fonts = standardFonts;

const printer = new PdfPrinter(fonts);

// Helper function to generate PDF from quotation data
const generatePdfFromQuotation = async (quotation, leadId, requesterEmail, requesterNumber) => {
  const { products, terms, verify, currency, totals } = quotation;

  // Filter selected products
  const selectedProducts = products ? products.filter(p => p.selected !== false) : [];
  
  // Use stored totals if available, otherwise calculate
  let grandTotal = totals?.grandTotal || 0;
  if (grandTotal === 0) {
    selectedProducts.forEach((product) => {
      const productPrice = parseFloat(product.price) || 0;
      const productQty = parseInt(product.quantity) || 1;
      grandTotal += productPrice * productQty;
    });
  }

  const discountAmount = totals?.discountAmount || (grandTotal * (parseFloat(terms?.discount || 0) / 100));
  const subtotal = totals?.subtotal || (grandTotal - discountAmount);
  const taxAmount = totals?.taxAmount || (subtotal * (parseFloat(terms?.applicableTaxes || 0) / 100));
  const shipping = totals?.shipping || parseFloat(terms?.shippingCharges || 0);
  const finalTotal = totals?.finalTotal || (subtotal + taxAmount + shipping);

  // Build products table body
  const tableBody = [
    [
      { text: 'Product Name', style: 'tableHeader', bold: true },
      { text: 'Description', style: 'tableHeader', bold: true },
      { text: 'Qty', style: 'tableHeader', bold: true },
      { text: 'Price', style: 'tableHeader', bold: true },
      { text: 'Total', style: 'tableHeader', bold: true }
    ]
  ];

  if (selectedProducts.length > 0) {
    selectedProducts.forEach(product => {
      const productPrice = parseFloat(product.price) || 0;
      const productQty = parseInt(product.quantity) || 1;
      const productTotal = productPrice * productQty;
      tableBody.push([
        product.productName || 'N/A',
        (product.description || 'N/A').substring(0, 30),
        productQty.toString(),
        `${currency || '₹'}${productPrice.toFixed(2)}`,
        `${currency || '₹'}${productTotal.toFixed(2)}`
      ]);
    });
  } else {
    tableBody.push([
      { text: 'No products selected', colSpan: 5, alignment: 'center' },
      '', '', '', ''
    ]);
  }

  // Build content array
  const content = [
    { text: 'QUOTATION', style: 'header', alignment: 'center' },
    { text: `Quotation ID: ${leadId}`, alignment: 'center', margin: [0, 5, 0, 20] },
    
    // From Section
    { text: 'From:', style: 'subheader', margin: [0, 10, 0, 5] }
  ];

  if (verify?.primaryEmail) {
    content.push({ text: `Email: ${verify.primaryEmail}`, margin: [0, 2] });
  }
  if (verify?.alternateEmail) {
    content.push({ text: `Alternate Email: ${verify.alternateEmail}`, margin: [0, 2] });
  }
  
  // Phone numbers
  const phoneNumbers = [];
  if (verify?.primaryPhoneSelected && verify?.primaryPhone) {
    phoneNumbers.push(`Primary: ${verify.primaryPhone}`);
  }
  if (verify?.alternatePhoneSelected && verify?.alternatePhone) {
    phoneNumbers.push(`Alternate: ${verify.alternatePhone}`);
  }
  if (verify?.pnsPhoneSelected && verify?.pnsPhone) {
    phoneNumbers.push(`PNS: ${verify.pnsPhone}`);
  }
  if (phoneNumbers.length > 0) {
    content.push({ text: `Phone: ${phoneNumbers.join(', ')}`, margin: [0, 2] });
  }
  
  // Address
  if (verify?.addressLine1) {
    content.push({ text: verify.addressLine1, margin: [0, 2] });
  }
  if (verify?.addressLine2) {
    content.push({ text: verify.addressLine2, margin: [0, 2] });
  }
  if (verify?.addressPhone) {
    content.push({ text: verify.addressPhone, margin: [0, 2] });
  }
  
  content.push({ text: '', margin: [0, 10] });
  
  // To Section
  content.push({ text: 'To:', style: 'subheader', margin: [0, 10, 0, 5] });
  content.push({ text: `Email: ${requesterEmail || 'N/A'}`, margin: [0, 2] });
  if (requesterNumber) {
    content.push({ text: `Phone: ${requesterNumber}`, margin: [0, 2] });
  }
  
  content.push({ text: '', margin: [0, 10] });
  
  // Products Table
  content.push({ text: 'Products:', style: 'subheader', margin: [0, 10, 0, 5] });
  content.push({
    table: {
      headerRows: 1,
      widths: ['*', 100, 80, 100, 100],
      body: tableBody
    },
    margin: [0, 5, 0, 10]
  });
  
  // Terms Section
  content.push({ text: 'Terms & Conditions:', style: 'subheader', margin: [0, 10, 0, 5] });
  if (terms?.discount) {
    content.push({ text: `Discount: ${terms.discount}%`, margin: [0, 2] });
  }
  if (terms?.applicableTaxes) {
    content.push({ 
      text: `Applicable Taxes: ${terms.applicableTaxes}%${terms.taxesIncluded ? ' (Included in product price)' : ''}`, 
      margin: [0, 2] 
    });
  }
  if (terms?.shippingCharges) {
    content.push({ 
      text: `Shipping Charges: ${currency || '₹'}${terms.shippingCharges}${terms.shippingIncluded ? ' (Included in product price)' : ''}`, 
      margin: [0, 2] 
    });
  }
  if (terms?.deliveryPeriod && terms?.deliveryUnit) {
    content.push({ 
      text: `Delivery Period: ${terms.deliveryPeriod} ${terms.deliveryUnit}`, 
      margin: [0, 2] 
    });
  }
  if (terms?.paymentTerms) {
    content.push({ text: `Payment Terms: ${terms.paymentTerms}`, margin: [0, 2] });
  }
  if (terms?.additionalInformation) {
    content.push({ 
      text: `Additional Information: ${terms.additionalInformation}`, 
      margin: [0, 5] 
    });
  }
  
  content.push({ text: '', margin: [0, 10] });
  
  // Totals
  content.push({ text: `Subtotal: ${currency || '₹'}${grandTotal.toFixed(2)}`, alignment: 'right', margin: [0, 2] });
  if (discountAmount > 0) {
    content.push({ text: `Discount (${terms?.discount}%): ${currency || '₹'}${discountAmount.toFixed(2)}`, alignment: 'right', margin: [0, 2] });
  }
  if (taxAmount > 0) {
    content.push({ text: `Tax (${terms?.applicableTaxes}%): ${currency || '₹'}${taxAmount.toFixed(2)}`, alignment: 'right', margin: [0, 2] });
  }
  if (shipping > 0 && !terms?.shippingIncluded) {
    content.push({ text: `Shipping: ${currency || '₹'}${shipping.toFixed(2)}`, alignment: 'right', margin: [0, 2] });
  }
  content.push({ text: `Total: ${currency || '₹'}${finalTotal.toFixed(2)}`, style: 'total', alignment: 'right', margin: [0, 10] });
  
  // Footer
  content.push({ text: 'Note: Above details will be displayed in the quotation', alignment: 'center', fontSize: 10, margin: [0, 10] });
  content.push({ text: `Generated on: ${quotation.generatedAt ? new Date(quotation.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, alignment: 'center', fontSize: 10 });

  // Build PDF document definition
  const docDefinition = {
    content: content,
    styles: {
      header: {
        fontSize: 24,
        bold: true
      },
      subheader: {
        fontSize: 14,
        bold: true
      },
      tableHeader: {
        bold: true,
        fontSize: 10
      },
      total: {
        fontSize: 14,
        bold: true
      }
    },
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 12
    }
  };

  // Generate PDF
  const pdfDoc = await printer.createPdfKitDocument(docDefinition);
  
  // Collect PDF chunks
  const chunks = [];
  pdfDoc.on('data', (chunk) => {
    chunks.push(chunk);
  });

  // Generate PDF buffer
  const pdfBuffer = await new Promise((resolve, reject) => {
    pdfDoc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    pdfDoc.on('error', (err) => {
      console.error('PDF generation error:', err);
      reject(err);
    });
    pdfDoc.end();
  });

  return pdfBuffer;
};

// Get PDF quotation - regenerates from quotation data
router.get('/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json({ message: 'Lead ID is required' });
    }

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check if quotation exists
    if (!lead.quotation || !lead.quotation.products) {
      return res.status(404).json({ message: 'Quotation not found for this lead' });
    }

    // Regenerate PDF from quotation data
    const pdfBuffer = await generatePdfFromQuotation(
      lead.quotation,
      leadId,
      lead.requesterEmail,
      lead.requesterNumber
    );

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${leadId}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF from quotation:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Generate PDF quotation
router.post('/generate', async (req, res) => {
  try {
    const { leadId, products, terms, verify, currency, requesterEmail, requesterNumber } = req.body;

    console.log('PDF Generation Request:', { leadId, productsCount: products?.length });

    if (!leadId) {
      return res.status(400).json({ message: 'Lead ID is required' });
    }

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const pdfFileName = `${leadId}.pdf`;

    // Filter selected products
    const selectedProducts = products ? products.filter(p => p.selected) : [];
    
    // Calculate totals
    let grandTotal = 0;
    selectedProducts.forEach((product) => {
      const productPrice = parseFloat(product.price) || 0;
      const productQty = parseInt(product.quantity) || 1;
      grandTotal += productPrice * productQty;
    });

    const discountAmount = grandTotal * (parseFloat(terms?.discount || 0) / 100);
    const subtotal = grandTotal - discountAmount;
    const taxAmount = subtotal * (parseFloat(terms?.applicableTaxes || 0) / 100);
    const shipping = parseFloat(terms?.shippingCharges || 0);
    const finalTotal = subtotal + taxAmount + shipping;

    // Build products table body
    const tableBody = [
      [
        { text: 'Product Name', style: 'tableHeader', bold: true },
        { text: 'Description', style: 'tableHeader', bold: true },
        { text: 'Qty', style: 'tableHeader', bold: true },
        { text: 'Price', style: 'tableHeader', bold: true },
        { text: 'Total', style: 'tableHeader', bold: true }
      ]
    ];

    if (selectedProducts.length > 0) {
      selectedProducts.forEach(product => {
        const productPrice = parseFloat(product.price) || 0;
        const productQty = parseInt(product.quantity) || 1;
        const productTotal = productPrice * productQty;
        tableBody.push([
          product.productName || 'N/A',
          (product.description || 'N/A').substring(0, 30),
          productQty.toString(),
          `${currency || '₹'}${productPrice.toFixed(2)}`,
          `${currency || '₹'}${productTotal.toFixed(2)}`
        ]);
      });
    } else {
      tableBody.push([
        { text: 'No products selected', colSpan: 5, alignment: 'center' },
        '', '', '', ''
      ]);
    }

    // Build content array
    const content = [
      { text: 'QUOTATION', style: 'header', alignment: 'center' },
      { text: `Quotation ID: ${leadId}`, alignment: 'center', margin: [0, 5, 0, 20] },
      
      // From Section
      { text: 'From:', style: 'subheader', margin: [0, 10, 0, 5] }
    ];

    if (verify?.primaryEmail) {
      content.push({ text: `Email: ${verify.primaryEmail}`, margin: [0, 2] });
    }
    if (verify?.alternateEmail) {
      content.push({ text: `Alternate Email: ${verify.alternateEmail}`, margin: [0, 2] });
    }
    
    // Phone numbers
    const phoneNumbers = [];
    if (verify?.primaryPhoneSelected && verify?.primaryPhone) {
      phoneNumbers.push(`Primary: ${verify.primaryPhone}`);
    }
    if (verify?.alternatePhoneSelected && verify?.alternatePhone) {
      phoneNumbers.push(`Alternate: ${verify.alternatePhone}`);
    }
    if (verify?.pnsPhoneSelected && verify?.pnsPhone) {
      phoneNumbers.push(`PNS: ${verify.pnsPhone}`);
    }
    if (phoneNumbers.length > 0) {
      content.push({ text: `Phone: ${phoneNumbers.join(', ')}`, margin: [0, 2] });
    }
    
    // Address
    if (verify?.addressLine1) {
      content.push({ text: verify.addressLine1, margin: [0, 2] });
    }
    if (verify?.addressLine2) {
      content.push({ text: verify.addressLine2, margin: [0, 2] });
    }
    if (verify?.addressPhone) {
      content.push({ text: verify.addressPhone, margin: [0, 2] });
    }
    
    content.push({ text: '', margin: [0, 10] });
    
    // To Section
    content.push({ text: 'To:', style: 'subheader', margin: [0, 10, 0, 5] });
    content.push({ text: `Email: ${requesterEmail || 'N/A'}`, margin: [0, 2] });
    if (requesterNumber) {
      content.push({ text: `Phone: ${requesterNumber}`, margin: [0, 2] });
    }
    
    content.push({ text: '', margin: [0, 10] });
    
    // Products Table
    content.push({ text: 'Products:', style: 'subheader', margin: [0, 10, 0, 5] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 100, 80, 100, 100],
        body: tableBody
      },
      margin: [0, 5, 0, 10]
    });
    
    // Terms Section
    content.push({ text: 'Terms & Conditions:', style: 'subheader', margin: [0, 10, 0, 5] });
    if (terms?.discount) {
      content.push({ text: `Discount: ${terms.discount}%`, margin: [0, 2] });
    }
    if (terms?.applicableTaxes) {
      content.push({ 
        text: `Applicable Taxes: ${terms.applicableTaxes}%${terms.taxesIncluded ? ' (Included in product price)' : ''}`, 
        margin: [0, 2] 
      });
    }
    if (terms?.shippingCharges) {
      content.push({ 
        text: `Shipping Charges: ${currency || '₹'}${terms.shippingCharges}${terms.shippingIncluded ? ' (Included in product price)' : ''}`, 
        margin: [0, 2] 
      });
    }
    if (terms?.deliveryPeriod && terms?.deliveryUnit) {
      content.push({ 
        text: `Delivery Period: ${terms.deliveryPeriod} ${terms.deliveryUnit}`, 
        margin: [0, 2] 
      });
    }
    if (terms?.paymentTerms) {
      content.push({ text: `Payment Terms: ${terms.paymentTerms}`, margin: [0, 2] });
    }
    if (terms?.additionalInformation) {
      content.push({ 
        text: `Additional Information: ${terms.additionalInformation}`, 
        margin: [0, 5] 
      });
    }
    
    content.push({ text: '', margin: [0, 10] });
    
    // Totals
    content.push({ text: `Subtotal: ${currency || '₹'}${grandTotal.toFixed(2)}`, alignment: 'right', margin: [0, 2] });
    if (discountAmount > 0) {
      content.push({ text: `Discount (${terms?.discount}%): ${currency || '₹'}${discountAmount.toFixed(2)}`, alignment: 'right', margin: [0, 2] });
    }
    if (taxAmount > 0) {
      content.push({ text: `Tax (${terms?.applicableTaxes}%): ${currency || '₹'}${taxAmount.toFixed(2)}`, alignment: 'right', margin: [0, 2] });
    }
    if (shipping > 0 && !terms?.shippingIncluded) {
      content.push({ text: `Shipping: ${currency || '₹'}${shipping.toFixed(2)}`, alignment: 'right', margin: [0, 2] });
    }
    content.push({ text: `Total: ${currency || '₹'}${finalTotal.toFixed(2)}`, style: 'total', alignment: 'right', margin: [0, 10] });
    
    // Footer
    content.push({ text: 'Note: Above details will be displayed in the quotation', alignment: 'center', fontSize: 10, margin: [0, 10] });
    content.push({ text: `Generated on: ${new Date().toLocaleDateString()}`, alignment: 'center', fontSize: 10 });

    // Build PDF document definition
    const docDefinition = {
      content: content,
      styles: {
        header: {
          fontSize: 24,
          bold: true
        },
        subheader: {
          fontSize: 14,
          bold: true
        },
        tableHeader: {
          bold: true,
          fontSize: 10
        },
        total: {
          fontSize: 14,
          bold: true
        }
      },
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 12
      }
    };

    // Generate PDF (createPdfKitDocument is async)
    const pdfDoc = await printer.createPdfKitDocument(docDefinition);
    
    // Collect PDF chunks
    const chunks = [];
    pdfDoc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    // Generate PDF buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdfDoc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      pdfDoc.on('error', (err) => {
        console.error('PDF generation error:', err);
        reject(err);
      });
      pdfDoc.end();
    });

    // Prepare quotation data to save in database
    const quotationData = {
      products: selectedProducts.map(p => ({
        productName: p.productName || '',
        description: p.description || '',
        quantity: parseInt(p.quantity) || 1,
        price: parseFloat(p.price) || 0,
        unit: p.unit || 'Unit',
        selected: p.selected !== false
      })),
      terms: {
        discount: terms?.discount || '',
        applicableTaxes: terms?.applicableTaxes || '',
        taxesIncluded: terms?.taxesIncluded || false,
        shippingCharges: terms?.shippingCharges || '',
        shippingIncluded: terms?.shippingIncluded || false,
        deliveryPeriod: terms?.deliveryPeriod || '',
        deliveryUnit: terms?.deliveryUnit || '',
        paymentTerms: terms?.paymentTerms || '',
        additionalInformation: terms?.additionalInformation || ''
      },
      verify: {
        primaryEmail: verify?.primaryEmail || '',
        alternateEmail: verify?.alternateEmail || '',
        primaryPhone: verify?.primaryPhone || '',
        alternatePhone: verify?.alternatePhone || '',
        pnsPhone: verify?.pnsPhone || '',
        primaryPhoneSelected: verify?.primaryPhoneSelected || false,
        alternatePhoneSelected: verify?.alternatePhoneSelected || false,
        pnsPhoneSelected: verify?.pnsPhoneSelected || false,
        addressType: verify?.addressType || 'Primary',
        addressLine1: verify?.addressLine1 || '',
        addressLine2: verify?.addressLine2 || '',
        addressPhone: verify?.addressPhone || ''
      },
      currency: currency || '₹',
      totals: {
        grandTotal: grandTotal,
        discountAmount: discountAmount,
        subtotal: subtotal,
        taxAmount: taxAmount,
        shipping: shipping,
        finalTotal: finalTotal
      },
      generatedAt: new Date()
    };

    // Update lead with quotation data and status to 'completed'
    await Lead.findByIdAndUpdate(leadId, { 
      status: 'completed',
      quotation: quotationData
    });
    console.log(`Lead ${leadId} status updated to 'completed', quotation data saved to MongoDB`);

    // Send response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdfFileName}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
});

// Send quotation email (placeholder)
router.post('/send', async (req, res) => {
  try {
    const { leadId, requesterEmail } = req.body;

    if (!leadId || !requesterEmail) {
      return res.status(400).json({ message: 'Lead ID and requester email are required' });
    }

    // Update lead status
    await Lead.findByIdAndUpdate(leadId, { status: 'completed' });

    // In a real application, you would send an email here
    // For now, we'll just return success
    res.json({ 
      message: 'Quotation sent successfully',
      email: requesterEmail
    });
  } catch (error) {
    console.error('Error sending quotation:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

module.exports = router;
