const express = require("express");
const {
  getAllDealers,
  getDealersByEmployee,
  createDealer,
  updateDealer,
  deleteDealer,
} = require("../controllers/dealerController");

const router = express.Router();

// GET all dealers
router.get("/", getAllDealers);

// GET dealers by employeeId
router.get("/:employeeId", getDealersByEmployee);

// CREATE dealer
router.post("/", createDealer);

// UPDATE dealer
router.put("/:id", updateDealer);

// DELETE dealer
router.delete("/:id", deleteDealer);

module.exports = router;
