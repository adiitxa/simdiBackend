const Employee = require('../models/Employee');

// GET ALL EMPLOYEES
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: employees
    });
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching employees' 
    });
  }
};

// GET SINGLE EMPLOYEE
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }
    res.json({
      success: true,
      data: employee
    });
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching employee' 
    });
  }
};

// CREATE EMPLOYEE
exports.createEmployee = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Employee name is required' 
      });
    }

    // Check if employee already exists (including inactive ones for permanent deletion)
    const existingEmployee = await Employee.findOne({ 
      name: name.trim()
    });
    
    if (existingEmployee && existingEmployee.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Employee with this name already exists' 
      });
    }

    // If employee exists but is inactive, reactivate it
    if (existingEmployee && !existingEmployee.isActive) {
      existingEmployee.isActive = true;
      await existingEmployee.save();
      return res.json({
        success: true,
        message: 'Employee reactivated successfully',
        data: existingEmployee
      });
    }

    const employee = new Employee({
      name: name.trim()
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating employee',
      error: err.message 
    });
  }
};

// UPDATE EMPLOYEE
exports.updateEmployee = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Employee name is required' 
      });
    }

    // Check if name already exists (excluding current employee)
    const existingEmployee = await Employee.findOne({ 
      name: name.trim(),
      _id: { $ne: req.params.id },
      isActive: true 
    });
    
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false,
        message: 'Employee with this name already exists' 
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id, 
      { name: name.trim() }, 
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating employee',
      error: err.message 
    });
  }
};

// DELETE EMPLOYEE (PERMANENT DELETE - COMPLETELY FROM DATABASE)
exports.deleteEmployee = async (req, res) => {
  try {
    console.log('🔴 PERMANENTLY DELETING employee ID:', req.params.id);
    
    // OPTION 1: PERMANENT DELETE (Recommended) - Remove from database completely
    const employee = await Employee.findByIdAndDelete(req.params.id);

    // OPTION 2: If you want to keep the record but mark as inactive, use this:
    // const employee = await Employee.findByIdAndUpdate(
    //   req.params.id,
    //   { isActive: false },
    //   { new: true }
    // );

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    console.log('✅ Employee PERMANENTLY deleted from database:', employee.name);
    
    res.json({
      success: true,
      message: 'Employee permanently deleted successfully'
    });
  } catch (err) {
    console.error('❌ Delete employee error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting employee',
      error: err.message 
    });
  }
};