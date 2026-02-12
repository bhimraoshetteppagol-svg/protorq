const express = require('express');
const router = express.Router();
const PdfPrinter = require('pdfmake/js/Printer.js').default;
const fs = require('fs');
const path = require('path');
const Lead = require('../models/Lead');

// Ensure quotations directory exists
const quotationsDir = path.join(__dirname, '../../quotations');
if (!fs.existsSync(quotationsDir)) {
  fs.mkdirSync(quotationsDir, { recursive: true });
}

// Fonts configuration - using pdfmake's standard fonts
// Standard fonts are built into PDF and don't require external files
const standardFonts = require('pdfmake/standard-fonts/Helvetica');
const fonts = standardFonts;

const printer = new PdfPrinter(fonts);

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
    const pdfPath = path.join(quotationsDir, pdfFileName);

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

    // Save to file
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`PDF saved successfully to: ${pdfPath}`);

    // Update lead status to 'completed' when quotation is generated
    await Lead.findByIdAndUpdate(leadId, { status: 'completed' });
    console.log(`Lead ${leadId} status updated to 'completed'`);

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
