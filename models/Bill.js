const mongoose = require('mongoose');

const BillItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  productName: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  rate: { 
    type: Number, 
    required: true,
    min: 0
  },
  itemAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  commissionPercent: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  commissionAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  lineTotal: { 
    type: Number, 
    required: true,
    min: 0
  }
}, { 
  _id: false,
  timestamps: false 
});

const CustomerSectionSchema = new mongoose.Schema({
  customerName: { 
    type: String, 
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  items: { 
    type: [BillItemSchema], 
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Each customer must have at least one item'
    }
  },
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  }
}, { 
  _id: false,
  timestamps: false 
});

const BillSchema = new mongoose.Schema({
  billNumber: { 
    type: String, 
    unique: true,
    index: true
  },
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: [true, 'Employee ID is required'] 
  },
  employeeName: { 
    type: String, 
    required: [true, 'Employee name is required'] 
  },
  customers: { 
    type: [CustomerSectionSchema], 
    required: true,
    validate: {
      validator: function(customers) {
        return customers && customers.length > 0 && customers.length <= 10;
      },
      message: 'Bill must have between 1 and 10 customers'
    }
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalCommission: { 
    type: Number, 
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0
  },
  discountPercent: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'cancelled'],
    default: 'completed'
  }
}, { 
  timestamps: true 
});

// Indexes for better performance
BillSchema.index({ employeeId: 1, createdAt: -1 });
BillSchema.index({ createdAt: -1 });
BillSchema.index({ billNumber: 1 });

// ✅ FIXED: Generate bill number and calculate totals
BillSchema.pre('save', async function(next) {
  try {
    // Generate bill number if not exists
    if (!this.billNumber) {
      const count = await mongoose.model('Bill').countDocuments();
      this.billNumber = `AGR-${String(count + 1).padStart(6, '0')}`;
    }
    
    // Calculate customer subtotals and overall totals
    let totalAmount = 0;
    let totalCommission = 0;
    let totalItems = 0;
    
    this.customers.forEach(customer => {
      let customerSubtotal = 0;
      let customerCommission = 0;
      let customerItems = 0;
      
      customer.items.forEach(item => {
        customerSubtotal += item.lineTotal;
        customerCommission += item.commissionAmount;
        customerItems += item.quantity;
      });
      
      customer.subtotal = parseFloat(customerSubtotal.toFixed(2));
      totalAmount += customerSubtotal;
      totalCommission += customerCommission;
      totalItems += customerItems;
    });
    
    this.totalAmount = parseFloat(totalAmount.toFixed(2));
    this.totalCommission = parseFloat(totalCommission.toFixed(2));
    this.totalItems = totalItems;
    this.discountAmount = parseFloat(((totalAmount * this.discountPercent) / 100).toFixed(2));
    this.finalAmount = parseFloat((totalAmount - this.discountAmount).toFixed(2));
    
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for formatted date
BillSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
});

// Instance method to get summary
BillSchema.methods.getSummary = function() {
  return {
    billNumber: this.billNumber,
    totalCustomers: this.customers.length,
    totalItems: this.totalItems,
    totalAmount: this.totalAmount,
    finalAmount: this.finalAmount,
    date: this.formattedDate
  };
};

module.exports = mongoose.model('Bill', BillSchema);