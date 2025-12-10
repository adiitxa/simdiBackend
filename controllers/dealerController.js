const Dealer = require("../models/Dealer");

// ===========================
// GET all dealers (admin use)
// ===========================
exports.getAllDealers = async (req, res) => {
  try {
    const dealers = await Dealer.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: dealers.length,
      dealers,
    });
  } catch (err) {
    console.error("Error fetching all dealers:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===========================
// GET all dealers of employee
// ===========================
exports.getDealersByEmployee = async (req, res) => {
  try {
    const dealers = await Dealer.find({
      employeeId: req.params.employeeId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, dealers });
  } catch (err) {
    console.error("Error fetching dealers:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===========================
// CREATE dealer
// ===========================
exports.createDealer = async (req, res) => {
  try {
    const { name, employeeId } = req.body;

    if (!name || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "name and employeeId are required",
      });
    }

    const dealer = await Dealer.create({ name, employeeId });

    res.json({ success: true, dealer });
  } catch (err) {
    console.error("Error creating dealer:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===========================
// UPDATE dealer
// ===========================
exports.updateDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );

    res.json({ success: true, dealer });
  } catch (err) {
    console.error("Error updating dealer:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===========================
// DELETE dealer
// ===========================
exports.deleteDealer = async (req, res) => {
  try {
    await Dealer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Dealer deleted" });
  } catch (err) {
    console.error("Error deleting dealer:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
