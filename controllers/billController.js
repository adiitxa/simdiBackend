// billController.js
const Bill = require("../models/Bill");
const Product = require("../models/Product");
const PDFDocument = require("pdfkit");
const moment = require("moment");


// Currency formatter
const formatCurrency = (amount) => {
    const num = Number(amount);
    return isNaN(num) ? "₹0.00" : `₹${num.toFixed(2)}`;
};

/* ======================================================================
   PDF GENERATOR (NO CHANGE)
====================================================================== */
const generateProfessionalPdf = (doc, bill) => {
    try {
        const primaryColor = "#2E8B57";
        const textColor = "#333333";
        const borderColor = "#E0E0E0";

        const itemsTotal = bill.items.reduce((sum, item) => {
            const amt = Number(item.itemAmount ?? (item.quantity * item.rate)) || 0;
            return sum + amt;
        }, 0);

        const totalCommission = bill.items.reduce((sum, item) => {
            return sum + Number(item.commissionAmount || 0);
        }, 0);

        const calculatedTotal = Math.round(itemsTotal + totalCommission);
        const finalAmount = bill.totalAmount || calculatedTotal;

        const rightMargin = 50;
        const pageRight = doc.page.width - rightMargin;
        const totalsWidth = 220;
        const totalsX = pageRight - totalsWidth;
        const valueX = totalsX + 120;

        doc.fillColor(primaryColor)
            .fontSize(24)
            .font("Helvetica-Bold")
            .text("AgriShop", 50, 50);

        doc.fillColor(textColor)
            .fontSize(10)
            .text("Fertilizers & Agricultural Products", 50, 80)
            .text("Contact: +91 XXXXX XXXXX | Email: info@agrishop.com", 50, 95)
            .text("GSTIN: 07AABCU9603R1ZM", 50, 110);

        doc.fillColor(primaryColor)
            .fontSize(20)
            .font("Helvetica-Bold")
            .text("TAX INVOICE", 400, 50, { align: "right" });

        const detailsY = 150;

        doc.rect(50, detailsY, 250, 80).fill("#F8FFF8").stroke(borderColor);
        doc.fillColor(textColor).fontSize(12).font("Helvetica-Bold").text("Bill To:", 60, detailsY + 15);

        doc.font("Helvetica")
            .fontSize(10)
            .text(bill.customerName, 60, detailsY + 35)
            .text(`Date: ${moment(bill.createdAt).format("DD/MM/YYYY")}`, 60, detailsY + 50)
            .text(`Time: ${moment(bill.createdAt).format("hh:mm A")}`, 60, detailsY + 65);

        doc.rect(320, detailsY, 230, 80).fill("#F8FFF8").stroke(borderColor);
        doc.fillColor(textColor).fontSize(12).font("Helvetica-Bold").text("Invoice Details:", 330, detailsY + 15);

        doc.font("Helvetica")
            .fontSize(10)
            .text(`Invoice #: ${bill._id.toString().slice(-8).toUpperCase()}`, 330, detailsY + 35)
            .text(`Bill Date: ${moment(bill.createdAt).format("DD/MM/YYYY")}`, 330, detailsY + 50)
            .text("Status: PAID", 330, detailsY + 65);

        const tableTop = 260;
        doc.rect(50, tableTop, 500, 25).fill(primaryColor);

        doc.fillColor("#FFFFFF")
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("PRODUCT", 60, tableTop + 8)
            .text("QTY", 200, tableTop + 8)
            .text("RATE", 260, tableTop + 8)
            .text("COMM %", 320, tableTop + 8)
            .text("COMM AMOUNT", 380, tableTop + 8)
            .text("TOTAL", 460, tableTop + 8, { align: "right" });

        let currentY = tableTop + 25;

        bill.items.forEach((item, i) => {
            const bg = i % 2 === 0 ? "#FFFFFF" : "#F8FFF8";

            const qty = Number(item.quantity);
            const rate = Number(item.rate);
            const itemAmount = Number(item.itemAmount ?? qty * rate);
            const commissionPercent = Number(item.commissionPercent ?? 0);
            const commissionAmount = Number(item.commissionAmount ?? (itemAmount * commissionPercent) / 100);
            const lineTotal = Number(item.lineTotal ?? itemAmount + commissionAmount);

            doc.rect(50, currentY, 500, 25).fill(bg).stroke(borderColor);

            doc.fillColor(textColor)
                .fontSize(9)
                .text(item.productName, 60, currentY + 8)
                .text(`${qty}`, 200, currentY + 8)
                .text(formatCurrency(rate), 260, currentY + 8)
                .text(`${commissionPercent}%`, 320, currentY + 8)
                .text(formatCurrency(commissionAmount), 380, currentY + 8)
                .text(formatCurrency(lineTotal), 460, currentY + 8, { width: 80, align: "right" });

            currentY += 25;
        });

        let curY = currentY + 20;

        doc.fillColor(textColor)
            .fontSize(10)
            .text("Product Amount:", totalsX, curY)
            .text(formatCurrency(itemsTotal), valueX, curY, { align: "right" });

        curY += 15;

        doc.text("Total Commission:", totalsX, curY)
            .text(formatCurrency(totalCommission), valueX, curY, { align: "right" });

        curY += 15;

        if (bill.discountPercent > 0) {
            const disAmt = (itemsTotal + totalCommission) * (bill.discountPercent / 100);
            doc.text(`Discount (${bill.discountPercent}%):`, totalsX, curY)
                .text(`-${formatCurrency(disAmt)}`, valueX, curY, { align: "right" });
            curY += 15;
        }

        doc.fillColor(primaryColor)
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("TOTAL AMOUNT:", totalsX, curY)
            .text(formatCurrency(finalAmount), valueX, curY, { align: "right" });

        doc.fillColor("#CCCCCC")
            .moveTo(50, curY + 40)
            .lineTo(550, curY + 40)
            .stroke();

        doc.fillColor(textColor)
            .fontSize(8)
            .text("Thank you for your business!", 50, curY + 50, { align: "center" })
            .text("This is a computer generated invoice.", 50, curY + 65, { align: "center" });

        doc.end();

    } catch (err) {
        console.error("PDF Generation Error:", err);
        doc.text("PDF Error: " + err.message);
        doc.end();
    }
};

/* ======================================================================
   CREATE BILL
====================================================================== */
exports.createBill = async (req, res) => {
    try {
        const { customerName, items, discountPercent = 0 } = req.body;

        if (!customerName || !items || items.length === 0) {
            return res.status(400).json({ message: "customerName & items required" });
        }

        let totalBaseAmount = 0;
        let totalCommissionAmount = 0;
        const billItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Stock insufficient for ${product.name}`
                });
            }

            const qty = Number(item.quantity);
            const rate = Number(product.rate);
            const baseAmount = qty * rate;

            const commissionPercent =
                item.commissionPercent ?? product.commissionPercent ?? 3;

            const commissionAmount = (baseAmount * commissionPercent) / 100;

            totalBaseAmount += baseAmount;
            totalCommissionAmount += commissionAmount;

            billItems.push({
                productId: product._id,
                productName: product.name,
                quantity: qty,
                rate: rate,
                dealerName: item.dealerName || "N/A",
                commissionPercent,
                commissionAmount,
                itemAmount: baseAmount,
                lineTotal: baseAmount + commissionAmount
            });

            product.quantity -= qty;
            await product.save();
        }

        let finalAmount = totalBaseAmount + totalCommissionAmount;

        if (discountPercent > 0) {
            finalAmount = finalAmount * (1 - discountPercent / 100);
        }

        const newBill = new Bill({
            customerName,
            items: billItems,
            totalAmount: Math.round(finalAmount),
            discountPercent,
            totalCommission: totalCommissionAmount
        });

        await newBill.save();

        res.status(201).json(newBill);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Bill creation error",
            error: err.message
        });
    }
};

/* ======================================================================
   GET BILL PDF
====================================================================== */
exports.getBillPdf = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        if (!bill) return res.status(404).json({ message: "Bill not found" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=bill-${bill._id}.pdf`);

        const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 } });
        doc.pipe(res);
        generateProfessionalPdf(doc, bill);

    } catch (err) {
        res.status(500).json({ message: "PDF generation failed", error: err.message });
    }
};

/* ======================================================================
   GET BILL BY ID
====================================================================== */
exports.getBillById = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        if (!bill) return res.status(404).json({ message: "Bill not found" });

        const pdfUrl = `${req.protocol}://${req.get("host")}/api/bills/${bill._id}/pdf`;

        res.json({ ...bill.toObject(), pdfDownloadLink: pdfUrl });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

/* ======================================================================
   GET ALL BILLS (simple)
====================================================================== */
exports.getAllBills = async (req, res) => {
    try {
        const bills = await Bill.find().sort({ createdAt: -1 });
        res.json(bills);

    } catch (err) {
        res.status(500).json({ message: "Error loading bills" });
    }
};

/* ======================================================================
   DELETE BILL
====================================================================== */
exports.deleteBill = async (req, res) => {
    try {
        await Bill.findByIdAndDelete(req.params.id);
        res.json({ message: "Bill deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
};

/* ======================================================================
   GET UNIQUE DEALERS
====================================================================== */
exports.getUniqueDealers = async (req, res) => {
    try {
        const bills = await Bill.find();
        const dealerSet = new Set();
        
        bills.forEach(bill => {
            bill.items.forEach(item => {
                if (item.dealerName && item.dealerName !== "N/A") {
                    dealerSet.add(item.dealerName);
                }
            });
        });
        
        const dealers = Array.from(dealerSet).sort();
        
        res.json({
            success: true,
            dealers: dealers
        });
        
    } catch (err) {
        console.error("Error fetching dealers:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching dealers",
            error: err.message
        });
    }
};

/* ======================================================================
   FILTER + SEARCH + PAGINATION (FULL FEATURE) - UPDATED WITH DEALER FILTER
====================================================================== */
exports.getFilteredBills = async (req, res) => {
    try {
        let {
            customer,
            dealer,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = req.query;

        page = Number(page);
        limit = Number(limit);

        const query = {};

        // Customer filter
        if (customer && customer.trim() !== "") {
            query.customerName = { $regex: customer, $options: "i" };
        }

        // Dealer filter - NEW
        if (dealer && dealer.trim() !== "") {
            query["items.dealerName"] = { $regex: dealer, $options: "i" };
        }

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate + "T23:59:59");
        }

        // General search
        if (search && search.trim() !== "") {
            const term = new RegExp(search, "i");
            query.$or = [
                { customerName: term },
                { "items.productName": term },
                { "items.dealerName": term } // Added dealer to search
            ];
        }

        const skip = (page - 1) * limit;

        const bills = await Bill.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Bill.countDocuments(query);

        const totalPages = Math.ceil(total / limit);
        const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

        res.json({
            success: true,
            total,
            page,
            limit,
            pages: totalPages,
            pageNumbers,
            data: bills
        });

    } catch (err) {
        console.error("Filter Error:", err);
        res.status(500).json({
            success: false,
            message: "Filtering failed",
            error: err.message
        });
    }
};