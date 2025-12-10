const express = require('express');
const router = express.Router();

const {
    createBill,
    getAllBills,
    getBillById,
    deleteBill,
    getBillPdf,
    getFilteredBills,
    getUniqueDealers,
    getBillsByEmployee
} = require("../controllers/billController");

// ✅ FIX: Add debug logging for each route
router.use((req, res, next) => {
    console.log('🧾 Bill Route Hit:', {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
    next();
});

// CREATE BILL - MAIN ENDPOINT
router.post('/', createBill);

// GET ALL BILLS
router.get('/', getAllBills);

// GET UNIQUE DEALERS
router.get('/dealers', getUniqueDealers);

// FILTER + SEARCH + PAGINATION
router.get('/filter', getFilteredBills);

// GET BILLS BY EMPLOYEE
router.get('/employee/:employeeId', getBillsByEmployee);

// GET BILL BY ID
router.get('/:id', getBillById);

// GET PDF
router.get('/:id/pdf', getBillPdf);

// DELETE BILL
router.delete('/:id', deleteBill);

module.exports = router;