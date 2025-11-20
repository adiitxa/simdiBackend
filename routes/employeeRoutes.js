const express = require('express');
const router = express.Router();
const employeeCtrl = require('../controllers/employeeController');

// GET ALL EMPLOYEES
router.get('/', employeeCtrl.getEmployees);

// GET SINGLE EMPLOYEE
router.get('/:id', employeeCtrl.getEmployee);

// CREATE EMPLOYEE
router.post('/', employeeCtrl.createEmployee);

// UPDATE EMPLOYEE
router.put('/:id', employeeCtrl.updateEmployee);

// DELETE EMPLOYEE
router.delete('/:id', employeeCtrl.deleteEmployee);

module.exports = router;