// routes/billRoutes.js
const express = require('express');
const router = express.Router();

const {
    createBill,
    getAllBills,
    getBillById,
    deleteBill,
    getBillPdf,
    getFilteredBills,
    getUniqueDealers  // NEW
} = require("../controllers/billController");

// CREATE BILL
router.post('/', createBill);

// GET ALL BILLS
router.get('/', getAllBills);

// GET UNIQUE DEALERS - NEW
router.get('/dealers', getUniqueDealers);

// FILTER + SEARCH + PAGINATION
router.get('/filter', getFilteredBills);

// GET BILL BY ID
router.get('/:id', getBillById);

// GET PDF
router.get('/:id/pdf', getBillPdf);

// DELETE BILL
router.delete('/:id', deleteBill);

module.exports = router;