// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// MongoDB Models
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});

const ImageSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  basePrice: { type: Number, required: true },
  templates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  description: String,
  customizationOptions: {
    allowCustomImage: { type: Boolean, default: true },
    allowCustomText: { type: Boolean, default: true }
  }
});

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    customization: {
      template: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
      customImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
      customText: String,
      preview: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' }
    }
  }],
  totalAmount: Number,
  status: { type: String, default: 'pending' },
  paymentMethod: String,
  createdAt: { type: Date, default: Date.now }
});


const CartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      customization: {
        customText: String,
        customImage: String,
        preview: String
      }
    }]
});
  

const Cart = mongoose.model('Cart', CartSchema);
const User = mongoose.model("User", UserSchema);
const Image = mongoose.model("Image", ImageSchema);
const Product = mongoose.model("Product", ProductSchema);
const Order = mongoose.model("Order", OrderSchema);

// Middleware for authentication
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate" });
  }
};

// File upload configuration
const upload = multer({
  limits: {
    fileSize: 5000000 // 5MB limit
  }
});

// API Routes
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, phone, adminCode } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = adminCode === process.env.ADMIN_CODE;

    const user = new User({ email, password: hashedPassword, phone, isAdmin });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid login credentials");
    }
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Product routes
app.post("/api/products", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can create products" });
    }

    const { name, category, basePrice, description, templates } = req.body;
    
    // Save templates as Image documents
    const templateIds = [];
    for (const template of templates) {
      const { buffer, contentType } = base64ToBuffer(template);
      const image = new Image({ data: buffer, contentType });
      await image.save();
      templateIds.push(image._id);
    }

    const product = new Product({
      name,
      category,
      basePrice,
      description,
      templates: templateIds
    });
    
    await product.save();
    res.status(201).send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Helper function to convert base64 to Buffer
const base64ToBuffer = (base64) => {
  const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }
  return {
    contentType: matches[1],
    buffer: Buffer.from(matches[2], 'base64')
  };
};

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().populate('templates');
    // Convert Buffer to base64 for sending to client
    const productsWithImages = products.map(product => {
      const templates = product.templates.map(template => {
        return {
          _id: template._id,
          data: `data:${template.contentType};base64,${template.data.toString('base64')}`
        };
      });
      return {
        ...product.toObject(),
        templates
      };
    });
    res.send(productsWithImages);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Order routes
app.post("/api/orders", auth, async (req, res) => {
  try {
    const { products, totalAmount, paymentMethod, customizations } = req.body;
    
    const order = new Order({
      user: req.user._id,
      products,
      totalAmount,
      paymentMethod
    });

    await order.save();
    res.status(201).send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Payment routes
app.post("/api/create-payment-intent", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd"
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).send(error);
  }
});



// Add this route to your server.js
app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).populate('templates');
      if (!product) {
        return res.status(404).send({ error: 'Product not found' });
      }
      
      const templates = product.templates.map(template => ({
        _id: template._id,
        data: `data:${template.contentType};base64,${template.data.toString('base64')}`
      }));
  
      res.send({
        ...product.toObject(),
        templates
      });
    } catch (error) {
      res.status(500).send(error);
    }
  });




// Cart routes
app.get('/api/cart', auth, async (req, res) => {
    try {
      let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
        await cart.save();
      }
      res.send(cart);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  
  app.post('/api/cart/add', auth, async (req, res) => {
    try {
      const { product, quantity, customization } = req.body;
      let cart = await Cart.findOne({ user: req.user._id });
      
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }
      
      cart.items.push({ product, quantity, customization });
      await cart.save();
      res.send(cart);
    } catch (error) {
      res.status(400).send(error);
    }
  });
  
  app.delete('/api/cart/:index', auth, async (req, res) => {
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      cart.items.splice(req.params.index, 1);
      await cart.save();
      res.send(cart);
    } catch (error) {
      res.status(400).send(error);
    }
  });
  
  app.delete('/api/cart', auth, async (req, res) => {
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      cart.items = [];
      await cart.save();
      res.send(cart);
    } catch (error) {
      res.status(400).send(error);
    }
  });

// Add these routes to server.js

// Profile routes
// app.put("/api/users/profile", auth, async (req, res) => {
//   try {
//     const { email, phone, currentPassword, newPassword } = req.body;
//     const user = await User.findById(req.user._id);

//     if (currentPassword && newPassword) {
//       const isMatch = await bcrypt.compare(currentPassword, user.password);
//       if (!isMatch) {
//         return res.status(400).send({ error: "Current password is incorrect" });
//       }
//       user.password = await bcrypt.hash(newPassword, 10);
//     }

//     user.email = email || user.email;
//     user.phone = phone || user.phone;
//     await user.save();

//     const token = jwt.sign(
//       { userId: user._id, isAdmin: user.isAdmin },
//       process.env.JWT_SECRET
//     );

//     res.send({ user, token });
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });
// Add to server.js
app.put("/api/users/profile", auth, async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email || !phone) {
      return res.status(400).send({ error: 'Email and phone are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { email, phone },
      { new: true }
    );

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});



// Order routes
app.get("/api/orders", auth, async (req, res) => {
  try {
    let orders;
    if (req.user.isAdmin) {
      orders = await Order.find()
        .populate('user')
        .populate('products.product')
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ user: req.user._id })
        .populate('products.product')
        .sort({ createdAt: -1 });
    }
    res.send(orders);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/api/orders/:id/download", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .populate('products.product');

    if (!order) {
      return res.status(404).send({ error: 'Order not found' });
    }

    if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Not authorized' });
    }

    // Generate PDF report
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-${order._id}.pdf`);

    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Order Details', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Customer: ${order.user.email}`);
    doc.text(`Total Amount: $${order.totalAmount.toFixed(2)}`);
    
    doc.moveDown();
    doc.text('Products:', { underline: true });
    
    order.products.forEach(item => {
      doc.moveDown();
      doc.text(`Product: ${item.product.name}`);
      doc.text(`Quantity: ${item.quantity}`);
      if (item.customization?.customText) {
        doc.text(`Custom Text: ${item.customization.customText}`);
      }
      if (item.customization?.description) {
        doc.text(`Description: ${item.customization.description}`);
      }
    });

    doc.end();
  } catch (error) {
    res.status(500).send(error);
  }
});






// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    // Start the server after successful database connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if database connection fails
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});