const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const PDFDocument = require("pdfkit");
const moment = require("moment");
const mongoose = require('mongoose');

// PROFESSIONAL PDF GENERATOR - Handles all bill structures
const generateProfessionalPdf = (doc, bill) => {
  try {
    const primaryColor = "#2E8B57";
    const accentColor = "#FFA500";
    const textColor = "#333333";
    const lightText = "#666666";
    const borderColor = "#E0E0E0";
    const backgroundColor = "#F8FFF8";

    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 50;

    const billNumber = bill.billNumber || bill._id?.toString().slice(-8).toUpperCase() || 'N/A';
    const employeeName = bill.employeeName || 'Unknown Employee';
    const createdAt = bill.createdAt || new Date();
    
    let customers = [];
    if (bill.customers && Array.isArray(bill.customers)) {
      customers = bill.customers;
    } else if (bill.customerName || bill.items) {
      customers = [{
        customerName: bill.customerName || 'Customer',
        items: bill.items || [],
        subtotal: bill.totalAmount || 0
      }];
    }

    const totalItems = bill.totalItems || customers.reduce((sum, cust) => 
      sum + (cust.items?.length || 0), 0
    );
    
    const totalAmount = bill.totalAmount || customers.reduce((sum, cust) => 
      sum + (cust.subtotal || 0), 0
    );
    
    const totalCommission = bill.totalCommission || customers.reduce((sum, cust) => 
      sum + (cust.items?.reduce((itemSum, item) => 
        itemSum + (item.commissionAmount || 0), 0) || 0), 0
    );
    
    const discountPercent = bill.discountPercent || 0;
    const discountAmount = bill.discountAmount || (totalAmount * discountPercent / 100);
    const finalAmount = bill.finalAmount || (totalAmount - discountAmount);

    // ==================== HEADER ====================
    doc.fillColor(primaryColor)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("AgriShop", margin, currentY);

    doc.fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text("Fertilizers & Agricultural Products", margin, currentY + 25)
      .text("Contact: +91 XXXXX XXXXX | Email: info@agrishop.com", margin, currentY + 40)
      .text("GSTIN: 07AABCU9603R1ZM", margin, currentY + 55);

    const headerBoxWidth = 180;  // safe width — stays inside margins
    const headerX = pageWidth - margin - headerBoxWidth;

    doc.fillColor(primaryColor)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("TAX INVOICE", headerX, currentY, {
        width: headerBoxWidth,
        align: "right"
      })
      .fontSize(10)
      .text(`Invoice #: ${billNumber}`, headerX, currentY + 25, {
        width: headerBoxWidth,
        align: "right"
      })
      .text(`Date: ${moment(createdAt).format("DD/MM/YYYY")}`, headerX, currentY + 40, {
        width: headerBoxWidth,
        align: "right"
      })
      .text(`Time: ${moment(createdAt).format("hh:mm A")}`, headerX, currentY + 55, {
        width: headerBoxWidth,
        align: "right"
      });

    currentY += 80;

    // ==================== EMPLOYEE & SUMMARY ====================
    const boxHeight = 60;
    
    doc.rect(margin, currentY, contentWidth / 2 - 10, boxHeight)
      .fill(backgroundColor)
      .stroke(borderColor);

    doc.fillColor(textColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Employee:", margin + 10, currentY + 15)
      .font("Helvetica")
      .fontSize(10)
      .text(employeeName, margin + 10, currentY + 35);

    doc.rect(margin + contentWidth / 2 + 10, currentY, contentWidth / 2 - 10, boxHeight)
      .fill(backgroundColor)
      .stroke(borderColor);

    doc.fillColor(textColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Summary:", margin + contentWidth / 2 + 20, currentY + 15)
      .font("Helvetica")
      .fontSize(10)
      .text(`${customers.length} Customer${customers.length !== 1 ? 's' : ''}`, margin + contentWidth / 2 + 20, currentY + 35)
      .text(`${totalItems} Total Items`, margin + contentWidth / 2 + 20, currentY + 50);

    currentY += boxHeight + 30;

    // ==================== CUSTOMER SECTIONS ====================
    customers.forEach((customer, customerIndex) => {
      if (customerIndex > 0) {
        doc.addPage();
        currentY = 50;
      }

      const customerItems = customer.items || [];
      const customerName = customer.customerName || 'Customer';

      doc.rect(margin, currentY, contentWidth, 25)
        .fill(accentColor);

      doc.fillColor("#FFFFFF")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`CUSTOMER: ${customerName.toUpperCase()}`, margin + 15, currentY + 8);

      currentY += 35;

      if (customerItems.length > 0) {
        const tableTop = currentY;
        const rowHeight = 20;
        // Auto-fitting columns so they NEVER overflow
        const colWidths = (() => {
          const percentages = [0.35, 0.10, 0.13, 0.12, 0.15, 0.15]; 
          return percentages.map(p => Math.floor(contentWidth * p));
        })();

        const totalColX = margin + colWidths.slice(0, 5).reduce((a, b) => a + b, 0);
        const totalColWidth = colWidths[5];

        doc.rect(margin, tableTop, contentWidth, rowHeight)
          .fill(primaryColor);

        let headerX = margin;
        ['PRODUCT', 'QTY', 'RATE', 'COMM %', 'COMM AMT', 'TOTAL'].forEach((header, index) => {
          doc.fillColor("#FFFFFF")
            .fontSize(9)
            .font("Helvetica-Bold")
            .text(header, headerX + 8, tableTop + 7);
          headerX += colWidths[index];
        });

        currentY += rowHeight;

        customerItems.forEach((item, itemIndex) => {
          const rowColor = itemIndex % 2 === 0 ? "#FFFFFF" : backgroundColor;
          
          doc.rect(margin, currentY, contentWidth, rowHeight)
            .fill(rowColor)
            .stroke(borderColor);

          let cellX = margin;

          const productName = item.productName || 'Product';
          const quantity = item.quantity || 0;
          const rate = item.rate || 0;
          const commissionPercent = item.commissionPercent || 0;
          const commissionAmount = item.commissionAmount || 0;
          const lineTotal = item.lineTotal || (quantity * rate + commissionAmount);

          doc.fillColor(textColor)
            .fontSize(8)
            .font("Helvetica")
            .text(productName, cellX + 8, currentY + 7, { width: colWidths[0] - 15 });
          cellX += colWidths[0];

          doc.text(quantity.toString(), cellX + 8, currentY + 7);
          cellX += colWidths[1];

          doc.text(`₹${Number(rate).toFixed(2)}`, cellX + 8, currentY + 7);
          cellX += colWidths[2];

          doc.text(`${Number(commissionPercent).toFixed(1)}%`, cellX + 8, currentY + 7);
          cellX += colWidths[3];

          doc.text(`₹${Number(commissionAmount).toFixed(2)}`, cellX + 8, currentY + 7);
          cellX += colWidths[4];

          doc.font("Helvetica-Bold")
            .text(`₹${Number(lineTotal).toFixed(2)}`, cellX + 8, currentY + 7);

          currentY += rowHeight;
        });

        const customerSubtotal = customer.subtotal || customerItems.reduce((sum, item) => 
          sum + (item.lineTotal || 0), 0
        );

        currentY += 10;
        doc.rect(margin + contentWidth - 220, currentY, 220, 25)
          .fill(backgroundColor)
          .stroke(borderColor);

        // Subtotal box aligned exactly under TOTAL column
        doc.fillColor(textColor)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(`Subtotal:`, totalColX + 5, currentY + 8, {
            width: totalColWidth - 10,
            align: "left"
          });

        doc.text(`${Number(customerSubtotal).toFixed(2)}`,
          totalColX + 5,
          currentY + 24,
          {
            width: totalColWidth - 10,
            align: "left"
          }
        );


        currentY += 45;
      } else {
        doc.rect(margin, currentY, contentWidth, 30)
          .fill(backgroundColor)
          .stroke(borderColor);

        doc.fillColor(lightText)
          .fontSize(10)
          .font("Helvetica")
          .text("No items for this customer", margin + 15, currentY + 10);

        currentY += 50;
      }
    });

    if (currentY > doc.page.height - 120) {
      doc.addPage();
      currentY = 50;
    }

    const totalsWidth = 300;
    const totalsX = pageWidth - margin - totalsWidth;

    doc.rect(totalsX, currentY, totalsWidth, 100)
      .fill(backgroundColor)
      .stroke(borderColor);

    let totalsY = currentY + 15;

    // Helper for clean aligned rows
    const writeTotalRow = (label, value, y, isFinal = false) => {
      doc.fillColor(isFinal ? primaryColor : textColor)
        .font(isFinal ? "Helvetica-Bold" : "Helvetica")
        .fontSize(isFinal ? 12 : 10)
        .text(label, totalsX + 10, y, {
          width: totalsWidth - 20,
          align: "left",
        });

      doc.text(value, totalsX + 10, y, {
        width: totalsWidth - 20,
        align: "right",
      });
    };

    // Rows
    writeTotalRow("Total Amount:", `₹${totalAmount.toFixed(2)}`, totalsY);
    totalsY += 18;

    writeTotalRow("Total Commission:", `₹${totalCommission.toFixed(2)}`, totalsY);
    totalsY += 18;

    if (discountPercent > 0) {
      writeTotalRow(`Discount (${discountPercent}%):`, `-₹${discountAmount.toFixed(2)}`, totalsY);
      totalsY += 18;
    }

    // Final amount
    writeTotalRow("FINAL AMOUNT:", `₹${finalAmount.toFixed(2)}`, totalsY, true);


    currentY += 110;

    if (bill.notes && bill.notes.trim() !== '') {
      doc.rect(margin, currentY, contentWidth, 35)
        .fill(backgroundColor)
        .stroke(borderColor);

      doc.fillColor(textColor)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Notes:", margin + 10, currentY + 12)
        .font("Helvetica")
        .fillColor(lightText)
        .text(bill.notes, margin + 45, currentY + 12, { width: contentWidth - 55 });

      currentY += 50;
    }

    const footerY = doc.page.height - 40;
    
    doc.moveTo(margin, footerY)
      .lineTo(pageWidth - margin, footerY)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();

    doc.fillColor(lightText)
      .fontSize(8)
      .text("Thank you for your business!", margin, footerY + 10, { align: "center", width: contentWidth })
      .text("This is a computer generated invoice. No signature required.", margin, footerY + 22, { align: "center", width: contentWidth });

  } catch (err) {
    console.error("PDF Generation Error:", err);
    doc.fontSize(12)
       .text('Invoice Error')
       .text('Bill ID: ' + (bill._id || 'Unknown'))
       .text('Error: ' + err.message);
  }
};

// CREATE BILL
exports.createBill = async (req, res) => {
  try {
    const { employeeId, customers = [], discountPercent = 0, notes = '' } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Employee ID' });
    }

    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one customer is required' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const processedCustomers = [];
    const stockUpdates = [];

    for (const cust of customers) {
      if (!cust.customerName?.trim()) {
        return res.status(400).json({ success: false, message: 'Customer name required' });
      }

      if (!Array.isArray(cust.items) || cust.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Customer must have items' });
      }

      const itemsList = [];

      for (const itemData of cust.items) {
        if (!itemData.productId) {
          return res.status(400).json({ success: false, message: "productId missing" });
        }

        const product = await Product.findById(itemData.productId);
        if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }

        const quantity = Number(itemData.quantity);
        if (quantity <= 0) {
          return res.status(400).json({ success: false, message: "Quantity invalid" });
        }

        if (product.quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`
          });
        }

        const rate = product.rate;
        const itemAmount = quantity * rate;
        const commissionPercent = itemData.commissionPercent || product.commissionPercent || 3;
        const commissionAmount = (itemAmount * commissionPercent) / 100;
        const lineTotal = itemAmount + commissionAmount;

        itemsList.push({
          productId: product._id,
          productName: product.name,
          quantity,
          rate,
          itemAmount,
          commissionPercent,
          commissionAmount,
          lineTotal
        });

        stockUpdates.push({ productId: product._id, qty: quantity });
      }

      const subtotal = itemsList.reduce((s, i) => s + i.lineTotal, 0);

      processedCustomers.push({
        customerName: cust.customerName,
        items: itemsList,
        subtotal
      });
    }

    for (const s of stockUpdates) {
      await Product.findByIdAndUpdate(s.productId, { $inc: { quantity: -s.qty } });
    }

    const totalAmount = processedCustomers.reduce((s, c) => s + c.subtotal, 0);
    const discountAmount = (totalAmount * discountPercent) / 100;
    const finalAmount = totalAmount - discountAmount;
    const totalItems = processedCustomers.reduce((sum, cust) => sum + cust.items.length, 0);
    const totalCommission = processedCustomers.reduce((sum, cust) => 
      sum + cust.items.reduce((itemSum, item) => itemSum + item.commissionAmount, 0), 0
    );

    const newBill = await Bill.create({
      employeeId,
      employeeName: employee.name,
      customers: processedCustomers,
      discountPercent,
      discountAmount,
      totalAmount,
      totalCommission,
      totalItems,
      finalAmount,
      notes
    });

    res.status(201).json({
      success: true,
      message: "Multi-customer bill created successfully",
      data: newBill
    });

  } catch (error) {
    console.error("CREATE BILL ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating bill",
      error: error.message
    });
  }
};

// GET BILL PDF
exports.getBillPdf = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('employeeId', 'name email phone');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=invoice-${bill.billNumber || bill._id}.pdf`);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `Invoice ${bill.billNumber || bill._id}`,
        Author: 'AgriShop',
        Subject: 'Tax Invoice'
      }
    });

    doc.pipe(res);
    generateProfessionalPdf(doc, bill);
    doc.end();

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({
      success: false,
      message: "PDF generation failed",
      error: err.message
    });
  }
};

// GET ALL BILLS WITH PAGINATION - FIXED FOR FRONTEND
exports.getAllBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const bills = await Bill.find()
      .populate('employeeId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Bill.countDocuments();

    // FRONTEND EXPECTS THIS STRUCTURE
    res.json({
      success: true,
      bills: bills, // Frontend expects 'bills' array
      total: total,
      page: page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    });
  } catch (err) {
    console.error('Get bills error:', err);
    res.status(500).json({
      success: false,
      message: "Error loading bills",
      error: err.message
    });
  }
};

// GET BILL BY ID
exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('employeeId', 'name email phone department');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/api/bills/${bill._id}/pdf`;
    const shareUrl = `${baseUrl}/bill/${bill._id}`;

    res.json({
      success: true,
      data: {
        ...bill.toObject(),
        pdfDownloadLink: pdfUrl,
        shareLink: shareUrl
      }
    });

  } catch (err) {
    console.error('Get bill error:', err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
};

// GET BILLS BY EMPLOYEE
exports.getBillsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = { employeeId };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    const bills = await Bill.find(query)
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills: bills, // Frontend expects 'bills'
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error('Get employee bills error:', err);
    res.status(500).json({
      success: false,
      message: "Error loading employee bills",
      error: err.message
    });
  }
};

// GET UNIQUE CUSTOMERS (Frontend calls this "dealers")
exports.getUniqueDealers = async (req, res) => {
  try {
    const dealers = await Bill.distinct('customers.customerName');
    res.json({
      success: true,
      dealers: dealers // Frontend expects 'dealers' array
    });
  } catch (err) {
    console.error('Get dealers error:', err);
    res.status(500).json({
      success: false,
      message: "Error loading dealers",
      error: err.message
    });
  }
};

exports.getFilteredBills = async (req, res) => {
  try {
    const { search, customer, dealer, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = {};

   
    if (customer && customer.trim() !== "") {
      query['customers.customerName'] = { $regex: customer, $options: "i" };
    }

    if (dealer && dealer.trim() !== "") {
      query.employeeName = { $regex: dealer, $options: "i" };
    }

    // Search filter
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { 'customers.customerName': { $regex: search, $options: 'i' } },
        { employeeName: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59")
      };
    }

    const skip = (page - 1) * limit;
    const bills = await Bill.find(query)
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Bill.countDocuments(query);

    // FRONTEND EXPECTS THIS STRUCTURE
    res.json({
      success: true,
      data: bills, // Frontend expects 'data' array
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error('Get filtered bills error:', err);
    res.status(500).json({
      success: false,
      message: "Error loading filtered bills",
      error: err.message
    });
  }
};

// DELETE BILL
exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    res.json({
      success: true,
      message: "Bill deleted successfully"
    });

  } catch (err) {
    console.error('Delete bill error:', err);
    res.status(500).json({
      success: false,
      message: "Error deleting bill",
      error: err.message
    });
  }
};