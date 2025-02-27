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
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const crypto = require ("crypto");
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const cron = require('node-cron');




const twilioClient = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

app.set('trust proxy', true);


const uploadDir = path.join(__dirname, 'upload');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, 'upload')); // Save files to backend/upload folder
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    // Use a timestamp and the field name in the filename
    const filename = `${Date.now()}_${file.fieldname}${ext}`;
    cb(null, filename);
  }
});

// const upload = multer({ storage: storage, limits: { fileSize: 50000000 } });
const uploadLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: 'Too many upload attempts, please try again later'
});

// Add this image validation middleware
const validateImage = (req, file, cb) => {
  // Allowed mime types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Update your existing upload configuration to include the file filter
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50000000 }, // keeping your existing 50MB limit
  fileFilter: validateImage
});

// Rate limiting to prevent spam
const contactLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day (24 * 60 mins)
  max: 2, // limit each IP to 5 requests per windowMs
  message: 'Too many contact attempts, please try again later'
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use service instead of host/port
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
  // host: 'smtp.gmail.com', // Replace with your SMTP host
  // port: 587,
  // secure: false, // Use TLS
  // auth: {
  //   user: process.env.EMAIL_USER, // Your email
  //   pass: process.env.EMAIL_PASS  // App password or generated credentials
  // }
});

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



// MongoDB Models
// const NotificationSchema = new mongoose.Schema({
//   user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
//   message: {type: String, required: true},
//   type: {
//     type: String,
//     enum: ['order', 'inventory', 'feedback', 'system'],
//     required: true
//   },
//   isRead: {type: Boolean, default: false},
//   link: String,
//   createdAt: {type: Date, default: Date.now}
// });
const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // New field for the creator
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['order', 'inventory', 'feedback', 'system'],
    required: true
  },
  isRead: { type: Boolean, default: false },
  link: String,
  active: { type: Boolean, default: true },
  global: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ProductNotificationSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // if logged in
  email: { type: String },
  phone: { type: String },
  notified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ClientNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const LoginActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ipAddress: { type: String },
  location: { type: String },
  device: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  company: { type: String, trim: true },
  addresses: [
    {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, default: 'Canada', trim: true }
    }
  ],
  defaultAddress: { type: mongoose.Schema.Types.ObjectId, ref: "User.addresses" }, // Reference to default address
  isAdmin: { type: Boolean, default: false },
  preferences: {
    newsletter: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false }
  },
  lastLogin: { type: Date },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});


// Update timestamp on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add method to safely return user data without sensitive information
UserSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

const ImageSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true }
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  image: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
  createdAt: { type: Date, default: Date.now }
});

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true},
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  elements: { type: Object, required: true },
  preview: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  maxUsesPerUser: { type: Number, default: 0 }, 
  userUsage: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usageCount: { type: Number, default: 0 }
  }],
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  basePrice: { type: Number, required: true },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  description: String,
  createdAt: { type: Date, default: Date.now },
  hasGST: { type: Boolean, default: false },
  hasPST: { type: Boolean, default: false },
  customizationOptions: {
    allowCustomImage: { type: Boolean, default: true },
    allowCustomText: { type: Boolean, default: true }
  },
  isFeatured: { type: Boolean, default: false },
  inStock: { type: Boolean, default: true },
  minimumOrder: { type: Number, default: 1 },
  sku: { type: String },
  pricingTiers: [{
    minQuantity: { type: Number, required: true },
    maxQuantity: { type: Number },
    price: { type: Number, required: true }
  }],
  weight: { type: Number }, // in grams
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number }
  },
  metadata: {
    keywords: [String],
    searchTags: [String]
  }
});

const customFieldSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  type: { type: String, required: true },
  imageUrl: {type: String, default: null},
  content: { type: String, required: true },
  properties: {
    fontSize: { type: Number, default: null },
    fontFamily: { type: String, default: null },
    fill: { type: String, default: null },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    },
    scale: {
      x: { type: Number, default: 1 },
      y: { type: Number, default: 1 }
    }
  }
}, { _id: false });

const requiredFieldSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  type: { type: String, required: true },
  imageUrl: {type: String, default: null},
  value: { type: String, required: true }
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  customization: {
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      default: null
    },
    preview: { type: String, default: null },
    description: { type: String, default: '' },
    customFields: [customFieldSchema],
    requiredFields: [requiredFieldSchema]
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema]
}, { timestamps: true });

// Add indexes for better performance
// cartSchema.index({ user: 1 });
// cartSchema.index({ 'items.product': 1 });

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  customization: {
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      default: null
    },
    preview: { type: String, default: null },
    description: { type: String, default: '' },
    customFields: [customFieldSchema],
    requiredFields: [requiredFieldSchema]
  }
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  coupon: {
    code: { type: String },
    discountAmount: { type: Number },
    discountType: { 
      type: String, 
      enum: ['percentage', 'fixed'] 
    },
    discountValue: { type: Number }
  }
});

const uploadSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  width: Number,
  height: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  uploadedBy: String,
  sessionId: String,
  inCart: {
    type: Boolean,
    default: false
  },
  inOrder: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add index for better search performance
uploadSchema.index({ originalName: 'text', uploadedBy: 'text' });
uploadSchema.index({ createdAt: -1 });
uploadSchema.index({ userId: 1 });
uploadSchema.index({ inCart: 1 });
uploadSchema.index({ inOrder: 1 });

const Upload = mongoose.model('Upload', uploadSchema);

const Category = mongoose.model('Category', CategorySchema);
const Template = mongoose.model('Template', TemplateSchema);
const Cart = mongoose.model('Cart', cartSchema);
const User = mongoose.model("User", UserSchema);
const Image = mongoose.model("Image", ImageSchema);
const Product = mongoose.model("Product", ProductSchema);
const Order = mongoose.model("Order", OrderSchema);
const Coupon = mongoose.model('Coupon', CouponSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
// const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
const LoginActivity = mongoose.model('LoginActivity', LoginActivitySchema);
const ProductNotification = mongoose.model('ProductNotification', ProductNotificationSchema);
const ClientNote = mongoose.model('ClientNote', ClientNoteSchema);


// API Routes


//heleper functions for register email & sms
// Function to send welcome email
const sendWelcomeEmail = async (user) => {
  const emailHtml = `
    <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Bag&Box</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            background-color: #4a6ee0;
            padding: 30px 20px;
            text-align: center;
          }
          .header img {
            max-width: 180px;
          }
          .content {
            padding: 30px 20px;
            background-color: #ffffff;
          }
          .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            background-color: #f5f5f5;
          }
          h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
          }
          .button {
            display: inline-block;
            background-color: #4a6ee0;
            color: #ffffff !important; /* Force white text color */
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 4px;
            margin-top: 20px;
            font-weight: bold;
            transition: all 0.3s ease; /* Smooth transition for hover effects */
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          /* Since email clients may not support hover, we're adding it just in case */
          .button:hover {
            background-color: #3a5bc0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            transform: translateY(-2px);
          }
          .greeting {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Bag&Box</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello ${user.firstName},</p>
            <p>Thank you for creating an account with us. We're excited to have you join our community!</p>
            <p>With your new account, you can:</p>
            <ul>
              <li>Browse our extensive product catalog</li>
              <li>Save your favorite items</li>
              <li>Track your orders easily</li>
              <li>Access exclusive promotions</li>
            </ul>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <div style="text-align: center;">
              <a href="${process.env.WEBSITE_URL}" class="button">Visit Our Website</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Bag&Box. All rights reserved.</p>
            <p>02-1127 14th St W, North Vancouver, BC, V7P 1J9</p>
          </div>
        </div>
      </body>
      </html>
  `;

  const mailOptions = {
    from: `"Bag&Box" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Welcome to Bag&Box, ${user.firstName}!`,
    html: emailHtml
  };

  return transporter.sendMail(mailOptions);
};

// Function to send welcome SMS
const sendWelcomeSMS = async (user) => {
  const message = `Hi ${user.firstName}! Welcome to Bag&Box. Thank you for creating an account with us. If you have any questions, please contact our support team.`;
  
  return twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: user.phone
  });
};

//register endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { 
      email, 
      password, 
      phone, 
      adminCode, 
      firstName, 
      lastName,
      addresses, // Changed from address to addresses
      company 
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).send({ 
        error: 'Email address is already registered. Please use a different email or try logging in.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = adminCode === process.env.ADMIN_CODE;

    // Create user object with addresses array
    const userData = { 
      email: email.toLowerCase(),
      password: hashedPassword, 
      phone, 
      isAdmin,
      firstName,
      lastName,
      company: company || '',
      addresses: [] // Initialize empty addresses array
    };

    // Add addresses if provided
    if (addresses && Array.isArray(addresses) && addresses.length > 0) {
      userData.addresses = addresses.map(addr => ({
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postalCode || '',
        country: addr.country || 'Canada'
      }));
    }

    const user = new User(userData);
    await user.save();

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    try {
      sendWelcomeEmail(userResponse)
        .catch(err => console.error('Error sending welcome email:', err));
      
      // Only send SMS if a valid phone number is provided
      if (phone && phone.trim()) {
        sendWelcomeSMS(userResponse)
          .catch(err => console.error('Error sending welcome SMS:', err));
      }
    } catch (messageError) {
      // Log the error but don't fail registration
      console.error('Error sending welcome messages:', messageError);
    }

    res.status(201).send({ user: userResponse, token });
  } catch (error) {
    console.error('Registration error:', error); // Add logging
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).send({ 
        error: 'Email address is already registered. Please use a different email or try logging in.'
      });
    }
    res.status(400).send({ error: 'Registration failed. Please try again.' });
  }
});

// app.post("/api/login", async (req, res) => {
//   try {
//     const { identifier, password } = req.body; // identifier can be email or phone
    
//     // Find user by email or phone
//     const user = await User.findOne({
//       $or: [
//         { email: identifier },
//         { phone: identifier }
//       ]
//     });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       throw new Error("Invalid login credentials");
//     }

//     const token = jwt.sign(
//       { userId: user._id, isAdmin: user.isAdmin },
//       process.env.JWT_SECRET
//     );
//     res.send({ user, token });
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user && !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid login credentials");
    }  

    // Track login activity
    const loginActivity = new LoginActivity({
      user: user._id,
      ipAddress: req.ip,
      location: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      device: req.headers['user-agent']
    });
    await loginActivity.save();

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});



// Forgot Password Endpoint
app.post("/api/forgot-password", async (req, res) => {
  const { identifier } = req.body;
  try {
    const user = await User.findOne({ 
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });
    
    // Always respond with the same message to avoid user enumeration
    if (!user) {
      return res.status(200).send({
        message: "If that account exists, a password reset link or code has been sent."
      });
    }
    
    // Generate a reset token and set its expiry (e.g., 1 hour)
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour in ms
    await user.save();

    // Send reset instructions via email if the identifier is an email
    if (user.email === identifier) {
      // Use your CLIENT_URL environment variable for the frontend URL
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

      const mailOptions = {
        to: user.email,
        from: process.env.SMTP_USER,
        subject: 'Password Reset',
        text: `You are receiving this email because you (or someone else) have requested to reset your password.\n\n
        Please click on the following link, or paste it into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email.\n`
      };
      await transporter.sendMail(mailOptions);
    } else if (user.phone === identifier) {
      const smsMessage = `Reset your password using this link:\n
      /reset-password/${resetToken}`;
      
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require('twilio')(accountSid, authToken);
      
      await client.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone
      });
    }
    res.status(200).send({
      message: "If that account exists, a password reset link or code has been sent."
    });
  } catch (error) {
    res.status(500).send({ error: "Server error" });
  }
});

// Reset Password Endpoint
app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({ 
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).send({ error: "Password reset token is invalid or has expired." });
    }
    // Hash the new password and update the user record
    user.password = await bcrypt.hash(newPassword, 10);
    // Clear reset token and expiry
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).send({ message: "Password has been reset successfully." });
  } catch (error) {
    res.status(500).send({ error: "Server error" });
  }
});


//Proudct routs
// Lightweight product data without images
app.get("/api/products/basic", async (req, res) => {
  try {
    const products = await Product.find()
      .select('_id name description basePrice category isFeatured inStock minimumOrder') 
      .populate('category', 'name')
      .sort('-createdAt');

    res.send(products);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get single product image
app.get("/api/products/:id/image", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('images')
      .select('images');
    
    if (!product || !product.images || !product.images[0]) {
      return res.status(404).send({ error: 'Image not found' });
    }

    const image = product.images[0];
    res.send({
      _id: image._id,
      data: `data:${image.contentType};base64,${image.data.toString('base64')}`
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/api/products", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can create products" });
    }

    const { 
      name, category, basePrice, description, images, hasGST, hasPST,
      // New fields
      isFeatured, inStock, minimumOrder, sku, pricingTiers, 
      weight, dimensions, metadata
    } = req.body;
    
    // Save images as Image documents
    const imageIds = [];
    for (const image of images) {
      const { buffer, contentType } = base64ToBuffer(image);
      const newImage = new Image({ data: buffer, contentType });
      await newImage.save();
      imageIds.push(newImage._id);
    }

    const product = new Product({
      name,
      category,
      basePrice,
      description,
      images: imageIds,
      hasGST,
      hasPST,
      // New fields
      isFeatured: isFeatured || false,
      inStock: inStock ?? true,
      minimumOrder: minimumOrder || 1,
      sku,
      pricingTiers: pricingTiers || [],
      weight,
      dimensions,
      metadata: {
        keywords: metadata?.keywords || [],
        searchTags: metadata?.searchTags || []
      },
      createdAt: new Date()
    });
    
    await product.save();
    res.status(201).send(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).send({
      error: 'Error creating product',
      details: error.message
    });
  }
});

// app.put("/api/products/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can update products" });
//     }

//     const existingProduct = await Product.findById(req.params.id);
//     if (!existingProduct) {
//       return res.status(404).send({ error: 'Product not found' });
//     }

//     const { 
//       name, category, basePrice, description, images, hasGST, hasPST,
//       // New fields
//       isFeatured, inStock, minimumOrder, sku, pricingTiers,
//       weight, dimensions, metadata
//     } = req.body;

//     // Handle image updates
//     let updatedImageIds = [...existingProduct.images];
//     if (images && Array.isArray(images)) {
//       for (let i = 0; i < images.length; i++) {
//         const image = images[i];
//         if (image && image.startsWith('data:')) {
//           const { buffer, contentType } = base64ToBuffer(image);
//           if (i < updatedImageIds.length) {
//             await Image.findByIdAndUpdate(updatedImageIds[i], {
//               data: buffer,
//               contentType
//             });
//           } else {
//             const newImage = new Image({ data: buffer, contentType });
//             await newImage.save();
//             updatedImageIds.push(newImage._id);
//           }
//         }
//       }
//     }

//     // Prepare update object
//     const updateData = {
//       name,
//       category,
//       basePrice,
//       description,
//       hasGST,
//       hasPST,
//       images: updatedImageIds,
//       // New fields
//       isFeatured,
//       inStock,
//       minimumOrder,
//       sku,
//       pricingTiers,
//       weight,
//       dimensions,
//       metadata: {
//         keywords: metadata?.keywords || existingProduct.metadata?.keywords || [],
//         searchTags: metadata?.searchTags || existingProduct.metadata?.searchTags || []
//       }
//     };

//     const updatedProduct = await Product.findByIdAndUpdate(
//       req.params.id,
//       { $set: updateData },
//       { new: true }
//     ).populate('images').populate('category');

//     if (!updatedProduct) {
//       throw new Error('Failed to update product');
//     }

//     // Format response
//     const response = {
//       ...updatedProduct.toObject(),
//       images: updatedProduct.images.map(image => ({
//         _id: image._id,
//         data: `data:${image.contentType};base64,${image.data.toString('base64')}`
//       })),
//       category: updatedProduct.category ? {
//         _id: updatedProduct.category._id,
//         name: updatedProduct.category.name,
//         description: updatedProduct.category.description
//       } : null
//     };

//     res.json(response);
//   } catch (error) {
//     console.error('Error updating product:', error);
//     res.status(400).send({
//       error: 'Error updating product',
//       details: error.message
//     });
//   }
// });
app.put("/api/products/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can update products" });
    }

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).send({ error: 'Product not found' });
    }

    const { 
      name, category, basePrice, description, images, hasGST, hasPST,
      isFeatured, inStock, minimumOrder, sku, pricingTiers,
      weight, dimensions, metadata
    } = req.body;

    let updatedImageIds = [...existingProduct.images];
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image && image.startsWith('data:')) {
          const { buffer, contentType } = base64ToBuffer(image);
          if (i < updatedImageIds.length) {
            await Image.findByIdAndUpdate(updatedImageIds[i], {
              data: buffer,
              contentType
            });
          } else {
            const newImage = new Image({ data: buffer, contentType });
            await newImage.save();
            updatedImageIds.push(newImage._id);
          }
        }
      }
    }

    const updateData = {
      name,
      category,
      basePrice,
      description,
      hasGST,
      hasPST,
      images: updatedImageIds,
      isFeatured,
      inStock,
      minimumOrder,
      sku,
      pricingTiers,
      weight,
      dimensions,
      metadata: {
        keywords: metadata?.keywords || existingProduct.metadata?.keywords || [],
        searchTags: metadata?.searchTags || existingProduct.metadata?.searchTags || []
      }
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('images').populate('category');

    // NEW: If product was previously out-of-stock and now is in stock, send notifications.
    if (!existingProduct.inStock && updatedProduct.inStock) {
      const notifications = await ProductNotification.find({ product: req.params.id, notified: false });
      notifications.forEach(async (notification) => {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0056b3;">Good News!</h2>
            <p>The product <strong>${updatedProduct.name}</strong> is now back in stock.</p>
            <p>Visit our website to check it out: <a href="${process.env.CLIENT_URL}/customize/${updatedProduct._id}" style="color: #1a73e8;">Click here</a></p>
            <hr style="border: none; border-top: 1px solid #ccc;" />
            <p style="font-size: 12px; color: #777;">Thank you for choosing us.</p>
          </div>
        `;
        let smsMessage = `Good news! "${updatedProduct.name}" is now in stock. Visit ${process.env.CLIENT_URL}/customize/${updatedProduct._id} for details.`;
        if (notification.email) {
          await transporter.sendMail({
            to: notification.email,
            from: process.env.SMTP_USER,
            subject: 'Product Now Available',
            html: emailHtml
          });
        }
        if (notification.phone) {
          try {
            // Create message content
            const smsMessage = `Good news! "${updatedProduct.name}" is now back in stock. Visit our website for details.`;
            
            // Get Twilio credentials exactly as used in reset password
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const client = require('twilio')(accountSid, authToken);
            
            await client.messages.create({
              body: smsMessage,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: notification.phone
            });
            
            console.log(`SMS sent to ${notification.phone}`);
          } catch (smsError) {
            console.error(`SMS send error to ${notification.phone}:`, smsError);
          }
        }
        notification.notified = true;
        await notification.save();
      });
    }


    const response = {
      ...updatedProduct.toObject(),
      images: updatedProduct.images.map(image => ({
        _id: image._id,
        data: `data:${image.contentType};base64,${image.data.toString('base64')}`
      })),
      category: updatedProduct.category ? {
        _id: updatedProduct.category._id,
        name: updatedProduct.category.name,
        description: updatedProduct.category.description
      } : null
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).send({
      error: 'Error updating product',
      details: error.message
    });
  }
});


app.delete("/api/products/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can delete products" });
    }

    console.log('Attempting to delete product:', req.params.id); // Debug log

    // First check if the product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log('Product not found'); // Debug log
      return res.status(404).send({ error: 'Product not found' });
    }

    // Check if the product is used in any existing orders
    const ordersWithProduct = await Order.countDocuments({
      'products.product': req.params.id
    });

    if (ordersWithProduct > 0) {
      return res.status(400).send({ 
        error: `Cannot delete product. It is used in ${ordersWithProduct} existing order(s).`
      });
    }

    // Delete associated template images
    if (product.templates && product.templates.length > 0) {
      try {
        await Image.deleteMany({ _id: { $in: product.templates } });
        console.log('Associated images deleted'); // Debug log
      } catch (imageError) {
        console.error('Error deleting associated images:', imageError);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete the product
    const result = await Product.findByIdAndDelete(req.params.id);
    
    console.log('Product deletion result:', result); // Debug log

    res.send({ 
      message: 'Product deleted successfully',
      deletedProduct: product
    });
  } catch (error) {
    console.error('Error deleting product:', error); // Detailed server-side error log
    res.status(500).send({ 
      error: 'Error deleting product', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find()
      .populate('images')
      .populate('category')
      .sort('-createdAt');

    const productsWithImages = products.map(product => {
      const images = product.images.map(image => ({
        _id: image._id,
        data: `data:${image.contentType};base64,${image.data.toString('base64')}`
      }));

      return {
        ...product.toObject(),
        images,
        category: product.category ? {
          _id: product.category._id,
          name: product.category.name,
          description: product.category.description
        } : null
      };
    });

    res.send(productsWithImages);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send(error);
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('images')
      .populate('category');
      
    if (!product) {
      return res.status(404).send({ error: 'Product not found' });
    }
    
    // Format the product data
    const productWithImages = {
      ...product.toObject(),
      images: product.images.map(image => ({
        _id: image._id,
        data: `data:${image.contentType};base64,${image.data.toString('base64')}`
      })),
      category: product.category ? {
        _id: product.category._id,
        name: product.category.name,
        description: product.category.description
      } : null
    };

    res.send(productWithImages);
  } catch (error) {
    console.error('Error fetching product:', error);
    if (error.name === 'CastError') {
      return res.status(400).send({ error: 'Invalid product ID format' });
    }
    res.status(500).send({ error: 'Error fetching product' });
  }
});

// Category routes
// Lightweight category data without images
app.get("/api/categories/basic", async (req, res) => {
  try {
    const categories = await Category.find()
      .select('_id name description')
      .sort('-createdAt');
    
    res.send(categories);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get single category image
app.get("/api/categories/:id/image", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('image')
      .select('image');
    
    if (!category || !category.image) {
      return res.status(404).send({ error: 'Image not found' });
    }

    res.send({
      _id: category.image._id,
      data: `data:${category.image.contentType};base64,${category.image.data.toString('base64')}`
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/api/categories", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can create categories" });
    }

    const { name, description, image } = req.body;
    let imageId;

    if (image) {
      const { buffer, contentType } = base64ToBuffer(image);
      const newImage = new Image({ data: buffer, contentType });
      await newImage.save();
      imageId = newImage._id;
    }

    const category = new Category({
      name,
      description,
      image: imageId
    });

    await category.save();
    res.status(201).send(category);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find().populate('image');
    const categoriesWithImages = categories.map(category => {
      if (category.image) {
        return {
          ...category.toObject(),
          image: {
            _id: category.image._id,
            data: `data:${category.image.contentType};base64,${category.image.data.toString('base64')}`
          }
        };
      }
      return category.toObject();
    });
    res.send(categoriesWithImages);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.put("/api/categories/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can update categories" });
    }

    const { name, description, image } = req.body;
    const updateData = { name, description };

    if (image) {
      const { buffer, contentType } = base64ToBuffer(image);
      const newImage = new Image({ data: buffer, contentType });
      await newImage.save();
      updateData.image = newImage._id;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('image');

    if (!category) {
      return res.status(404).send({ error: 'Category not found' });
    }

    res.send(category);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.delete("/api/categories/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can delete categories" });
    }

    console.log('Attempting to delete category:', req.params.id); // Debug log

    // First check if the category exists
    const category = await Category.findById(req.params.id);
    if (!category) {
      console.log('Category not found'); // Debug log
      return res.status(404).send({ error: 'Category not found' });
    }

    // Check if any products are using this category
    const productsCount = await Product.countDocuments({ category: req.params.id });
    console.log('Products using this category:', productsCount); // Debug log

    if (productsCount > 0) {
      return res.status(400).send({ 
        error: `Cannot delete category. It is being used by ${productsCount} product(s). Please reassign or delete these products first.`
      });
    }

    // Delete associated image if exists
    if (category.image) {
      try {
        await Image.findByIdAndDelete(category.image);
        console.log('Associated image deleted'); // Debug log
      } catch (imageError) {
        console.error('Error deleting associated image:', imageError);
      }
    }

    // Delete the category
    const result = await Category.findByIdAndDelete(req.params.id);
    console.log('Category deletion result:', result); // Debug log

    res.send({ 
      message: 'Category deleted successfully',
      deletedCategory: category
    });
  } catch (error) {
    console.error('Error in category deletion:', error); // Server-side error log
    res.status(500).send({ 
      error: 'Error deleting category', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/api/templates', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: 'Only admins can create templates' });
    }

    const { name, category, elements, preview } = req.body;
    
    // Validate required fields
    if (!name || !category || !elements || !preview) {
      return res.status(400).send({ 
        error: 'Missing required fields',
        details: {
          name: !name ? 'Name is required' : null,
          category: !category ? 'Category is required' : null,
          elements: !elements ? 'Elements are required' : null,
          preview: !preview ? 'Preview is required' : null
        }
      });
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).send({ error: 'Invalid category ID' });
    }

    const template = new Template({
      name,
      category,
      elements,
      preview,
      createdBy: req.user._id
    });

    await template.save();
    
    // Populate references before sending response
    await template.populate('category createdBy', 'name email');
    
    res.status(201).send(template);
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(400).send({ 
      error: 'Error creating template',
      details: error.message 
    });
  }
});

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await Template.find()
      .populate('category', 'name')
      .populate('createdBy', 'email')
      .sort('-createdAt');
    res.send(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).send({ error: 'Error fetching templates' });
  }
});

app.put('/api/templates/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: 'Only admins can update templates' });
    }

    const { name, category, elements, preview } = req.body;
    
    // Validate required fields
    if (!name || !category || !elements || !preview) {
      return res.status(400).send({ error: 'Missing required fields' });
    }

    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { name, category, elements, preview },
      { new: true }
    ).populate('category createdBy', 'name email');
    
    if (!template) {
      return res.status(404).send({ error: 'Template not found' });
    }
    
    res.send(template);
  } catch (error) {
    console.error('Template update error:', error);
    res.status(400).send({ error: 'Error updating template' });
  }
});

app.delete('/api/templates/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: 'Only admins can delete templates' });
    }

    const template = await Template.findByIdAndDelete(req.params.id);
    
    if (!template) {
      return res.status(404).send({ error: 'Template not found' });
    }
    
    res.send({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template deletion error:', error);
    res.status(500).send({ error: 'Error deleting template' });
  }
});


// Get template fields
app.get('/api/templates/:id/fields', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).send({ error: 'Template not found' });
    }
    
    const fields = template.requiredFields || [];
    res.json(fields);
  } catch (error) {
    console.error('Error fetching template fields:', error);
    res.status(500).send({ error: 'Error fetching template fields' });
  }
});

// Save customization preview
app.post('/api/customizations/preview', auth, async (req, res) => {
  try {
    const { preview, customFields, templateId } = req.body;
    
    // Store preview temporarily (you might want to use a separate collection or temporary storage)
    const previewId = new mongoose.Types.ObjectId();
    
    res.json({ 
      previewId: previewId.toString(),
      preview,
      customFields 
    });
  } catch (error) {
    console.error('Error saving customization preview:', error);
    res.status(500).send({ error: 'Error saving customization preview' });
  }
});



// Coupon routs
// POST endpoint for creating coupons
app.post("/api/coupons", auth, async (req, res) => {
  try {
    // Only admin can create coupons
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can create coupons" });
    }

    const { 
      code, 
      discountType, 
      discountValue, 
      startDate, 
      endDate, 
      maxUsesPerUser, 
      assignedUsers 
    } = req.body;

    // Validate input
    if (!code || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).send({ error: "Missing required coupon details" });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).send({ error: "Coupon code already exists" });
    }

    // Validate discount value
    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).send({ error: "Percentage discount must be between 0 and 100" });
    }

    if (discountType === 'fixed' && discountValue <= 0) {
      return res.status(400).send({ error: "Fixed discount must be greater than 0" });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).send({ error: "End date must be after start date" });
    }

    // Create new coupon with user usage tracking
    const newCoupon = new Coupon({
      code,
      discountType,
      discountValue,
      startDate: start,
      endDate: end,
      maxUsesPerUser: maxUsesPerUser || 0,
      assignedUsers: assignedUsers || [],
      userUsage: [], // Initialize empty usage tracking
      createdBy: req.user._id,
      isActive: true
    });

    await newCoupon.save();

    // Populate user references before sending response
    await newCoupon.populate([
      { path: 'createdBy', select: 'email' },
      { path: 'assignedUsers', select: 'email' }
    ]);

    res.status(201).send({
      ...newCoupon.toObject(),
      assignedUsers: newCoupon.assignedUsers.map(user => ({
        _id: user._id,
        email: user.email
      }))
    });

  } catch (error) {
    console.error('Coupon creation error:', error);
    res.status(500).send({ 
      error: "Error creating coupon",
      details: error.message 
    });
  }
});

app.post("/api/coupons/validate", auth, async (req, res) => {
  try {
    const { couponCode, orderTotal } = req.body;

    // Find the coupon
    const coupon = await Coupon.findOne({ 
      code: couponCode,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    // Check coupon existence
    if (!coupon) {
      return res.status(404).send({ error: "Invalid or expired coupon" });
    }

    // Check if coupon is assigned to specific users
    if (coupon.assignedUsers.length > 0 && 
        !coupon.assignedUsers.some(userId => userId.toString() === req.user._id.toString())) {
      return res.status(403).send({ error: "Coupon not available for this user" });
    }

    // Check user's usage count
    const userUsage = coupon.userUsage.find(
      usage => usage.user.toString() === req.user._id.toString()
    );

    if (coupon.maxUsesPerUser > 0 && userUsage && userUsage.usageCount >= coupon.maxUsesPerUser) {
      return res.status(400).send({ 
        error: `You have reached the maximum usage limit (${coupon.maxUsesPerUser}) for this coupon`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = orderTotal * (coupon.discountValue / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    // Update user usage count
    if (!userUsage) {
      coupon.userUsage.push({
        user: req.user._id,
        usageCount: 1
      });
    } else {
      userUsage.usageCount += 1;
    }
    await coupon.save();

    res.send({
      message: "Coupon applied successfully",
      discountAmount,
      couponDetails: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        remainingUses: coupon.maxUsesPerUser > 0 ? 
          coupon.maxUsesPerUser - (userUsage ? userUsage.usageCount : 1) : 
          'Unlimited'
      }
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).send({ error: "Error validating coupon" });
  }
});

// Get all coupons
app.get("/api/coupons", auth, async (req, res) => {
  try {
    // If admin, return all coupons
    if (req.user.isAdmin) {
      const coupons = await Coupon.find()
        .populate('createdBy', 'email')
        .populate('assignedUsers', 'email');
      return res.send(coupons);
    }

    // For regular users, return applicable coupons
    const now = new Date();
    const userCoupons = await Coupon.find({
      $or: [
        { assignedUsers: req.user._id },
        { assignedUsers: { $size: 0 } } // Coupons with no specific user assignment
      ],
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { maxUses: 0 }, // Unlimited use coupons
        { currentUses: { $lt: '$maxUses' } } // Coupons not yet fully used
      ]
    });

    res.send(userCoupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).send({ error: "Error retrieving coupons" });
  }
});

// Update a coupon
app.put("/api/coupons/:id", auth, async (req, res) => {
  try {
    // Only admin can update coupons
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can update coupons" });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Prevent changing certain fields
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedCoupon) {
      return res.status(404).send({ error: "Coupon not found" });
    }

    res.send(updatedCoupon);
  } catch (error) {
    console.error('Coupon update error:', error);
    res.status(500).send({ error: "Error updating coupon" });
  }
});

// Delete a coupon
app.delete("/api/coupons/:id", auth, async (req, res) => {
  try {
    // Only admin can delete coupons
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can delete coupons" });
    }

    const { id } = req.params;

    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).send({ error: "Coupon not found" });
    }

    res.send({ 
      message: "Coupon deleted successfully",
      deletedCoupon 
    });
  } catch (error) {
    console.error('Coupon deletion error:', error);
    res.status(500).send({ error: "Error deleting coupon" });
  }
});

// Payment routes
app.post("/api/create-payment-intent", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount provided' 
      });
    }

    console.log('Creating payment intent for amount:', amount); // Debug log

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'cad',
      metadata: {
        integration_check: 'accept_a_payment',
      },
      payment_method_types: ['card'],
    });

    console.log('Payment intent created:', paymentIntent.id); // Debug log
    
    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Stripe error:', error); // Debug log
    res.status(400).json({
      error: {
        message: error.message || 'An error occurred with the payment'
      }
    });
  }
});
// app.post("/api/create-payment-intent", auth, async (req, res) => {
//   try {
//     const { amount } = req.body;
    
//     if (!amount || amount <= 0) {
//       return res.status(400).json({ 
//         error: 'Invalid amount provided' 
//       });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(amount * 100), // Convert to cents
//       currency: 'cad',
//       payment_method_types: ['card'],
//       metadata: {
//         userId: req.user._id.toString(),
//         integration_check: 'accept_a_payment',
//       }
//     });

//     res.json({
//       clientSecret: paymentIntent.client_secret
//     });
//   } catch (error) {
//     console.error('Stripe error:', error);
//     res.status(400).json({
//       error: {
//         message: error.message || 'An error occurred with the payment'
//       }
//     });
//   }
// });

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

    if (!product || !product._id) {
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const cartItem = {
      product: product._id,
      quantity: quantity || 1,
      customization: {
        template: customization.template,
        preview: customization.preview,
        description: customization.description,
        customFields: customization.customFields,
        requiredFields: customization.requiredFields
      }
    };

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [cartItem]
      });
    } else {
      cart.items.push(cartItem);
    }

    await cart.save();
    
    // Populate the cart before sending response
    await cart.populate('items.product');
    
    res.status(200).json({
      message: 'Item added to cart successfully',
      cart: cart
    });
  } catch (error) {
    console.error('Server error in cart addition:', error);
    res.status(500).json({
      error: 'Error adding item to cart',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
  
app.put('/api/cart/:index', auth, async (req, res) => {
  try {
    const { quantity, customization } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).send({ error: 'Cart not found' });
    }

    if (!cart.items[req.params.index]) {
      return res.status(404).send({ error: 'Cart item not found' });
    }

    // Update quantity if provided
    if (quantity !== undefined) {
      cart.items[req.params.index].quantity = quantity;
    }

    // Update customization if provided
    if (customization) {
      cart.items[req.params.index].customization = {
        template: customization.template,
        preview: customization.preview,
        customFields: customization.customFields.map(field => ({
          fieldId: field.fieldId,
          type: field.type,
          imageUrl: field.imageUrl,
          content: field.content,
          properties: field.properties
        })),
        requiredFields: customization.requiredFields.map(field => ({
          fieldId: field.fieldId,
          type: field.type,
          imageUrl: field.imageUrl || null,
          value: field.value
        })),
        description: customization.description
      };
    }

    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(400).send({ error: 'Error updating cart item' });
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


// Rout of Upload pictures in Porudtc Customization -> cart -> order
// app.post('/api/upload-image', uploadLimiter, upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     // Generate a unique filename
//     const ext = path.extname(req.file.originalname);
//     const filename = `${Date.now()}_${req.file.originalname}`;
//     const filepath = path.join(__dirname, 'upload', filename);

//     // Move file to final location
//     fs.renameSync(req.file.path, filepath);

//     // Create response
//     const fileUrl = `/upload/${filename}`;
    
//     res.json({ 
//       filePath: fileUrl,
//       mime: req.file.mimetype
//     });
//   } catch (error) {
//     console.error('Upload error:', error);
//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
//     res.status(500).json({ error: 'Upload failed' });
//   }
// });
app.post('/api/upload-image', uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Generate a unique filename
    const ext = path.extname(req.file.originalname);
    const filename = `${Date.now()}_${req.file.originalname}`;
    const filepath = path.join(__dirname, 'upload', filename);
    
    // Move file to final location
    fs.renameSync(req.file.path, filepath);
    
    // Create response
    const fileUrl = `/upload/${filename}`;
    
    // NEW CODE: Track the upload in the database
    const uploadRecord = new Upload({
      originalName: req.file.originalname,
      path: filename,  // Store just the filename, not the full path
      mimetype: req.file.mimetype,
      size: req.file.size,
      // If user is logged in, associate with user
      userId: req.user ? req.user._id : null,
      // If not logged in but has a session, track by session
      sessionId: !req.user && req.session ? req.session.id : null,
      uploadedBy: req.user ? req.user.email || req.user.username : 'Visitor'
    });
    
    await uploadRecord.save();
    
    res.json({
      filePath: fileUrl,
      mime: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});


// This could run on a schedule (e.g., every hour)
async function updateImageUsageStatus() {
  try {
    // Get all uploads
    const uploads = await Upload.find();
    
    for (const upload of uploads) {
      // Extract filename from path
      const filename = upload.path;
      
      // Check if this file is in any carts
      const inCart = await Cart.findOne({
        'items.customization.customFields.imageUrl': { $regex: filename }
      });
      
      // Check if this file is in any orders
      const inOrder = await Order.findOne({
        'items.customization.customFields.imageUrl': { $regex: filename }
      });
      
      // Update status if different from current
      if ((!!inCart) !== upload.inCart || (!!inOrder) !== upload.inOrder) {
        await Upload.updateOne(
          { _id: upload._id },
          { 
            inCart: !!inCart,
            inOrder: !!inOrder
          }
        );
      }
    }
    
    console.log('Image usage status updated successfully');
  } catch (error) {
    console.error('Error updating image usage status:', error);
  }
}

// You can trigger this function with a scheduler like node-cron
// Example: run every hour
cron.schedule('10 * * * *', updateImageUsageStatus);



// Add error handling middleware for multer errors if you don't already have it
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'File upload error: ' + err.message
    });
  } else if (err.message === 'Invalid file type. Only images are allowed.') {
    return res.status(400).json({
      error: err.message
    });
  }
  next(err);
});


// // Endpoint to save the full–resolution image
// app.post('/api/upload-image', auth, upload.single('image'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }
//   // Respond with the file path relative to your public/static folder (adjust as needed)
//   res.json({ filePath: `/upload/${req.file.filename}` });
// });

// Endpoint to save the thumbnail image
app.post('/api/upload-thumbnail', auth, upload.single('thumbnail'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filePath: `/upload/${req.file.filename}` });
});



//Order Routs
app.post("/api/orders", auth, async (req, res) => {
  try {
    const { products, totalAmount, status, paymentMethod, paymentId, coupon } = req.body;

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid products data',
        details: 'Products array is required and must not be empty'
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid total amount',
        details: 'Total amount must be greater than 0'
      });
    }

    // If a coupon was applied, validate it again
      if (coupon && coupon.code) { 
    try {
        const couponValidation = await Coupon.findOne({ 
          code: coupon.code,
          isActive: true,
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() }
        });

        if (!couponValidation) {
          return res.status(400).json({ 
            error: 'Invalid or expired coupon'
          });
        }

        // Update coupon usage
        await Coupon.findOneAndUpdate(
          { code: coupon.code },
          { $inc: { currentUses: 1 } }
        );
      } catch (couponError) {
        console.error('Coupon validation error:', couponError);
        return res.status(400).json({ 
          error: 'Error processing coupon',
          details: couponError.message
        });
      }
    }

    // Create order with coupon details
    const orderData = {
      user: req.user._id,
      products: products.map(item => ({
        product: item.product,
        quantity: item.quantity,
        customization: {
          template: item.customization?.template || null,
          preview: item.customization?.preview || null,
          description: item.customization?.description || '',
          customFields: item.customization?.customFields || [],
          requiredFields: item.customization?.requiredFields || []
        }
      })),
      totalAmount,
      status: status || 'pending',
      paymentMethod,
      paymentId,
      coupon: coupon ? {
        code: coupon.code,
        discountAmount: coupon.discountAmount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      } : null
    };

    const order = new Order(orderData);
    await order.save();

    // Process and store images for each product
    for (let productIndex = 0; productIndex < products.length; productIndex++) {
      const product = products[productIndex];
      console.log(`Processing product ${productIndex}:`, {
        productId: product.product,
        hasCustomization: !!product.customization
      });

      if (product.customization?.customFields) {
        try {
          await processOrderImages(
            order._id,
            productIndex,
            product.customization.customFields
          );
        } catch (imageError) {
          console.error(`Error processing images for product ${productIndex}:`, imageError);
          // Continue with order creation even if image processing fails
        }
      }
    }

    // Fetch the complete order with populated fields
    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: 'products.product',
        model: 'Product'
      })
      .populate('user');

    res.status(201).send(populatedOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({
      error: 'Failed to create order',
      details: error.message
    });
  }
});

app.put("/api/orders/:id/status", auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    // Validate the status
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Only admins should be able to update order status
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can update order status' });
    }
    
    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId, 
      { status }, 
      { new: true }
    ).populate('user');
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Create a notification for the customer
    const notification = new Notification({
      user: updatedOrder.user._id,
      message: `Your order #${orderId.slice(-6)} status has been updated to ${status}`,
      type: 'order',
      link: `/orders/${orderId}`
    });
    
    await notification.save();
    
    // Send response
    res.json({ 
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put("/api/orders/:id/status", auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    // Validate the status
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Only admins should be able to update order status
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can update order status' });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Record the previous status for notification
    const previousStatus = order.status;
    
    // Update the order status
    order.status = status;
    
    // Set the updatedAt timestamp for metrics calculation
    order.updatedAt = new Date();
    
    await order.save();
    
    // Create a notification for the customer
    const notification = new Notification({
      user: order.user,
      message: `Your order #${orderId.slice(-6)} status has been updated from ${previousStatus} to ${status}`,
      type: 'order',
      link: `/orders/${orderId}`
    });
    
    await notification.save();
    
    // Send response
    res.json({ 
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// endpoint to get individual customization files
app.get('/api/orders/:orderId/products/:productIndex/files/:fieldId', auth, async (req, res) => {
  try {
    const { orderId, productIndex, fieldId } = req.params;
    const order = await Order.findById(orderId).populate('products.product');
    
    if (!order) return res.status(404).send({ error: 'Order not found' });
    
    const product = order.products[productIndex];
    if (!product) return res.status(404).send({ error: 'Product not found' });
    
    const customField = product.customization?.customFields?.find(f => f.fieldId === fieldId);
    const requiredField = product.customization?.requiredFields?.find(f => f.fieldId === fieldId);
    const field = customField || requiredField;
    
    if (!field) return res.status(404).send({ error: 'Field not found' });
    
    if (field.type === 'image' || field.type === 'logo') {
      const imageData = field.content; // Original file data
      if (!imageData) return res.status(404).send({ error: 'Image data not found' });
      
      const binary = Buffer.from(imageData.split(',')[1], 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename=${fieldId}_original.png`);
      res.send(binary);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=${fieldId}.txt`);
      res.send(field.content || field.value);
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

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

    // Create the PDF document
    const PDFDocument = require('pdfkit');
    const path = require('path');
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-${order._id}.pdf`);
    doc.pipe(res);

    // --- Header ---
    // Left side: Website title "BAG&BOX"
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#333')
      .text('BAG&BOX', 50, 30);

    // Right side: Logo image (adjust the path as needed)
    const logoPath = path.join(process.cwd(), 'logo.png');
    try {
      doc.image(logoPath, doc.page.width - 150, 15, { width: 100 });
    } catch (err) {
      console.error("Logo image could not be loaded:", err);
    }
    // Draw a line under the header
    doc.moveTo(50, 70).lineTo(doc.page.width - 50, 70).stroke();

    // --- Order Details ---
    doc.moveDown();
    doc
      .fontSize(16)
      .fillColor('#444')
      .text('Order Details', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).fillColor('#000');
    const labelX = 50;
    const valueX = 150;
    let currentY = doc.y;

    doc.text(`Order ID:`, labelX, currentY);
    doc.text(`${order._id}`, valueX, currentY);
    doc.moveDown();

    currentY = doc.y;
    doc.text(`Date:`, labelX, currentY);
    doc.text(`${new Date(order.createdAt).toLocaleString()}`, valueX, currentY);
    doc.moveDown();

    currentY = doc.y;
    doc.text(`Customer:`, labelX, currentY);
    doc.text(`${order.user.email}`, valueX, currentY);
    doc.moveDown();

    currentY = doc.y;
    doc.text(`Total Amount:`, labelX, currentY);
    doc.text(`$${order.totalAmount.toFixed(2)}`, valueX, currentY);
    doc.moveDown();

    // --- Coupon Section ---
    if (order.coupon && order.coupon.code) {
      doc.moveDown();
      doc.fontSize(14)
         .fillColor('#444')
         .text('Coupon Details', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).fillColor('#000');
      currentY = doc.y;
      doc.text(`Coupon Code:`, labelX, currentY);
      doc.text(`${order.coupon.code}`, valueX, currentY);
      doc.moveDown();

      if (order.coupon.discountType) {
        currentY = doc.y;
        doc.text(`Discount Type:`, labelX, currentY);
        doc.text(`${order.coupon.discountType}`, valueX, currentY);
        doc.moveDown();
      }
      if (order.coupon.discountValue) {
        currentY = doc.y;
        doc.text(`Discount Value:`, labelX, currentY);
        doc.text(`${order.coupon.discountValue}`, valueX, currentY);
        doc.moveDown();
      }
      if (order.coupon.discountAmount) {
        currentY = doc.y;
        doc.text(`Discount Amount:`, labelX, currentY);
        doc.text(`$${order.coupon.discountAmount}`, valueX, currentY);
        doc.moveDown();
      }
      // Draw a line after coupon details
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown();
    }

    // --- Products Table ---
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Products', 50, doc.y, { underline: true });
    doc.moveDown();

    // Table headers for products
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Product', 50, tableTop);
    doc.text('Quantity', 250, tableTop);
    doc.text('Details', 350, tableTop);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();

    // Loop through products and add details (without customization)
    doc.font('Helvetica').fontSize(12);
    order.products.forEach(item => {
      const productName = item.product.name;
      const quantity = item.quantity;
      // Additional product details – adjust fields as per your schema.
      const productDescription = item.product.description || 'No description available';
      const productPrice = item.product.price ? `$${item.product.price.toFixed(2)}` : 'Price not available';
      
      let productDetails = `Description: ${productDescription}\nPrice: ${productPrice}`;

      const yBefore = doc.y;
      doc.text(productName, 50, yBefore);
      doc.text(quantity.toString(), 250, yBefore);
      doc.text(productDetails, 350, yBefore, { width: 200 });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown();
    });

    // --- Footer ---
    // Add a simple footer with the current page number.
    const addFooter = () => {
      doc.fontSize(8)
         .fillColor('#555')
         .text(`Page ${doc.page.number}`, 50, doc.page.height - 50, {
           align: 'center',
           width: doc.page.width - 100
         });
    };

    // Attach footer on the first page
    addFooter();
    // Add footer on subsequent pages (if any)
    doc.on('pageAdded', addFooter);

    // Finalize the PDF and end the stream
    doc.end();
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).send({ error: 'Server error', details: error.message });
  }
});


// app.get("/api/orders/:id/download", auth, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id)
//       .populate('user')
//       .populate('products.product');

//     if (!order) {
//       return res.status(404).send({ error: 'Order not found' });
//     }

//     if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
//       return res.status(403).send({ error: 'Not authorized' });
//     }

//     // Generate PDF report
//     const PDFDocument = require('pdfkit');
//     const doc = new PDFDocument();
    
//     // Set response headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=order-${order._id}.pdf`);

//     doc.pipe(res);

//     // Add content to PDF
//     doc.fontSize(20).text('Order Details', { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Order ID: ${order._id}`);
//     doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
//     doc.text(`Customer: ${order.user.email}`);
//     doc.text(`Total Amount: $${order.totalAmount.toFixed(2)}`);
    
//     doc.moveDown();
//     doc.text('Products:', { underline: true });
    
//     order.products.forEach(item => {
//       doc.moveDown();
//       doc.text(`Product: ${item.product.name}`);
//       doc.text(`Quantity: ${item.quantity}`);
//       if (item.customization?.customText) {
//         doc.text(`Custom Text: ${item.customization.customText}`);
//       }
//       if (item.customization?.description) {
//         doc.text(`Description: ${item.customization.description}`);
//       }
//     });

//     doc.end();
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

app.get('/api/orders/:orderId/customization/:fieldId', auth, async (req, res) => {
  try {
    const { orderId, fieldId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ error: 'Order not found' });
    }
    if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Not authorized' });
    }
    let foundField = null;
    // Iterate over order.products (not order.items)
    order.products.forEach(item => {
      const customField = item.customization?.customFields?.find(f => f.fieldId === fieldId);
      const requiredField = item.customization?.requiredFields?.find(f => f.fieldId === fieldId);
      if (customField || requiredField) {
        foundField = customField || requiredField;
      }
    });
    if (!foundField) {
      return res.status(404).send({ error: 'Customization field not found' });
    }
    if (foundField.type === 'image' || foundField.type === 'logo') {
      const imageData = foundField.content; // or foundField.value for required fields
      if (!imageData) return res.status(404).send({ error: 'Image data not found' });
      
      // If the stored image data is a file reference (e.g. starts with "/upload/")
      if (typeof imageData === 'string' && imageData.startsWith('/upload/')) {
        const fullPath = path.join(__dirname, imageData);
        return res.sendFile(fullPath);
      }
      
      // Otherwise, assume it’s a data URL and decode it
      const binary = Buffer.from(imageData.split(',')[1], 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename=${fieldId}_original.png`);
      return res.send(binary);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=${fieldId}.txt`);
      return res.send(foundField.content || foundField.value);
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// endpoint to include customization files
app.get("/api/orders/:id/download", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .populate('products.product')
      .populate('products.customization.template');

    if (!order) {
      return res.status(404).send({ error: 'Order not found' });
    }

    if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Not authorized' });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-${order._id}.pdf`);

    doc.pipe(res);

    // Order Details
    doc.fontSize(20).text('Order Details', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Customer: ${order.user.email}`);
    doc.text(`Total Amount: $${order.totalAmount.toFixed(2)}`);
    
    // Products and Customizations
    order.products.forEach((item, index) => {
      doc.moveDown();
      doc.text(`Product ${index + 1}: ${item.product.name}`);
      doc.text(`Quantity: ${item.quantity}`);
      
      if (item.customization) {
        doc.text('Customizations:', { underline: true });
        
        // Template information
        if (item.customization.template) {
          doc.text(`Template: ${item.customization.template.name}`);
        }

        // Custom fields
        if (item.customization.customFields && item.customization.customFields.length > 0) {
          item.customization.customFields.forEach(field => {
            if (field.type === 'text') {
              doc.text(`${field.type}: ${field.content}`);
            }
            // Images are stored separately and can be downloaded individually
          });
        }

        // Description
        if (item.customization.description) {
          doc.text(`Special Instructions: ${item.customization.description}`);
        }

        // Preview image
        if (item.customization.preview) {
          doc.image(Buffer.from(item.customization.preview.split(',')[1], 'base64'), {
            fit: [250, 250],
            align: 'center'
          });
        }
      }
    });

    doc.end();
  } catch (error) {
    console.error('Error generating order PDF:', error);
    res.status(500).send({ error: 'Error generating order PDF' });
  }
});


//Users routs
// Get all users (for coupon assignment)
app.get("/api/users", auth, async (req, res) => {
  try {
    // Only allow admin to fetch users
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can access user list" });
    }

    // Fetch users, excluding sensitive information
    const users = await User.find({}, 'email phone isAdmin');
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: "Error fetching users" });
  }
});

app.put("/api/users/profile", auth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, currentPassword, newPassword, addresses, defaultAddress, preferences } = req.body;

    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If changing password, verify current password
    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Check if email is being changed and verify it's not taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ error: 'Email address is already in use' });
      }
    }

    // Update fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email ? email.toLowerCase() : user.email;
    user.phone = phone || user.phone;
    user.company = company || user.company;

    // Update addresses if provided
    if (addresses) {
      user.addresses = addresses;
    }

    // Set default address if provided
    if (defaultAddress && user.addresses.some(addr => addr._id.toString() === defaultAddress)) {
      user.defaultAddress = defaultAddress;
    }

    // Update preferences if provided
    if (preferences) {
      user.preferences = {
        newsletter: preferences.newsletter !== undefined ? preferences.newsletter : user.preferences?.newsletter,
        marketingEmails: preferences.marketingEmails !== undefined ? preferences.marketingEmails : user.preferences?.marketingEmails
      };
    }

    await user.save();

    // Create new token
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);

    // Remove sensitive data before sending response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});


// Delete user account
app.delete("/api/users/profile", auth, async (req, res) => {
  try {
    // Find user and related data
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for pending orders
    const pendingOrders = await Order.find({
      user: req.user._id,
      status: { $in: ['pending', 'processing'] }
    });

    if (pendingOrders.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete account with pending orders. Please wait for orders to complete or contact support.'
      });
    }

    // Remove user's cart
    await Cart.findOneAndDelete({ user: req.user._id });

    // Anonymize completed orders instead of deleting them
    await Order.updateMany(
      { user: req.user._id },
      { 
        $set: { 
          user: null,
          anonymizedUser: {
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            deletedAt: new Date()
          }
        } 
      }
    );

    // Delete user's auth tokens from localStorage
    // Note: This will be handled on the frontend after receiving successful response

    // Delete the user
    await User.findByIdAndDelete(req.user._id);

    res.json({ 
      message: 'Account deleted successfully',
      success: true 
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ 
      error: 'Error deleting account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's order history
app.get("/api/users/orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('products.product');
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order history' });
  }
});

// Update user's password
app.put("/api/users/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Both current and new passwords are required' 
      });
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ 
      message: 'Password updated successfully',
      success: true 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating password' });
  }
});

// Get user's active coupons
app.get("/api/users/coupons", auth, async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      $or: [
        { assignedUsers: req.user._id },
        { assignedUsers: { $size: 0 } }
      ],
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching coupons' });
  }
});

app.get("/api/users/login-activity", auth, async (req, res) => {
  try {
    const activities = await LoginActivity.find({ user: req.user._id })
      .sort('-timestamp')
      .limit(10);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching login activity' });
  }
});

app.put("/api/users/preferences", auth, async (req, res) => {
  try {
    const { preferences } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.preferences = {
      ...user.preferences,
      ...preferences
    };

    await user.save();
    res.json({ preferences: user.preferences });
  } catch (error) {
    res.status(500).json({ error: 'Error updating preferences' });
  }
});


//Admin Routs
// Get all activity logs
app.get("/api/admin/activity-logs", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const logs = await ActivityLog.find()
      .populate('user', 'email')
      .sort('-createdAt')
      .limit(1000); // Limit to last 1000 activities for performance

    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Error fetching activity logs' });
  }
});

// Get user list with security info
// app.get("/api/admin/users", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }

//     const users = await User.find({}, {
//       email: 1,
//       firstName: 1,
//       lastName: 1,
//       lastLogin: 1,
//       createdAt: 1,
//       updatedAt: 1
//     }).sort('-createdAt');

//     res.json(users);
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({ error: 'Error fetching users' });
//   }
// });
// In your server.js
app.get("/api/admin/users", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const query = {};
    if (search) {
      query.$or = [
        { email: new RegExp(search, 'i') },
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('email firstName lastName phone isAdmin createdAt')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Error fetching users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get("/api/admin/users", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Only admins can access user management" });
    }

    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { email: new RegExp(search, 'i') },
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.get("/api/admin/users/:userId/activity", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Only admins can view user activity" });
    }

    const activities = await ActivityLog.find({ user: req.params.userId })
      .sort('-createdAt')
      .limit(50);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user activity' });
  }
});

// Export security data
app.get("/api/admin/security/export", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const activities = await ActivityLog.find()
      .populate('user', 'email')
      .sort('-createdAt')
      .limit(5000);

    // Convert to CSV
    const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
    const csvStringifier = createCsvStringifier({
      header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'user', title: 'User' },
        { id: 'action', title: 'Action' },
        { id: 'type', title: 'Type' },
        { id: 'details', title: 'Details' },
        { id: 'ipAddress', title: 'IP Address' }
      ]
    });

    const records = activities.map(activity => ({
      timestamp: new Date(activity.createdAt).toISOString(),
      user: activity.user?.email || 'System',
      action: activity.action,
      type: activity.type,
      details: activity.details,
      ipAddress: activity.ipAddress
    }));

    const csvString = csvStringifier.stringifyRecords(records);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=security-log-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvString);
  } catch (error) {
    console.error('Error exporting security data:', error);
    res.status(500).json({ error: 'Error exporting security data' });
  }
});

// Get detailed user security info
app.get("/api/admin/users/:userId/security", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const userId = req.params.userId;

    // Get user's activity logs
    const activityLogs = await ActivityLog.find({ user: userId })
      .sort('-createdAt')
      .limit(100);

    // Get user's login history
    const loginHistory = await LoginActivity.find({ user: userId })
      .sort('-timestamp')
      .limit(50);

    // Get user's profile update history
    const profileUpdates = await ActivityLog.find({
      user: userId,
      action: 'profile_update'
    }).sort('-createdAt').limit(20);

    // Get failed login attempts
    const failedLogins = await ActivityLog.find({
      user: userId,
      action: 'login_failed'
    }).sort('-createdAt').limit(20);

    res.json({
      activityLogs,
      loginHistory,
      profileUpdates,
      failedLogins
    });
  } catch (error) {
    console.error('Error fetching user security info:', error);
    res.status(500).json({ error: 'Error fetching user security info' });
  }
});

// Get security statistics
app.get("/api/admin/security/stats", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      recentLogins,
      failedLogins,
      securityEvents,
      profileUpdates
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: oneDayAgo } }),
      LoginActivity.countDocuments({ timestamp: { $gte: oneDayAgo } }),
      ActivityLog.countDocuments({
        action: 'login_failed',
        createdAt: { $gte: sevenDaysAgo }
      }),
      ActivityLog.countDocuments({
        type: 'security',
        createdAt: { $gte: thirtyDaysAgo }
      }),
      ActivityLog.countDocuments({
        action: 'profile_update',
        createdAt: { $gte: thirtyDaysAgo }
      })
    ]);

    res.json({
      totalUsers,
      activeUsers,
      recentLogins,
      failedLogins,
      securityEvents,
      profileUpdates
    });
  } catch (error) {
    console.error('Error fetching security stats:', error);
    res.status(500).json({ error: 'Error fetching security stats' });
  }
});

// Log security event (internal function)
const logSecurityEvent = async (userId, action, details, ipAddress) => {
  try {
    const log = new ActivityLog({
      user: userId,
      action,
      type: 'security',
      details,
      ipAddress
    });
    await log.save();
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

// Update user access tracking middleware
const trackUserAccess = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        lastAccess: new Date(),
        lastIp: req.ip
      });
    }
    next();
  } catch (error) {
    console.error('Error tracking user access:', error);
    next();
  }
};


// Get all clients (users) with safe fields
app.get("/api/admin/clients", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Admin access required" });
    }
    // Exclude sensitive fields
    const clients = await User.find().select("-password -passwordResetToken -passwordResetExpires");
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: "Error fetching clients" });
  }
});

// Get detailed info for a specific client (plus their orders as an example)
app.get("/api/admin/clients/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Admin access required" });
    }
    const client = await User.findById(req.params.id).select("-password -passwordResetToken -passwordResetExpires");
    if (!client) return res.status(404).send({ error: "Client not found" });
    
    const orders = await Order.find({ user: client._id });
    const notes = await ClientNote.find({ user: client._id }).sort("-createdAt");
    // For contacts, invoices, and files, return empty arrays as placeholders
    res.json({ client, orders, notes, contacts: [], invoices: [], files: [] });
  } catch (error) {
    res.status(500).json({ error: "Error fetching client details", details: error.message });
  }
});

// New endpoint: Update client's admin status
app.put("/api/admin/clients/:id/admin", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Admin access required" });
    }
    const { isAdmin } = req.body;
    const client = await User.findByIdAndUpdate(req.params.id, { isAdmin }, { new: true });
    if (!client) return res.status(404).send({ error: "Client not found" });
    res.json({ message: "Client admin status updated", client: client.toSafeObject() });
  } catch (error) {
    res.status(500).json({ error: "Error updating client admin status" });
  }
});

// New endpoint: Admin triggers reset password request for a client
app.post("/api/admin/clients/:id/reset-password", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Admin access required" });
    }
    const client = await User.findById(req.params.id);
    if (!client) return res.status(404).send({ error: "Client not found" });
    
    const resetToken = crypto.randomBytes(20).toString("hex");
    client.passwordResetToken = resetToken;
    client.passwordResetExpires = Date.now() + 3600000; // 1 hour expiry
    await client.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const mailOptions = {
      to: client.email,
      from: process.env.SMTP_USER || "your-email@example.com",
      subject: "Password Reset Request",
      text: `An admin has requested a password reset for your account. Please click the following link to reset your password:\n\n${resetUrl}\n\nIf you did not expect this, please contact support.`
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: "Reset password request sent successfully" });
  } catch (error) {
    console.error("Error in reset-password endpoint:", error);
    res.status(500).json({ error: "Error sending reset password request", details: error.message });
  }
});

app.post("/api/admin/clients/:id/notes", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ error: "Note content is required" });
    }
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const newNote = new ClientNote({ user: client._id, note });
    await newNote.save();
    res.json({ message: "Note added successfully", note: newNote });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ error: "Error adding note", details: error.message });
  }
});

app.get("/api/admin/clients/:id/files", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      console.log("Admin access required.");
      return res.status(403).json({ error: "Admin access required" });
    }
    const clientId = req.params.id;
    console.log("Fetching files for client:", clientId);
    // Find orders belonging to the client
    const orders = await Order.find({ user: clientId });
    console.log(`Found ${orders.length} orders for client ${clientId}.`);
    const files = [];
    orders.forEach(order => {
      console.log("Processing order:", order._id);
      order.products.forEach(product => {
        console.log("Processing product:", product.product);
        const customization = product.customization;
        if (customization) {
          console.log("Found customization:", customization);
          // Check customFields
          if (Array.isArray(customization.customFields)) {
            customization.customFields.forEach(field => {
              console.log("Processing customField:", field);
              if (field.type === "image" || field.type === "logo") {
                let url = field.imageUrl || field.content;
                console.log("Found potential image URL in customField:", url);
                if (
                  url &&
                  typeof url === "string" &&
                  (url.startsWith("/upload/") ||
                    url.startsWith("http://") ||
                    url.startsWith("https://"))
                ) {
                  console.log("Adding file from customField:", url);
                  files.push({
                    orderId: order._id,
                    productId: product.product,
                    fieldId: field.fieldId,
                    url,
                  });
                }
              }
            });
          }
          // Check requiredFields
          if (Array.isArray(customization.requiredFields)) {
            customization.requiredFields.forEach(field => {
              console.log("Processing requiredField:", field);
              if (field.type === "image" || field.type === "logo") {
                let url = field.imageUrl || field.value;
                console.log("Found potential image URL in requiredField:", url);
                if (
                  url &&
                  typeof url === "string" &&
                  (url.startsWith("/upload/") ||
                    url.startsWith("http://") ||
                    url.startsWith("https://"))
                ) {
                  console.log("Adding file from requiredField:", url);
                  files.push({
                    orderId: order._id,
                    productId: product.product,
                    fieldId: field.fieldId,
                    url,
                  });
                }
              }
            });
          }
        } else {
          console.log("No customization for product:", product.product);
        }
      });
    });
    console.log("Files found:", files);
    res.json(files);
  } catch (error) {
    console.error("Error fetching client files:", error);
    res.status(500).json({ error: "Error fetching client files", details: error.message });
  }
});


app.get('/api/admin/uploads', auth , async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search = '', 
      inCart, 
      inOrder, 
      userOnly, 
      visitorOnly, 
      startDate, 
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;
    
    // Build the query filters
    const filter = {};
    
    // Search filter (filename or uploader)
    if (search) {
      filter['$or'] = [
        { originalName: { $regex: search, $options: 'i' } },
        { uploadedBy: { $regex: search, $options: 'i' } }
      ];
    }
    
    // User type filters
    if (userOnly === 'true') {
      filter.userId = { $exists: true, $ne: null };
    }
    
    if (visitorOnly === 'true') {
      filter.userId = { $exists: false };
    }
    
    // Date range filters
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of the day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endOfDay;
      }
    }
    
    // Usage filters
    if (inCart === 'true') {
      filter.inCart = true;
    }
    
    if (inOrder === 'true') {
      filter.inOrder = true;
    }
    
    // Determine sort options
    let sortOptions = {};
    switch(sortBy) {
      case 'date':
        sortOptions = { createdAt: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'user':
        sortOptions = { uploadedBy: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'size':
        sortOptions = { size: sortOrder === 'asc' ? 1 : -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    // Count total matching documents
    const total = await Upload.countDocuments(filter);
    
    // Fetch paginated images
    const images = await Upload.find(filter)
      .sort(sortOptions)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    
    res.json({
      images,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed information for a specific upload
app.get('/api/admin/uploads/:id/details', auth, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }
    
    // Fetch additional details if needed
    const details = { ...upload.toObject() };
    
    // If the image is in any orders, fetch related order IDs
    if (upload.inOrder) {
      const orders = await Order.find({ 
        'items.uploadId': upload._id 
      }).select('_id orderNumber createdAt status');
      
      details.orders = orders;
      details.orderCount = orders.length;
    }
    
    // If the image is in any carts, get count
    if (upload.inCart) {
      const cartCount = await Cart.countDocuments({ 
        'items.uploadId': upload._id 
      });
      
      details.cartCount = cartCount;
    }
    
    res.json(details);
  } catch (error) {
    console.error('Error fetching upload details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download an image
app.get('/api/admin/uploads/download/:id', auth, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }
    
    // Get the file path
    const filePath = path.join(__dirname, '../uploads', upload.path);
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${upload.originalName}"`);
    res.setHeader('Content-Type', upload.mimetype);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an image
app.delete('/api/admin/uploads/:id', auth, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }
    
    // Check if the image is in active orders
    const activeOrderCount = await Order.countDocuments({ 
      'items.uploadId': upload._id,
      status: { $nin: ['cancelled', 'completed'] }
    });
    
    if (activeOrderCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete image that is part of active orders' 
      });
    }
    
    // Delete the file from storage
    const filePath = path.join(__dirname, '../uploads', upload.path);
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        // Continue with database deletion even if file deletion fails
      }
      
      // Remove from database
      await Upload.findByIdAndDelete(req.params.id);
      
      res.json({ message: 'Image deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get("/api/images", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can access images" });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 8; // Reduced for better performance
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Image.countDocuments();
    const totalPages = Math.ceil(total / limit);

    // Get images for current page
    const images = await Image.find()
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .select('contentType data createdAt')
      .lean();

    const processedImages = images.map(img => ({
      _id: img._id,
      contentType: img.contentType,
      data: img.data.toString('base64'),
      createdAt: img.createdAt
    }));

    res.json({
      images: processedImages,
      total,
      page,
      totalPages
    });

  } catch (error) {
    console.error('Error in GET /api/images:', error);
    res.status(500).json({ error: 'Error fetching images' });
  }
});

// Delete image with reference checking
app.delete("/api/images/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can delete images" });
    }

    // Check if image is used in products or categories
    const productUsingImage = await Product.findOne({ 
      images: req.params.id 
    });
    
    const categoryUsingImage = await Category.findOne({ 
      image: req.params.id 
    });

    if (productUsingImage || categoryUsingImage) {
      return res.status(400).send({ 
        error: 'Image is in use and cannot be deleted' 
      });
    }

    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).send({ error: 'Image not found' });
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).send({ error: 'Error deleting image' });
  }
});

app.delete("/api/images/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Only admins can delete images" });
    }

    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).send({ error: 'Image not found' });
    }

    res.send({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Notification Routes
app.get("/api/notifications", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .limit(10);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

app.post("/api/notifications/mark-read", auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        user: req.user._id 
      },
      { $set: { isRead: true } }
    );
    
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating notifications' });
  }
});



// Endpoint to fetch notifications created by admin (e.g., global notifications)
app.get("/api/admin/notifications/created", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const skip = (page - 1) * limit;
    
    // Fetch all notifications sorted from newest to oldest
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Notification.countDocuments({});
    res.json({
      notifications,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ error: "Error fetching admin notifications" });
  }
});

app.post("/api/admin/notifications/send", auth, async (req, res) => {
  try {
    // Only allow admin users
    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Admin access required" });
    }

    const { selectedUsers, filter, channels, messageContent } = req.body;
    let targetUsers = [];

    // Determine target users based on selection or filter.
    if (selectedUsers && selectedUsers.length > 0) {
      targetUsers = await User.find({ _id: { $in: selectedUsers } });
    } else {
      // As an example, if no custom selection is provided, target all users.
      targetUsers = await User.find({});
      // Alternatively, use your dynamic filter logic here.
    }

    // Loop through each user and send notifications via each channel.
    for (const user of targetUsers) {
      // Send SMS if channel is selected and user has a phone number.
      if (channels.sms && user.phone) {
        try {          
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const client = require('twilio')(accountSid, authToken);
          
          await client.messages.create({
            body:  messageContent.sms,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: user.phone
          });
        
        } catch (smsError) {
          console.error(`Error sending SMS to ${user.phone}:`, smsError);
          // Optionally, you can collect failed SMS notifications here.
        }
      }

      // Send Email if channel is selected and user has an email.
      if (channels.email && user.email) {
        try {
          await transporter.sendMail({
            to: user.email,
            from: process.env.SMTP_USER,
            subject: "Newsletter / Notification",
            html: messageContent.email,
          });
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
        }
      }

      // Create an in-app notification if that channel is selected.
      if (channels.inApp) {
        try {
          const notification = new Notification({
            user: user._id,
            message: messageContent.inApp,
            type: "system",
          });
          await notification.save();
        } catch (inAppError) {
          console.error(`Error creating in-app notification for ${user._id}:`, inAppError);
        }
      }
    }

    res.send({ message: "Notifications processed. Check server logs for any errors." });
  } catch (error) {
    console.error("Error in notifications send endpoint:", error);
    res.status(500).send({ error: "Error sending notifications", details: error.message });
  }
});

app.put("/api/admin/notifications/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    const notificationId = req.params.id;
    const { active } = req.body;
    // Update the notification with the new active status
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { active },
      { new: true }
    );
    if (!updatedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(updatedNotification);
  } catch (error) {
    console.error("Error updating notification status:", error);
    res.status(500).json({ error: "Error updating notification status" });
  }
});

app.delete("/api/admin/notifications/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    const notificationId = req.params.id;
    const deletedNotification = await Notification.findByIdAndDelete(notificationId);
    if (!deletedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Error deleting notification" });
  }
});






app.post("/api/products/:id/remind-me", async (req, res) => {
  try {
    const productId = req.params.id;
    const { email, phone } = req.body;
    let userId = null;
    
    // If an authorization header is provided, verify token to set userId
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (tokenError) {
        console.log("Token verification failed:", tokenError);
        // Continue without userId if token is invalid
      }
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.inStock) {
      return res.status(400).json({ error: 'Product is already in stock' });
    }
    
    // Determine final contact info
    let finalEmail = email, finalPhone = phone;
    
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        if (!finalEmail) finalEmail = user.email;
        if (!finalPhone) finalPhone = user.phone;
      }
    }
    
    if (!finalEmail && !finalPhone) {
      return res.status(400).json({ error: 'Email or phone number is required for notification' });
    }
    
    // Format phone number for storage
    if (finalPhone) {
      try {
        const confirmationMessage = `You will be notified when "${product.name}" is back in stock.`;
        
        // Initialize Twilio client same way as in password reset
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);
        
        await client.messages.create({
          body: confirmationMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: finalPhone
        });
        
        console.log(`Confirmation SMS sent to ${finalPhone}`);
      } catch (smsError) {
        console.error(`SMS send error to ${finalPhone}:`, smsError);
        // Don't return error to user, just log it and continue
      }
    }
    
    // Check if notification already exists
    const existingNotification = await ProductNotification.findOne({
      product: productId,
      $or: [
        { email: finalEmail },
        { phone: finalPhone }
      ],
      notified: false
    });
    
    if (existingNotification) {
      return res.json({ 
        message: 'You\'re already on the notification list for this product.', 
        existing: true 
      });
    }
    
    // Create new notification record
    const notification = new ProductNotification({
      product: productId,
      user: userId,
      email: finalEmail,
      phone: finalPhone
    });
    
    await notification.save();
    
    // Send confirmation
    if (finalEmail) {
      try {
        const confirmationEmail = `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0056b3;">Back in Stock Notification Confirmed</h2>
            <p>We've added you to the notification list for <strong>${product.name}</strong>.</p>
            <p>You'll receive an email when this product becomes available.</p>
            <hr style="border: none; border-top: 1px solid #ccc;" />
            <p style="font-size: 12px; color: #777;">Thank you for your interest in our products.</p>
          </div>
        `;
        
        await transporter.sendMail({
          to: finalEmail,
          from: process.env.SMTP_USER,
          subject: 'Back in Stock Notification Confirmed',
          html: confirmationEmail
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    }
    
    if (finalPhone) {
      try {
        const confirmationSMS = `You're on our notification list for "${product.name}". We'll text you when it's back in stock.`;
        
        await twilioClient.messages.create({
          body: confirmationSMS,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: finalPhone
        });
      } catch (smsError) {
        console.error('Error sending confirmation SMS:', smsError);
      }
    }
    
    res.json({ 
      message: 'Notification request saved. We will notify you when the product is available.',
      success: true
    });
  } catch (error) {
    console.error('Error in remind-me:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


// Sales Report Routes
app.get("/api/reports/sales", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Only admins can access reports" });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Fetch orders within date range
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    }).populate('user', 'email');

    // Calculate various metrics
    const salesData = {
      totalRevenue: 0,
      totalOrders: orders.length,
      averageOrderValue: 0,
      productsSold: 0,
      dailyRevenue: {},
      topProducts: {},
      ordersByStatus: {
        pending: 0,
        processing: 0,
        shipped:0,
        completed: 0,
        cancelled: 0
      }
    };

    // Process orders
    orders.forEach(order => {
      // Add to total revenue
      salesData.totalRevenue += order.totalAmount;

      // Count products sold
      order.products.forEach(product => {
        salesData.productsSold += product.quantity;
        // Track top products
        const productId = product.product.toString();
        salesData.topProducts[productId] = (salesData.topProducts[productId] || 0) + product.quantity;
      });

      // Track daily revenue
      const dateKey = order.createdAt.toISOString().split('T')[0];
      salesData.dailyRevenue[dateKey] = (salesData.dailyRevenue[dateKey] || 0) + order.totalAmount;

      // Count orders by status
      salesData.ordersByStatus[order.status]++;
    });

    // Calculate average order value
    salesData.averageOrderValue = salesData.totalRevenue / salesData.totalOrders;

    // Get top products details
    const topProductIds = Object.keys(salesData.topProducts);
    const topProducts = await Product.find({
      _id: { $in: topProductIds }
    }, 'name basePrice');

    // Format top products data
    salesData.topProducts = topProductIds.map(id => ({
      product: topProducts.find(p => p._id.toString() === id),
      quantity: salesData.topProducts[id]
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    res.json(salesData);
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: 'Error generating sales report' });
  }
});

// Generate PDF report
app.get("/api/reports/sales/download", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Only admins can download reports" });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    }).populate('user', 'email').populate('products.product', 'name basePrice');

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`);

    // Add summary
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    doc.moveDown();
    doc.text(`Total Orders: ${orders.length}`);
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`);
    doc.text(`Average Order Value: $${(totalRevenue / orders.length).toFixed(2)}`);

    // Add detailed order list
    doc.moveDown();
    doc.text('Order Details:', { underline: true });
    orders.forEach(order => {
      doc.moveDown();
      doc.text(`Order ID: ${order._id}`);
      doc.text(`Customer: ${order.user.email}`);
      doc.text(`Amount: $${order.totalAmount.toFixed(2)}`);
      doc.text(`Status: ${order.status}`);
      doc.text('Products:');
      order.products.forEach(item => {
        doc.text(`  - ${item.product.name} (${item.quantity}x)`);
      });
    });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Error generating PDF report' });
  }
});





// Helper function to create notifications
const createNotification = async (userId, message, type, link = null) => {
  try {
    const notification = new Notification({
      user: userId,
      message,
      type,
      link
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to log user activity
const logActivity = async (userId, action, details, ipAddress) => {
  try {
    const activity = new ActivityLog({
      user: userId,
      action,
      details,
      ipAddress
    });
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Contact form validation and submission route
app.post('/api/contact', contactLimiter, [
  // Validation middleware
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Invalid email address'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, company, message } = req.body;

  try {
    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Info@bagbox.ca', 
      to: process.env.EMAIL_TO || 'Info@bagbox.ca',
      replyTo: email,
      subject: 'New Contact Form Submission - Bag&Box',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${phone}</td>
            </tr>` : ''}
            ${company ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${company}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Message:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${message}</td>
            </tr>
          </table>
        </div>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${name}
        Email: ${email}
        ${phone ? `Phone: ${phone}` : ''}
        ${company ? `Company: ${company}` : ''}
        
        Message: ${message}
      `
    });

    // Optional: Log successful submission
    console.log(`Contact form submission from ${name} (${email})`);

    // Respond with success
    res.status(200).json({ 
      message: 'Message sent successfully. We\'ll get back to you soon!',
      success: true 
    });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ 
      message: 'Failed to send message. Please try again later.',
      success: false,
      error: error.toString()
    });
  }
});



// Apply tracking middleware to all routes
app.use(trackUserAccess);



app.get('/api/config/maps', (req, res) => {
  res.json({ googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    success: false
  });
});


// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI
  // , {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  // maxPoolSize: 10, // Limit maximum connections in the pool
  // serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  // socketTimeoutMS: 45000, // How long to wait for responses
  // connectTimeoutMS: 10000, // How long to wait for initial connection
// }
)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    // Start the server after successful database connection
    const PORT = process.env.PORT || 80;
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

app.use('/upload', express.static(path.join(__dirname, 'upload')));


app.use('/upload', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization');
  next();
}, express.static(path.join(__dirname, 'upload')));























// // backend/server.js
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const multer = require("multer");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const nodemailer = require('nodemailer');
// const rateLimit = require('express-rate-limit');
// const { body, validationResult } = require('express-validator');
// const fs = require('fs');
// const crypto = require ("crypto");
// const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// const twilioClient = require('twilio')(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// dotenv.config();

// const app = express();
// app.use(express.json({ limit: '50mb' }));
// app.use(cors());

// app.set('trust proxy', true);


// const uploadDir = path.join(__dirname, 'upload');
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, path.join(__dirname, 'upload')); // Save files to backend/upload folder
//   },
//   filename: function(req, file, cb) {
//     const ext = path.extname(file.originalname);
//     // Use a timestamp and the field name in the filename
//     const filename = `${Date.now()}_${file.fieldname}${ext}`;
//     cb(null, filename);
//   }
// });

// // const upload = multer({ storage: storage, limits: { fileSize: 50000000 } });
// const uploadLimiter = rateLimit({
//   windowMs: 30 * 60 * 1000, // 30 minutes
//   max: 10, // limit each IP to 10 uploads per windowMs
//   message: 'Too many upload attempts, please try again later'
// });

// // Add this image validation middleware
// const validateImage = (req, file, cb) => {
//   // Allowed mime types
//   const allowedMimes = [
//     'image/jpeg',
//     'image/png',
//     'image/gif',
//     'image/webp',
//     'image/svg+xml'
//   ];

//   if (allowedMimes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only images are allowed.'), false);
//   }
// };

// // Update your existing upload configuration to include the file filter
// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 50000000 }, // keeping your existing 50MB limit
//   fileFilter: validateImage
// });

// // Rate limiting to prevent spam
// const contactLimiter = rateLimit({
//   windowMs: 24 * 60 * 60 * 1000, // 1 day (24 * 60 mins)
//   max: 2, // limit each IP to 5 requests per windowMs
//   message: 'Too many contact attempts, please try again later'
// });

// // Email transporter configuration
// const transporter = nodemailer.createTransport({
//   service: 'gmail', // Use service instead of host/port
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS
//   }
//   // host: 'smtp.gmail.com', // Replace with your SMTP host
//   // port: 587,
//   // secure: false, // Use TLS
//   // auth: {
//   //   user: process.env.EMAIL_USER, // Your email
//   //   pass: process.env.EMAIL_PASS  // App password or generated credentials
//   // }
// });

// // Middleware for authentication
// const auth = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization").replace("Bearer ", "");
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = await User.findById(decoded.userId);
//     next();
//   } catch (error) {
//     res.status(401).send({ error: "Please authenticate" });
//   }
// };

// // Helper function to convert base64 to Buffer
// const base64ToBuffer = (base64) => {
//   const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
//   if (matches.length !== 3) {
//     throw new Error('Invalid base64 string');
//   }
//   return {
//     contentType: matches[1],
//     buffer: Buffer.from(matches[2], 'base64')
//   };
// };



// // MongoDB Models
// // const NotificationSchema = new mongoose.Schema({
// //   user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
// //   message: {type: String, required: true},
// //   type: {
// //     type: String,
// //     enum: ['order', 'inventory', 'feedback', 'system'],
// //     required: true
// //   },
// //   isRead: {type: Boolean, default: false},
// //   link: String,
// //   createdAt: {type: Date, default: Date.now}
// // });
// const NotificationSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // New field for the creator
//   message: { type: String, required: true },
//   type: {
//     type: String,
//     enum: ['order', 'inventory', 'feedback', 'system'],
//     required: true
//   },
//   isRead: { type: Boolean, default: false },
//   link: String,
//   active: { type: Boolean, default: true },
//   global: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now }
// });

// const ProductNotificationSchema = new mongoose.Schema({
//   product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // if logged in
//   email: { type: String },
//   phone: { type: String },
//   notified: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now }
// });

// const ClientNoteSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   note: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// const LoginActivitySchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   ipAddress: { type: String },
//   location: { type: String },
//   device: { type: String },
//   timestamp: { type: Date, default: Date.now }
// });

// const UserSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//   password: { type: String, required: true },
//   firstName: { type: String, required: true, trim: true },
//   lastName: { type: String, required: true, trim: true },
//   phone: { type: String, required: true, trim: true },
//   company: { type: String, trim: true },
//   addresses: [
//     {
//       street: { type: String, trim: true },
//       city: { type: String, trim: true },
//       state: { type: String, trim: true },
//       postalCode: { type: String, trim: true },
//       country: { type: String, default: 'Canada', trim: true }
//     }
//   ],
//   defaultAddress: { type: mongoose.Schema.Types.ObjectId, ref: "User.addresses" }, // Reference to default address
//   isAdmin: { type: Boolean, default: false },
//   preferences: {
//     newsletter: { type: Boolean, default: false },
//     marketingEmails: { type: Boolean, default: false }
//   },
//   lastLogin: { type: Date },
//   passwordResetToken: String,
//   passwordResetExpires: Date,
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date }
// });


// // Update timestamp on save
// UserSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// // Add method to safely return user data without sensitive information
// UserSchema.methods.toSafeObject = function() {
//   const obj = this.toObject();
//   delete obj.password;
//   delete obj.passwordResetToken;
//   delete obj.passwordResetExpires;
//   return obj;
// };

// const ImageSchema = new mongoose.Schema({
//   data: { type: Buffer, required: true },
//   contentType: { type: String, required: true }
// });

// const CategorySchema = new mongoose.Schema({
//   name: { type: String, required: true, unique: true },
//   description: String,
//   image: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
//   createdAt: { type: Date, default: Date.now }
// });

// const TemplateSchema = new mongoose.Schema({
//   name: { type: String, required: true},
//   category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
//   elements: { type: Object, required: true },
//   preview: { type: String, required: true },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// const CouponSchema = new mongoose.Schema({
//   code: { type: String, required: true, unique: true },
//   discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
//   discountValue: { type: Number, required: true },
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   maxUsesPerUser: { type: Number, default: 0 }, 
//   userUsage: [{
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     usageCount: { type: Number, default: 0 }
//   }],
//   assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   isActive: { type: Boolean, default: true },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// const ProductSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
//   basePrice: { type: Number, required: true },
//   images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
//   description: String,
//   createdAt: { type: Date, default: Date.now },
//   hasGST: { type: Boolean, default: false },
//   hasPST: { type: Boolean, default: false },
//   customizationOptions: {
//     allowCustomImage: { type: Boolean, default: true },
//     allowCustomText: { type: Boolean, default: true }
//   },
//   isFeatured: { type: Boolean, default: false },
//   inStock: { type: Boolean, default: true },
//   minimumOrder: { type: Number, default: 1 },
//   sku: { type: String },
//   pricingTiers: [{
//     minQuantity: { type: Number, required: true },
//     maxQuantity: { type: Number },
//     price: { type: Number, required: true }
//   }],
//   weight: { type: Number }, // in grams
//   dimensions: {
//     length: { type: Number },
//     width: { type: Number },
//     height: { type: Number }
//   },
//   metadata: {
//     keywords: [String],
//     searchTags: [String]
//   }
// });

// const customFieldSchema = new mongoose.Schema({
//   fieldId: { type: String, required: true },
//   type: { type: String, required: true },
//   imageUrl: {type: String, default: null},
//   content: { type: String, required: true },
//   properties: {
//     fontSize: { type: Number, default: null },
//     fontFamily: { type: String, default: null },
//     fill: { type: String, default: null },
//     position: {
//       x: { type: Number, default: 0 },
//       y: { type: Number, default: 0 }
//     },
//     scale: {
//       x: { type: Number, default: 1 },
//       y: { type: Number, default: 1 }
//     }
//   }
// }, { _id: false });

// const requiredFieldSchema = new mongoose.Schema({
//   fieldId: { type: String, required: true },
//   type: { type: String, required: true },
//   imageUrl: {type: String, default: null},
//   value: { type: String, required: true }
// }, { _id: false });

// const cartItemSchema = new mongoose.Schema({
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product',
//     required: true
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     default: 1,
//     min: 1
//   },
//   customization: {
//     template: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Template',
//       default: null
//     },
//     preview: { type: String, default: null },
//     description: { type: String, default: '' },
//     customFields: [customFieldSchema],
//     requiredFields: [requiredFieldSchema]
//   }
// });

// const cartSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   items: [cartItemSchema]
// }, { timestamps: true });

// // Add indexes for better performance
// // cartSchema.index({ user: 1 });
// // cartSchema.index({ 'items.product': 1 });

// const orderItemSchema = new mongoose.Schema({
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product',
//     required: true
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     default: 1,
//     min: 1
//   },
//   customization: {
//     template: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Template',
//       default: null
//     },
//     preview: { type: String, default: null },
//     description: { type: String, default: '' },
//     customFields: [customFieldSchema],
//     requiredFields: [requiredFieldSchema]
//   }
// });

// const OrderSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   products: [orderItemSchema],
//   totalAmount: {
//     type: Number,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
//     default: 'pending'
//   },
//   paymentMethod: {
//     type: String,
//     required: true
//   },
//   paymentId: {
//     type: String,
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   coupon: {
//     code: { type: String },
//     discountAmount: { type: Number },
//     discountType: { 
//       type: String, 
//       enum: ['percentage', 'fixed'] 
//     },
//     discountValue: { type: Number }
//   }
// });

// const Category = mongoose.model('Category', CategorySchema);
// const Template = mongoose.model('Template', TemplateSchema);
// const Cart = mongoose.model('Cart', cartSchema);
// const User = mongoose.model("User", UserSchema);
// const Image = mongoose.model("Image", ImageSchema);
// const Product = mongoose.model("Product", ProductSchema);
// const Order = mongoose.model("Order", OrderSchema);
// const Coupon = mongoose.model('Coupon', CouponSchema);
// const Notification = mongoose.model('Notification', NotificationSchema);
// // const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
// const LoginActivity = mongoose.model('LoginActivity', LoginActivitySchema);
// const ProductNotification = mongoose.model('ProductNotification', ProductNotificationSchema);
// const ClientNote = mongoose.model('ClientNote', ClientNoteSchema);


// // API Routes


// //heleper functions for register email & sms
// // Function to send welcome email
// const sendWelcomeEmail = async (user) => {
//   const emailHtml = `
//     <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Welcome to Bag&Box</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             margin: 0;
//             padding: 0;
//           }
//           .container {
//             max-width: 600px;
//             margin: 0 auto;
//           }
//           .header {
//             background-color: #4a6ee0;
//             padding: 30px 20px;
//             text-align: center;
//           }
//           .header img {
//             max-width: 180px;
//           }
//           .content {
//             padding: 30px 20px;
//             background-color: #ffffff;
//           }
//           .footer {
//             padding: 20px;
//             text-align: center;
//             font-size: 12px;
//             color: #666;
//             background-color: #f5f5f5;
//           }
//           h1 {
//             color: #ffffff;
//             margin: 0;
//             font-size: 28px;
//           }
//           .button {
//             display: inline-block;
//             background-color: #4a6ee0;
//             color: #ffffff !important; /* Force white text color */
//             text-decoration: none;
//             padding: 12px 25px;
//             border-radius: 4px;
//             margin-top: 20px;
//             font-weight: bold;
//             transition: all 0.3s ease; /* Smooth transition for hover effects */
//             box-shadow: 0 2px 5px rgba(0,0,0,0.1);
//           }
//           /* Since email clients may not support hover, we're adding it just in case */
//           .button:hover {
//             background-color: #3a5bc0;
//             box-shadow: 0 4px 8px rgba(0,0,0,0.2);
//             transform: translateY(-2px);
//           }
//           .greeting {
//             font-size: 20px;
//             font-weight: bold;
//             margin-bottom: 20px;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>Welcome to Bag&Box</h1>
//           </div>
//           <div class="content">
//             <p class="greeting">Hello ${user.firstName},</p>
//             <p>Thank you for creating an account with us. We're excited to have you join our community!</p>
//             <p>With your new account, you can:</p>
//             <ul>
//               <li>Browse our extensive product catalog</li>
//               <li>Save your favorite items</li>
//               <li>Track your orders easily</li>
//               <li>Access exclusive promotions</li>
//             </ul>
//             <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
//             <div style="text-align: center;">
//               <a href="${process.env.WEBSITE_URL}" class="button">Visit Our Website</a>
//             </div>
//           </div>
//           <div class="footer">
//             <p>&copy; ${new Date().getFullYear()} Bag&Box. All rights reserved.</p>
//             <p>02-1127 14th St W, North Vancouver, BC, V7P 1J9</p>
//           </div>
//         </div>
//       </body>
//       </html>
//   `;

//   const mailOptions = {
//     from: `"Bag&Box" <${process.env.EMAIL_USER}>`,
//     to: user.email,
//     subject: `Welcome to Bag&Box, ${user.firstName}!`,
//     html: emailHtml
//   };

//   return transporter.sendMail(mailOptions);
// };

// // Function to send welcome SMS
// const sendWelcomeSMS = async (user) => {
//   const message = `Hi ${user.firstName}! Welcome to Bag&Box. Thank you for creating an account with us. If you have any questions, please contact our support team.`;
  
//   return twilioClient.messages.create({
//     body: message,
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to: user.phone
//   });
// };

// //register endpoint
// app.post("/api/register", async (req, res) => {
//   try {
//     const { 
//       email, 
//       password, 
//       phone, 
//       adminCode, 
//       firstName, 
//       lastName,
//       addresses, // Changed from address to addresses
//       company 
//     } = req.body;

//     // Check if email already exists
//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//       return res.status(400).send({ 
//         error: 'Email address is already registered. Please use a different email or try logging in.'
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const isAdmin = adminCode === process.env.ADMIN_CODE;

//     // Create user object with addresses array
//     const userData = { 
//       email: email.toLowerCase(),
//       password: hashedPassword, 
//       phone, 
//       isAdmin,
//       firstName,
//       lastName,
//       company: company || '',
//       addresses: [] // Initialize empty addresses array
//     };

//     // Add addresses if provided
//     if (addresses && Array.isArray(addresses) && addresses.length > 0) {
//       userData.addresses = addresses.map(addr => ({
//         street: addr.street || '',
//         city: addr.city || '',
//         state: addr.state || '',
//         postalCode: addr.postalCode || '',
//         country: addr.country || 'Canada'
//       }));
//     }

//     const user = new User(userData);
//     await user.save();

//     const token = jwt.sign(
//       { userId: user._id, isAdmin: user.isAdmin },
//       process.env.JWT_SECRET
//     );

//     // Remove password from response
//     const userResponse = user.toObject();
//     delete userResponse.password;

//     try {
//       sendWelcomeEmail(userResponse)
//         .catch(err => console.error('Error sending welcome email:', err));
      
//       // Only send SMS if a valid phone number is provided
//       if (phone && phone.trim()) {
//         sendWelcomeSMS(userResponse)
//           .catch(err => console.error('Error sending welcome SMS:', err));
//       }
//     } catch (messageError) {
//       // Log the error but don't fail registration
//       console.error('Error sending welcome messages:', messageError);
//     }

//     res.status(201).send({ user: userResponse, token });
//   } catch (error) {
//     console.error('Registration error:', error); // Add logging
//     if (error.code === 11000 && error.keyPattern?.email) {
//       return res.status(400).send({ 
//         error: 'Email address is already registered. Please use a different email or try logging in.'
//       });
//     }
//     res.status(400).send({ error: 'Registration failed. Please try again.' });
//   }
// });

// // app.post("/api/login", async (req, res) => {
// //   try {
// //     const { identifier, password } = req.body; // identifier can be email or phone
    
// //     // Find user by email or phone
// //     const user = await User.findOne({
// //       $or: [
// //         { email: identifier },
// //         { phone: identifier }
// //       ]
// //     });

// //     if (!user || !(await bcrypt.compare(password, user.password))) {
// //       throw new Error("Invalid login credentials");
// //     }

// //     const token = jwt.sign(
// //       { userId: user._id, isAdmin: user.isAdmin },
// //       process.env.JWT_SECRET
// //     );
// //     res.send({ user, token });
// //   } catch (error) {
// //     res.status(400).send(error);
// //   }
// // });
// app.post("/api/login", async (req, res) => {
//   try {
//     const { identifier, password } = req.body;
    
//     const user = await User.findOne({
//       $or: [
//         { email: identifier },
//         { phone: identifier }
//       ]
//     });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (user && !(await bcrypt.compare(password, user.password))) {
//       throw new Error("Invalid login credentials");
//     }  

//     // Track login activity
//     const loginActivity = new LoginActivity({
//       user: user._id,
//       ipAddress: req.ip,
//       location: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
//       device: req.headers['user-agent']
//     });
//     await loginActivity.save();

//     user.lastLogin = new Date();
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



// // Forgot Password Endpoint
// app.post("/api/forgot-password", async (req, res) => {
//   const { identifier } = req.body;
//   try {
//     const user = await User.findOne({ 
//       $or: [
//         { email: identifier },
//         { phone: identifier }
//       ]
//     });
    
//     // Always respond with the same message to avoid user enumeration
//     if (!user) {
//       return res.status(200).send({
//         message: "If that account exists, a password reset link or code has been sent."
//       });
//     }
    
//     // Generate a reset token and set its expiry (e.g., 1 hour)
//     const resetToken = crypto.randomBytes(20).toString('hex');
//     user.passwordResetToken = resetToken;
//     user.passwordResetExpires = Date.now() + 3600000; // 1 hour in ms
//     await user.save();

//     // Send reset instructions via email if the identifier is an email
//     if (user.email === identifier) {
//       // Use your CLIENT_URL environment variable for the frontend URL
//       const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

//       const mailOptions = {
//         to: user.email,
//         from: process.env.SMTP_USER,
//         subject: 'Password Reset',
//         text: `You are receiving this email because you (or someone else) have requested to reset your password.\n\n
//         Please click on the following link, or paste it into your browser to complete the process:\n\n
//         ${resetUrl}\n\n
//         If you did not request this, please ignore this email.\n`
//       };
//       await transporter.sendMail(mailOptions);
//     } else if (user.phone === identifier) {
//       const smsMessage = `Reset your password using this link:\n
//       /reset-password/${resetToken}`;
      
//       const accountSid = process.env.TWILIO_ACCOUNT_SID;
//       const authToken = process.env.TWILIO_AUTH_TOKEN;
//       const client = require('twilio')(accountSid, authToken);
      
//       await client.messages.create({
//         body: smsMessage,
//         from: process.env.TWILIO_PHONE_NUMBER,
//         to: user.phone
//       });
//     }
//     res.status(200).send({
//       message: "If that account exists, a password reset link or code has been sent."
//     });
//   } catch (error) {
//     res.status(500).send({ error: "Server error" });
//   }
// });

// // Reset Password Endpoint
// app.post("/api/reset-password", async (req, res) => {
//   const { token, newPassword } = req.body;
//   try {
//     const user = await User.findOne({ 
//       passwordResetToken: token,
//       passwordResetExpires: { $gt: Date.now() }
//     });
//     if (!user) {
//       return res.status(400).send({ error: "Password reset token is invalid or has expired." });
//     }
//     // Hash the new password and update the user record
//     user.password = await bcrypt.hash(newPassword, 10);
//     // Clear reset token and expiry
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     await user.save();
//     res.status(200).send({ message: "Password has been reset successfully." });
//   } catch (error) {
//     res.status(500).send({ error: "Server error" });
//   }
// });


// //Proudct routs
// // Lightweight product data without images
// app.get("/api/products/basic", async (req, res) => {
//   try {
//     const products = await Product.find()
//       .select('_id name description basePrice category isFeatured inStock minimumOrder') 
//       .populate('category', 'name')
//       .sort('-createdAt');

//     res.send(products);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// // Get single product image
// app.get("/api/products/:id/image", async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id)
//       .populate('images')
//       .select('images');
    
//     if (!product || !product.images || !product.images[0]) {
//       return res.status(404).send({ error: 'Image not found' });
//     }

//     const image = product.images[0];
//     res.send({
//       _id: image._id,
//       data: `data:${image.contentType};base64,${image.data.toString('base64')}`
//     });
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// app.post("/api/products", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can create products" });
//     }

//     const { 
//       name, category, basePrice, description, images, hasGST, hasPST,
//       // New fields
//       isFeatured, inStock, minimumOrder, sku, pricingTiers, 
//       weight, dimensions, metadata
//     } = req.body;
    
//     // Save images as Image documents
//     const imageIds = [];
//     for (const image of images) {
//       const { buffer, contentType } = base64ToBuffer(image);
//       const newImage = new Image({ data: buffer, contentType });
//       await newImage.save();
//       imageIds.push(newImage._id);
//     }

//     const product = new Product({
//       name,
//       category,
//       basePrice,
//       description,
//       images: imageIds,
//       hasGST,
//       hasPST,
//       // New fields
//       isFeatured: isFeatured || false,
//       inStock: inStock ?? true,
//       minimumOrder: minimumOrder || 1,
//       sku,
//       pricingTiers: pricingTiers || [],
//       weight,
//       dimensions,
//       metadata: {
//         keywords: metadata?.keywords || [],
//         searchTags: metadata?.searchTags || []
//       },
//       createdAt: new Date()
//     });
    
//     await product.save();
//     res.status(201).send(product);
//   } catch (error) {
//     console.error('Error creating product:', error);
//     res.status(400).send({
//       error: 'Error creating product',
//       details: error.message
//     });
//   }
// });

// // app.put("/api/products/:id", auth, async (req, res) => {
// //   try {
// //     if (!req.user.isAdmin) {
// //       return res.status(403).send({ error: "Only admins can update products" });
// //     }

// //     const existingProduct = await Product.findById(req.params.id);
// //     if (!existingProduct) {
// //       return res.status(404).send({ error: 'Product not found' });
// //     }

// //     const { 
// //       name, category, basePrice, description, images, hasGST, hasPST,
// //       // New fields
// //       isFeatured, inStock, minimumOrder, sku, pricingTiers,
// //       weight, dimensions, metadata
// //     } = req.body;

// //     // Handle image updates
// //     let updatedImageIds = [...existingProduct.images];
// //     if (images && Array.isArray(images)) {
// //       for (let i = 0; i < images.length; i++) {
// //         const image = images[i];
// //         if (image && image.startsWith('data:')) {
// //           const { buffer, contentType } = base64ToBuffer(image);
// //           if (i < updatedImageIds.length) {
// //             await Image.findByIdAndUpdate(updatedImageIds[i], {
// //               data: buffer,
// //               contentType
// //             });
// //           } else {
// //             const newImage = new Image({ data: buffer, contentType });
// //             await newImage.save();
// //             updatedImageIds.push(newImage._id);
// //           }
// //         }
// //       }
// //     }

// //     // Prepare update object
// //     const updateData = {
// //       name,
// //       category,
// //       basePrice,
// //       description,
// //       hasGST,
// //       hasPST,
// //       images: updatedImageIds,
// //       // New fields
// //       isFeatured,
// //       inStock,
// //       minimumOrder,
// //       sku,
// //       pricingTiers,
// //       weight,
// //       dimensions,
// //       metadata: {
// //         keywords: metadata?.keywords || existingProduct.metadata?.keywords || [],
// //         searchTags: metadata?.searchTags || existingProduct.metadata?.searchTags || []
// //       }
// //     };

// //     const updatedProduct = await Product.findByIdAndUpdate(
// //       req.params.id,
// //       { $set: updateData },
// //       { new: true }
// //     ).populate('images').populate('category');

// //     if (!updatedProduct) {
// //       throw new Error('Failed to update product');
// //     }

// //     // Format response
// //     const response = {
// //       ...updatedProduct.toObject(),
// //       images: updatedProduct.images.map(image => ({
// //         _id: image._id,
// //         data: `data:${image.contentType};base64,${image.data.toString('base64')}`
// //       })),
// //       category: updatedProduct.category ? {
// //         _id: updatedProduct.category._id,
// //         name: updatedProduct.category.name,
// //         description: updatedProduct.category.description
// //       } : null
// //     };

// //     res.json(response);
// //   } catch (error) {
// //     console.error('Error updating product:', error);
// //     res.status(400).send({
// //       error: 'Error updating product',
// //       details: error.message
// //     });
// //   }
// // });
// app.put("/api/products/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can update products" });
//     }

//     const existingProduct = await Product.findById(req.params.id);
//     if (!existingProduct) {
//       return res.status(404).send({ error: 'Product not found' });
//     }

//     const { 
//       name, category, basePrice, description, images, hasGST, hasPST,
//       isFeatured, inStock, minimumOrder, sku, pricingTiers,
//       weight, dimensions, metadata
//     } = req.body;

//     let updatedImageIds = [...existingProduct.images];
//     if (images && Array.isArray(images)) {
//       for (let i = 0; i < images.length; i++) {
//         const image = images[i];
//         if (image && image.startsWith('data:')) {
//           const { buffer, contentType } = base64ToBuffer(image);
//           if (i < updatedImageIds.length) {
//             await Image.findByIdAndUpdate(updatedImageIds[i], {
//               data: buffer,
//               contentType
//             });
//           } else {
//             const newImage = new Image({ data: buffer, contentType });
//             await newImage.save();
//             updatedImageIds.push(newImage._id);
//           }
//         }
//       }
//     }

//     const updateData = {
//       name,
//       category,
//       basePrice,
//       description,
//       hasGST,
//       hasPST,
//       images: updatedImageIds,
//       isFeatured,
//       inStock,
//       minimumOrder,
//       sku,
//       pricingTiers,
//       weight,
//       dimensions,
//       metadata: {
//         keywords: metadata?.keywords || existingProduct.metadata?.keywords || [],
//         searchTags: metadata?.searchTags || existingProduct.metadata?.searchTags || []
//       }
//     };

//     const updatedProduct = await Product.findByIdAndUpdate(
//       req.params.id,
//       { $set: updateData },
//       { new: true }
//     ).populate('images').populate('category');

//     // NEW: If product was previously out-of-stock and now is in stock, send notifications.
//     if (!existingProduct.inStock && updatedProduct.inStock) {
//       const notifications = await ProductNotification.find({ product: req.params.id, notified: false });
//       notifications.forEach(async (notification) => {
//         const emailHtml = `
//           <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #0056b3;">Good News!</h2>
//             <p>The product <strong>${updatedProduct.name}</strong> is now back in stock.</p>
//             <p>Visit our website to check it out: <a href="${process.env.CLIENT_URL}/customize/${updatedProduct._id}" style="color: #1a73e8;">Click here</a></p>
//             <hr style="border: none; border-top: 1px solid #ccc;" />
//             <p style="font-size: 12px; color: #777;">Thank you for choosing us.</p>
//           </div>
//         `;
//         let smsMessage = `Good news! "${updatedProduct.name}" is now in stock. Visit ${process.env.CLIENT_URL}/customize/${updatedProduct._id} for details.`;
//         if (notification.email) {
//           await transporter.sendMail({
//             to: notification.email,
//             from: process.env.SMTP_USER,
//             subject: 'Product Now Available',
//             html: emailHtml
//           });
//         }
//         if (notification.phone) {
//           try {
//             // Create message content
//             const smsMessage = `Good news! "${updatedProduct.name}" is now back in stock. Visit our website for details.`;
            
//             // Get Twilio credentials exactly as used in reset password
//             const accountSid = process.env.TWILIO_ACCOUNT_SID;
//             const authToken = process.env.TWILIO_AUTH_TOKEN;
//             const client = require('twilio')(accountSid, authToken);
            
//             await client.messages.create({
//               body: smsMessage,
//               from: process.env.TWILIO_PHONE_NUMBER,
//               to: notification.phone
//             });
            
//             console.log(`SMS sent to ${notification.phone}`);
//           } catch (smsError) {
//             console.error(`SMS send error to ${notification.phone}:`, smsError);
//           }
//         }
//         notification.notified = true;
//         await notification.save();
//       });
//     }


//     const response = {
//       ...updatedProduct.toObject(),
//       images: updatedProduct.images.map(image => ({
//         _id: image._id,
//         data: `data:${image.contentType};base64,${image.data.toString('base64')}`
//       })),
//       category: updatedProduct.category ? {
//         _id: updatedProduct.category._id,
//         name: updatedProduct.category.name,
//         description: updatedProduct.category.description
//       } : null
//     };

//     res.json(response);
//   } catch (error) {
//     console.error('Error updating product:', error);
//     res.status(400).send({
//       error: 'Error updating product',
//       details: error.message
//     });
//   }
// });


// app.delete("/api/products/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can delete products" });
//     }

//     console.log('Attempting to delete product:', req.params.id); // Debug log

//     // First check if the product exists
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       console.log('Product not found'); // Debug log
//       return res.status(404).send({ error: 'Product not found' });
//     }

//     // Check if the product is used in any existing orders
//     const ordersWithProduct = await Order.countDocuments({
//       'products.product': req.params.id
//     });

//     if (ordersWithProduct > 0) {
//       return res.status(400).send({ 
//         error: `Cannot delete product. It is used in ${ordersWithProduct} existing order(s).`
//       });
//     }

//     // Delete associated template images
//     if (product.templates && product.templates.length > 0) {
//       try {
//         await Image.deleteMany({ _id: { $in: product.templates } });
//         console.log('Associated images deleted'); // Debug log
//       } catch (imageError) {
//         console.error('Error deleting associated images:', imageError);
//         // Continue with product deletion even if image deletion fails
//       }
//     }

//     // Delete the product
//     const result = await Product.findByIdAndDelete(req.params.id);
    
//     console.log('Product deletion result:', result); // Debug log

//     res.send({ 
//       message: 'Product deleted successfully',
//       deletedProduct: product
//     });
//   } catch (error) {
//     console.error('Error deleting product:', error); // Detailed server-side error log
//     res.status(500).send({ 
//       error: 'Error deleting product', 
//       details: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// });

// app.get("/api/products", async (req, res) => {
//   try {
//     const products = await Product.find()
//       .populate('images')
//       .populate('category')
//       .sort('-createdAt');

//     const productsWithImages = products.map(product => {
//       const images = product.images.map(image => ({
//         _id: image._id,
//         data: `data:${image.contentType};base64,${image.data.toString('base64')}`
//       }));

//       return {
//         ...product.toObject(),
//         images,
//         category: product.category ? {
//           _id: product.category._id,
//           name: product.category.name,
//           description: product.category.description
//         } : null
//       };
//     });

//     res.send(productsWithImages);
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     res.status(500).send(error);
//   }
// });

// app.get("/api/products/:id", async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id)
//       .populate('images')
//       .populate('category');
      
//     if (!product) {
//       return res.status(404).send({ error: 'Product not found' });
//     }
    
//     // Format the product data
//     const productWithImages = {
//       ...product.toObject(),
//       images: product.images.map(image => ({
//         _id: image._id,
//         data: `data:${image.contentType};base64,${image.data.toString('base64')}`
//       })),
//       category: product.category ? {
//         _id: product.category._id,
//         name: product.category.name,
//         description: product.category.description
//       } : null
//     };

//     res.send(productWithImages);
//   } catch (error) {
//     console.error('Error fetching product:', error);
//     if (error.name === 'CastError') {
//       return res.status(400).send({ error: 'Invalid product ID format' });
//     }
//     res.status(500).send({ error: 'Error fetching product' });
//   }
// });

// // Category routes
// // Lightweight category data without images
// app.get("/api/categories/basic", async (req, res) => {
//   try {
//     const categories = await Category.find()
//       .select('_id name description')
//       .sort('-createdAt');
    
//     res.send(categories);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// // Get single category image
// app.get("/api/categories/:id/image", async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id)
//       .populate('image')
//       .select('image');
    
//     if (!category || !category.image) {
//       return res.status(404).send({ error: 'Image not found' });
//     }

//     res.send({
//       _id: category.image._id,
//       data: `data:${category.image.contentType};base64,${category.image.data.toString('base64')}`
//     });
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// app.post("/api/categories", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can create categories" });
//     }

//     const { name, description, image } = req.body;
//     let imageId;

//     if (image) {
//       const { buffer, contentType } = base64ToBuffer(image);
//       const newImage = new Image({ data: buffer, contentType });
//       await newImage.save();
//       imageId = newImage._id;
//     }

//     const category = new Category({
//       name,
//       description,
//       image: imageId
//     });

//     await category.save();
//     res.status(201).send(category);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// app.get("/api/categories", async (req, res) => {
//   try {
//     const categories = await Category.find().populate('image');
//     const categoriesWithImages = categories.map(category => {
//       if (category.image) {
//         return {
//           ...category.toObject(),
//           image: {
//             _id: category.image._id,
//             data: `data:${category.image.contentType};base64,${category.image.data.toString('base64')}`
//           }
//         };
//       }
//       return category.toObject();
//     });
//     res.send(categoriesWithImages);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// app.put("/api/categories/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can update categories" });
//     }

//     const { name, description, image } = req.body;
//     const updateData = { name, description };

//     if (image) {
//       const { buffer, contentType } = base64ToBuffer(image);
//       const newImage = new Image({ data: buffer, contentType });
//       await newImage.save();
//       updateData.image = newImage._id;
//     }

//     const category = await Category.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true }
//     ).populate('image');

//     if (!category) {
//       return res.status(404).send({ error: 'Category not found' });
//     }

//     res.send(category);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// app.delete("/api/categories/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can delete categories" });
//     }

//     console.log('Attempting to delete category:', req.params.id); // Debug log

//     // First check if the category exists
//     const category = await Category.findById(req.params.id);
//     if (!category) {
//       console.log('Category not found'); // Debug log
//       return res.status(404).send({ error: 'Category not found' });
//     }

//     // Check if any products are using this category
//     const productsCount = await Product.countDocuments({ category: req.params.id });
//     console.log('Products using this category:', productsCount); // Debug log

//     if (productsCount > 0) {
//       return res.status(400).send({ 
//         error: `Cannot delete category. It is being used by ${productsCount} product(s). Please reassign or delete these products first.`
//       });
//     }

//     // Delete associated image if exists
//     if (category.image) {
//       try {
//         await Image.findByIdAndDelete(category.image);
//         console.log('Associated image deleted'); // Debug log
//       } catch (imageError) {
//         console.error('Error deleting associated image:', imageError);
//       }
//     }

//     // Delete the category
//     const result = await Category.findByIdAndDelete(req.params.id);
//     console.log('Category deletion result:', result); // Debug log

//     res.send({ 
//       message: 'Category deleted successfully',
//       deletedCategory: category
//     });
//   } catch (error) {
//     console.error('Error in category deletion:', error); // Server-side error log
//     res.status(500).send({ 
//       error: 'Error deleting category', 
//       details: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// });

// app.post('/api/templates', auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: 'Only admins can create templates' });
//     }

//     const { name, category, elements, preview } = req.body;
    
//     // Validate required fields
//     if (!name || !category || !elements || !preview) {
//       return res.status(400).send({ 
//         error: 'Missing required fields',
//         details: {
//           name: !name ? 'Name is required' : null,
//           category: !category ? 'Category is required' : null,
//           elements: !elements ? 'Elements are required' : null,
//           preview: !preview ? 'Preview is required' : null
//         }
//       });
//     }

//     // Validate category exists
//     const categoryExists = await Category.findById(category);
//     if (!categoryExists) {
//       return res.status(400).send({ error: 'Invalid category ID' });
//     }

//     const template = new Template({
//       name,
//       category,
//       elements,
//       preview,
//       createdBy: req.user._id
//     });

//     await template.save();
    
//     // Populate references before sending response
//     await template.populate('category createdBy', 'name email');
    
//     res.status(201).send(template);
//   } catch (error) {
//     console.error('Template creation error:', error);
//     res.status(400).send({ 
//       error: 'Error creating template',
//       details: error.message 
//     });
//   }
// });

// app.get('/api/templates', async (req, res) => {
//   try {
//     const templates = await Template.find()
//       .populate('category', 'name')
//       .populate('createdBy', 'email')
//       .sort('-createdAt');
//     res.send(templates);
//   } catch (error) {
//     console.error('Error fetching templates:', error);
//     res.status(500).send({ error: 'Error fetching templates' });
//   }
// });

// app.put('/api/templates/:id', auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: 'Only admins can update templates' });
//     }

//     const { name, category, elements, preview } = req.body;
    
//     // Validate required fields
//     if (!name || !category || !elements || !preview) {
//       return res.status(400).send({ error: 'Missing required fields' });
//     }

//     const template = await Template.findByIdAndUpdate(
//       req.params.id,
//       { name, category, elements, preview },
//       { new: true }
//     ).populate('category createdBy', 'name email');
    
//     if (!template) {
//       return res.status(404).send({ error: 'Template not found' });
//     }
    
//     res.send(template);
//   } catch (error) {
//     console.error('Template update error:', error);
//     res.status(400).send({ error: 'Error updating template' });
//   }
// });

// app.delete('/api/templates/:id', auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: 'Only admins can delete templates' });
//     }

//     const template = await Template.findByIdAndDelete(req.params.id);
    
//     if (!template) {
//       return res.status(404).send({ error: 'Template not found' });
//     }
    
//     res.send({ message: 'Template deleted successfully' });
//   } catch (error) {
//     console.error('Template deletion error:', error);
//     res.status(500).send({ error: 'Error deleting template' });
//   }
// });


// // Get template fields
// app.get('/api/templates/:id/fields', async (req, res) => {
//   try {
//     const template = await Template.findById(req.params.id);
//     if (!template) {
//       return res.status(404).send({ error: 'Template not found' });
//     }
    
//     const fields = template.requiredFields || [];
//     res.json(fields);
//   } catch (error) {
//     console.error('Error fetching template fields:', error);
//     res.status(500).send({ error: 'Error fetching template fields' });
//   }
// });

// // Save customization preview
// app.post('/api/customizations/preview', auth, async (req, res) => {
//   try {
//     const { preview, customFields, templateId } = req.body;
    
//     // Store preview temporarily (you might want to use a separate collection or temporary storage)
//     const previewId = new mongoose.Types.ObjectId();
    
//     res.json({ 
//       previewId: previewId.toString(),
//       preview,
//       customFields 
//     });
//   } catch (error) {
//     console.error('Error saving customization preview:', error);
//     res.status(500).send({ error: 'Error saving customization preview' });
//   }
// });



// // Coupon routs
// // POST endpoint for creating coupons
// app.post("/api/coupons", auth, async (req, res) => {
//   try {
//     // Only admin can create coupons
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can create coupons" });
//     }

//     const { 
//       code, 
//       discountType, 
//       discountValue, 
//       startDate, 
//       endDate, 
//       maxUsesPerUser, 
//       assignedUsers 
//     } = req.body;

//     // Validate input
//     if (!code || !discountType || !discountValue || !startDate || !endDate) {
//       return res.status(400).send({ error: "Missing required coupon details" });
//     }

//     // Check if coupon code already exists
//     const existingCoupon = await Coupon.findOne({ code });
//     if (existingCoupon) {
//       return res.status(400).send({ error: "Coupon code already exists" });
//     }

//     // Validate discount value
//     if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
//       return res.status(400).send({ error: "Percentage discount must be between 0 and 100" });
//     }

//     if (discountType === 'fixed' && discountValue <= 0) {
//       return res.status(400).send({ error: "Fixed discount must be greater than 0" });
//     }

//     // Validate dates
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     if (end <= start) {
//       return res.status(400).send({ error: "End date must be after start date" });
//     }

//     // Create new coupon with user usage tracking
//     const newCoupon = new Coupon({
//       code,
//       discountType,
//       discountValue,
//       startDate: start,
//       endDate: end,
//       maxUsesPerUser: maxUsesPerUser || 0,
//       assignedUsers: assignedUsers || [],
//       userUsage: [], // Initialize empty usage tracking
//       createdBy: req.user._id,
//       isActive: true
//     });

//     await newCoupon.save();

//     // Populate user references before sending response
//     await newCoupon.populate([
//       { path: 'createdBy', select: 'email' },
//       { path: 'assignedUsers', select: 'email' }
//     ]);

//     res.status(201).send({
//       ...newCoupon.toObject(),
//       assignedUsers: newCoupon.assignedUsers.map(user => ({
//         _id: user._id,
//         email: user.email
//       }))
//     });

//   } catch (error) {
//     console.error('Coupon creation error:', error);
//     res.status(500).send({ 
//       error: "Error creating coupon",
//       details: error.message 
//     });
//   }
// });

// app.post("/api/coupons/validate", auth, async (req, res) => {
//   try {
//     const { couponCode, orderTotal } = req.body;

//     // Find the coupon
//     const coupon = await Coupon.findOne({ 
//       code: couponCode,
//       isActive: true,
//       startDate: { $lte: new Date() },
//       endDate: { $gte: new Date() }
//     });

//     // Check coupon existence
//     if (!coupon) {
//       return res.status(404).send({ error: "Invalid or expired coupon" });
//     }

//     // Check if coupon is assigned to specific users
//     if (coupon.assignedUsers.length > 0 && 
//         !coupon.assignedUsers.some(userId => userId.toString() === req.user._id.toString())) {
//       return res.status(403).send({ error: "Coupon not available for this user" });
//     }

//     // Check user's usage count
//     const userUsage = coupon.userUsage.find(
//       usage => usage.user.toString() === req.user._id.toString()
//     );

//     if (coupon.maxUsesPerUser > 0 && userUsage && userUsage.usageCount >= coupon.maxUsesPerUser) {
//       return res.status(400).send({ 
//         error: `You have reached the maximum usage limit (${coupon.maxUsesPerUser}) for this coupon`
//       });
//     }

//     // Calculate discount
//     let discountAmount = 0;
//     if (coupon.discountType === 'percentage') {
//       discountAmount = orderTotal * (coupon.discountValue / 100);
//     } else {
//       discountAmount = coupon.discountValue;
//     }

//     // Update user usage count
//     if (!userUsage) {
//       coupon.userUsage.push({
//         user: req.user._id,
//         usageCount: 1
//       });
//     } else {
//       userUsage.usageCount += 1;
//     }
//     await coupon.save();

//     res.send({
//       message: "Coupon applied successfully",
//       discountAmount,
//       couponDetails: {
//         code: coupon.code,
//         discountType: coupon.discountType,
//         discountValue: coupon.discountValue,
//         remainingUses: coupon.maxUsesPerUser > 0 ? 
//           coupon.maxUsesPerUser - (userUsage ? userUsage.usageCount : 1) : 
//           'Unlimited'
//       }
//     });
//   } catch (error) {
//     console.error('Coupon validation error:', error);
//     res.status(500).send({ error: "Error validating coupon" });
//   }
// });

// // Get all coupons
// app.get("/api/coupons", auth, async (req, res) => {
//   try {
//     // If admin, return all coupons
//     if (req.user.isAdmin) {
//       const coupons = await Coupon.find()
//         .populate('createdBy', 'email')
//         .populate('assignedUsers', 'email');
//       return res.send(coupons);
//     }

//     // For regular users, return applicable coupons
//     const now = new Date();
//     const userCoupons = await Coupon.find({
//       $or: [
//         { assignedUsers: req.user._id },
//         { assignedUsers: { $size: 0 } } // Coupons with no specific user assignment
//       ],
//       isActive: true,
//       startDate: { $lte: now },
//       endDate: { $gte: now },
//       $or: [
//         { maxUses: 0 }, // Unlimited use coupons
//         { currentUses: { $lt: '$maxUses' } } // Coupons not yet fully used
//       ]
//     });

//     res.send(userCoupons);
//   } catch (error) {
//     console.error('Error fetching coupons:', error);
//     res.status(500).send({ error: "Error retrieving coupons" });
//   }
// });

// // Update a coupon
// app.put("/api/coupons/:id", auth, async (req, res) => {
//   try {
//     // Only admin can update coupons
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can update coupons" });
//     }

//     const { id } = req.params;
//     const updateData = req.body;

//     // Prevent changing certain fields
//     delete updateData._id;
//     delete updateData.createdBy;
//     delete updateData.createdAt;

//     const updatedCoupon = await Coupon.findByIdAndUpdate(
//       id, 
//       updateData, 
//       { new: true, runValidators: true }
//     );

//     if (!updatedCoupon) {
//       return res.status(404).send({ error: "Coupon not found" });
//     }

//     res.send(updatedCoupon);
//   } catch (error) {
//     console.error('Coupon update error:', error);
//     res.status(500).send({ error: "Error updating coupon" });
//   }
// });

// // Delete a coupon
// app.delete("/api/coupons/:id", auth, async (req, res) => {
//   try {
//     // Only admin can delete coupons
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can delete coupons" });
//     }

//     const { id } = req.params;

//     const deletedCoupon = await Coupon.findByIdAndDelete(id);

//     if (!deletedCoupon) {
//       return res.status(404).send({ error: "Coupon not found" });
//     }

//     res.send({ 
//       message: "Coupon deleted successfully",
//       deletedCoupon 
//     });
//   } catch (error) {
//     console.error('Coupon deletion error:', error);
//     res.status(500).send({ error: "Error deleting coupon" });
//   }
// });

// // Payment routes
// app.post("/api/create-payment-intent", auth, async (req, res) => {
//   try {
//     const { amount } = req.body;
    
//     if (!amount || amount <= 0) {
//       return res.status(400).json({ 
//         error: 'Invalid amount provided' 
//       });
//     }

//     console.log('Creating payment intent for amount:', amount); // Debug log

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(amount * 100), // Convert to cents
//       currency: 'cad',
//       metadata: {
//         integration_check: 'accept_a_payment',
//       },
//       payment_method_types: ['card'],
//     });

//     console.log('Payment intent created:', paymentIntent.id); // Debug log
    
//     res.json({
//       clientSecret: paymentIntent.client_secret
//     });
//   } catch (error) {
//     console.error('Stripe error:', error); // Debug log
//     res.status(400).json({
//       error: {
//         message: error.message || 'An error occurred with the payment'
//       }
//     });
//   }
// });
// // app.post("/api/create-payment-intent", auth, async (req, res) => {
// //   try {
// //     const { amount } = req.body;
    
// //     if (!amount || amount <= 0) {
// //       return res.status(400).json({ 
// //         error: 'Invalid amount provided' 
// //       });
// //     }

// //     const paymentIntent = await stripe.paymentIntents.create({
// //       amount: Math.round(amount * 100), // Convert to cents
// //       currency: 'cad',
// //       payment_method_types: ['card'],
// //       metadata: {
// //         userId: req.user._id.toString(),
// //         integration_check: 'accept_a_payment',
// //       }
// //     });

// //     res.json({
// //       clientSecret: paymentIntent.client_secret
// //     });
// //   } catch (error) {
// //     console.error('Stripe error:', error);
// //     res.status(400).json({
// //       error: {
// //         message: error.message || 'An error occurred with the payment'
// //       }
// //     });
// //   }
// // });

// // Cart routes
// app.get('/api/cart', auth, async (req, res) => {
//   try {
//     let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
//     if (!cart) {
//       cart = new Cart({ user: req.user._id, items: [] });
//       await cart.save();
//     }
//     res.send(cart);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// app.post('/api/cart/add', auth, async (req, res) => {
//   try {
//     const { product, quantity, customization } = req.body;

//     if (!product || !product._id) {
//       return res.status(400).json({ error: 'Invalid product data' });
//     }

//     const cartItem = {
//       product: product._id,
//       quantity: quantity || 1,
//       customization: {
//         template: customization.template,
//         preview: customization.preview,
//         description: customization.description,
//         customFields: customization.customFields,
//         requiredFields: customization.requiredFields
//       }
//     };

//     let cart = await Cart.findOne({ user: req.user._id });
//     if (!cart) {
//       cart = new Cart({
//         user: req.user._id,
//         items: [cartItem]
//       });
//     } else {
//       cart.items.push(cartItem);
//     }

//     await cart.save();
    
//     // Populate the cart before sending response
//     await cart.populate('items.product');
    
//     res.status(200).json({
//       message: 'Item added to cart successfully',
//       cart: cart
//     });
//   } catch (error) {
//     console.error('Server error in cart addition:', error);
//     res.status(500).json({
//       error: 'Error adding item to cart',
//       details: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// });
  
// app.put('/api/cart/:index', auth, async (req, res) => {
//   try {
//     const { quantity, customization } = req.body;
//     const cart = await Cart.findOne({ user: req.user._id });
    
//     if (!cart) {
//       return res.status(404).send({ error: 'Cart not found' });
//     }

//     if (!cart.items[req.params.index]) {
//       return res.status(404).send({ error: 'Cart item not found' });
//     }

//     // Update quantity if provided
//     if (quantity !== undefined) {
//       cart.items[req.params.index].quantity = quantity;
//     }

//     // Update customization if provided
//     if (customization) {
//       cart.items[req.params.index].customization = {
//         template: customization.template,
//         preview: customization.preview,
//         customFields: customization.customFields.map(field => ({
//           fieldId: field.fieldId,
//           type: field.type,
//           imageUrl: field.imageUrl,
//           content: field.content,
//           properties: field.properties
//         })),
//         requiredFields: customization.requiredFields.map(field => ({
//           fieldId: field.fieldId,
//           type: field.type,
//           imageUrl: field.imageUrl || null,
//           value: field.value
//         })),
//         description: customization.description
//       };
//     }

//     await cart.save();
//     await cart.populate('items.product');
//     res.json(cart);
//   } catch (error) {
//     console.error('Error updating cart:', error);
//     res.status(400).send({ error: 'Error updating cart item' });
//   }
// });

// app.delete('/api/cart/:index', auth, async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ user: req.user._id });
//     cart.items.splice(req.params.index, 1);
//     await cart.save();
//     res.send(cart);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// app.delete('/api/cart', auth, async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ user: req.user._id });
//     cart.items = [];
//     await cart.save();
//     res.send(cart);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });


// // Rout of Upload pictures in Porudtc Customization -> cart -> order
// app.post('/api/upload-image', uploadLimiter, upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     // Generate a unique filename
//     const ext = path.extname(req.file.originalname);
//     const filename = `${Date.now()}_${req.file.originalname}`;
//     const filepath = path.join(__dirname, 'upload', filename);

//     // Move file to final location
//     fs.renameSync(req.file.path, filepath);

//     // Create response
//     const fileUrl = `/upload/${filename}`;
    
//     res.json({ 
//       filePath: fileUrl,
//       mime: req.file.mimetype
//     });
//   } catch (error) {
//     console.error('Upload error:', error);
//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
//     res.status(500).json({ error: 'Upload failed' });
//   }
// });

// // Add error handling middleware for multer errors if you don't already have it
// app.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({
//       error: 'File upload error: ' + err.message
//     });
//   } else if (err.message === 'Invalid file type. Only images are allowed.') {
//     return res.status(400).json({
//       error: err.message
//     });
//   }
//   next(err);
// });


// // // Endpoint to save the full–resolution image
// // app.post('/api/upload-image', auth, upload.single('image'), (req, res) => {
// //   if (!req.file) {
// //     return res.status(400).json({ error: 'No file uploaded' });
// //   }
// //   // Respond with the file path relative to your public/static folder (adjust as needed)
// //   res.json({ filePath: `/upload/${req.file.filename}` });
// // });

// // Endpoint to save the thumbnail image
// app.post('/api/upload-thumbnail', auth, upload.single('thumbnail'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }
//   res.json({ filePath: `/upload/${req.file.filename}` });
// });



// //Order Routs
// app.post("/api/orders", auth, async (req, res) => {
//   try {
//     const { products, totalAmount, status, paymentMethod, paymentId, coupon } = req.body;

//     // Validate required fields
//     if (!products || !Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ 
//         error: 'Invalid products data',
//         details: 'Products array is required and must not be empty'
//       });
//     }

//     if (!totalAmount || totalAmount <= 0) {
//       return res.status(400).json({ 
//         error: 'Invalid total amount',
//         details: 'Total amount must be greater than 0'
//       });
//     }

//     // If a coupon was applied, validate it again
//       if (coupon && coupon.code) { 
//     try {
//         const couponValidation = await Coupon.findOne({ 
//           code: coupon.code,
//           isActive: true,
//           startDate: { $lte: new Date() },
//           endDate: { $gte: new Date() }
//         });

//         if (!couponValidation) {
//           return res.status(400).json({ 
//             error: 'Invalid or expired coupon'
//           });
//         }

//         // Update coupon usage
//         await Coupon.findOneAndUpdate(
//           { code: coupon.code },
//           { $inc: { currentUses: 1 } }
//         );
//       } catch (couponError) {
//         console.error('Coupon validation error:', couponError);
//         return res.status(400).json({ 
//           error: 'Error processing coupon',
//           details: couponError.message
//         });
//       }
//     }

//     // Create order with coupon details
//     const orderData = {
//       user: req.user._id,
//       products: products.map(item => ({
//         product: item.product,
//         quantity: item.quantity,
//         customization: {
//           template: item.customization?.template || null,
//           preview: item.customization?.preview || null,
//           description: item.customization?.description || '',
//           customFields: item.customization?.customFields || [],
//           requiredFields: item.customization?.requiredFields || []
//         }
//       })),
//       totalAmount,
//       status: status || 'pending',
//       paymentMethod,
//       paymentId,
//       coupon: coupon ? {
//         code: coupon.code,
//         discountAmount: coupon.discountAmount,
//         discountType: coupon.discountType,
//         discountValue: coupon.discountValue
//       } : null
//     };

//     const order = new Order(orderData);
//     await order.save();

//     // Process and store images for each product
//     for (let productIndex = 0; productIndex < products.length; productIndex++) {
//       const product = products[productIndex];
//       console.log(`Processing product ${productIndex}:`, {
//         productId: product.product,
//         hasCustomization: !!product.customization
//       });

//       if (product.customization?.customFields) {
//         try {
//           await processOrderImages(
//             order._id,
//             productIndex,
//             product.customization.customFields
//           );
//         } catch (imageError) {
//           console.error(`Error processing images for product ${productIndex}:`, imageError);
//           // Continue with order creation even if image processing fails
//         }
//       }
//     }

//     // Fetch the complete order with populated fields
//     const populatedOrder = await Order.findById(order._id)
//       .populate({
//         path: 'products.product',
//         model: 'Product'
//       })
//       .populate('user');

//     res.status(201).send(populatedOrder);
//   } catch (error) {
//     console.error('Order creation error:', error);
//     res.status(400).json({
//       error: 'Failed to create order',
//       details: error.message
//     });
//   }
// });

// app.put("/api/orders/:id/status", auth, async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     const { status } = req.body;
    
//     // Validate the status
//     const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ error: 'Invalid status value' });
//     }
    
//     // Only admins should be able to update order status
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: 'Only admins can update order status' });
//     }
    
//     // Find and update the order
//     const updatedOrder = await Order.findByIdAndUpdate(
//       orderId, 
//       { status }, 
//       { new: true }
//     ).populate('user');
    
//     if (!updatedOrder) {
//       return res.status(404).json({ error: 'Order not found' });
//     }
    
//     // Create a notification for the customer
//     const notification = new Notification({
//       user: updatedOrder.user._id,
//       message: `Your order #${orderId.slice(-6)} status has been updated to ${status}`,
//       type: 'order',
//       link: `/orders/${orderId}`
//     });
    
//     await notification.save();
    
//     // Send response
//     res.json({ 
//       message: 'Order status updated successfully',
//       order: updatedOrder
//     });
//   } catch (error) {
//     console.error('Error updating order status:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// app.put("/api/orders/:id/status", auth, async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     const { status } = req.body;
    
//     // Validate the status
//     const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ error: 'Invalid status value' });
//     }
    
//     // Only admins should be able to update order status
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: 'Only admins can update order status' });
//     }
    
//     // Find the order
//     const order = await Order.findById(orderId);
    
//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }
    
//     // Record the previous status for notification
//     const previousStatus = order.status;
    
//     // Update the order status
//     order.status = status;
    
//     // Set the updatedAt timestamp for metrics calculation
//     order.updatedAt = new Date();
    
//     await order.save();
    
//     // Create a notification for the customer
//     const notification = new Notification({
//       user: order.user,
//       message: `Your order #${orderId.slice(-6)} status has been updated from ${previousStatus} to ${status}`,
//       type: 'order',
//       link: `/orders/${orderId}`
//     });
    
//     await notification.save();
    
//     // Send response
//     res.json({ 
//       message: 'Order status updated successfully',
//       order: {
//         _id: order._id,
//         status: order.status,
//         updatedAt: order.updatedAt
//       }
//     });
//   } catch (error) {
//     console.error('Error updating order status:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // endpoint to get individual customization files
// app.get('/api/orders/:orderId/products/:productIndex/files/:fieldId', auth, async (req, res) => {
//   try {
//     const { orderId, productIndex, fieldId } = req.params;
//     const order = await Order.findById(orderId).populate('products.product');
    
//     if (!order) return res.status(404).send({ error: 'Order not found' });
    
//     const product = order.products[productIndex];
//     if (!product) return res.status(404).send({ error: 'Product not found' });
    
//     const customField = product.customization?.customFields?.find(f => f.fieldId === fieldId);
//     const requiredField = product.customization?.requiredFields?.find(f => f.fieldId === fieldId);
//     const field = customField || requiredField;
    
//     if (!field) return res.status(404).send({ error: 'Field not found' });
    
//     if (field.type === 'image' || field.type === 'logo') {
//       const imageData = field.content; // Original file data
//       if (!imageData) return res.status(404).send({ error: 'Image data not found' });
      
//       const binary = Buffer.from(imageData.split(',')[1], 'base64');
//       res.setHeader('Content-Type', 'image/png');
//       res.setHeader('Content-Disposition', `attachment; filename=${fieldId}_original.png`);
//       res.send(binary);
//     } else {
//       res.setHeader('Content-Type', 'text/plain');
//       res.setHeader('Content-Disposition', `attachment; filename=${fieldId}.txt`);
//       res.send(field.content || field.value);
//     }
//   } catch (error) {
//     console.error('Download error:', error);
//     res.status(500).send({ error: 'Server error' });
//   }
// });

// app.get("/api/orders", auth, async (req, res) => {
//   try {
//     let orders;
//     if (req.user.isAdmin) {
//       orders = await Order.find()
//         .populate('user')
//         .populate('products.product')
//         .sort({ createdAt: -1 });
//     } else {
//       orders = await Order.find({ user: req.user._id })
//         .populate('products.product')
//         .sort({ createdAt: -1 });
//     }
//     res.send(orders);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// app.get("/api/orders/:id/download", auth, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id)
//       .populate('user')
//       .populate('products.product');

//     if (!order) {
//       return res.status(404).send({ error: 'Order not found' });
//     }

//     if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
//       return res.status(403).send({ error: 'Not authorized' });
//     }

//     // Create the PDF document
//     const PDFDocument = require('pdfkit');
//     const path = require('path');
//     const doc = new PDFDocument({ margin: 50 });

//     // Set response headers for PDF
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=order-${order._id}.pdf`);
//     doc.pipe(res);

//     // --- Header ---
//     // Left side: Website title "BAG&BOX"
//     doc
//       .font('Helvetica-Bold')
//       .fontSize(20)
//       .fillColor('#333')
//       .text('BAG&BOX', 50, 30);

//     // Right side: Logo image (adjust the path as needed)
//     const logoPath = path.join(process.cwd(), 'logo.png');
//     try {
//       doc.image(logoPath, doc.page.width - 150, 15, { width: 100 });
//     } catch (err) {
//       console.error("Logo image could not be loaded:", err);
//     }
//     // Draw a line under the header
//     doc.moveTo(50, 70).lineTo(doc.page.width - 50, 70).stroke();

//     // --- Order Details ---
//     doc.moveDown();
//     doc
//       .fontSize(16)
//       .fillColor('#444')
//       .text('Order Details', { align: 'center' });
//     doc.moveDown();

//     doc.fontSize(12).fillColor('#000');
//     const labelX = 50;
//     const valueX = 150;
//     let currentY = doc.y;

//     doc.text(`Order ID:`, labelX, currentY);
//     doc.text(`${order._id}`, valueX, currentY);
//     doc.moveDown();

//     currentY = doc.y;
//     doc.text(`Date:`, labelX, currentY);
//     doc.text(`${new Date(order.createdAt).toLocaleString()}`, valueX, currentY);
//     doc.moveDown();

//     currentY = doc.y;
//     doc.text(`Customer:`, labelX, currentY);
//     doc.text(`${order.user.email}`, valueX, currentY);
//     doc.moveDown();

//     currentY = doc.y;
//     doc.text(`Total Amount:`, labelX, currentY);
//     doc.text(`$${order.totalAmount.toFixed(2)}`, valueX, currentY);
//     doc.moveDown();

//     // --- Coupon Section ---
//     if (order.coupon && order.coupon.code) {
//       doc.moveDown();
//       doc.fontSize(14)
//          .fillColor('#444')
//          .text('Coupon Details', { align: 'center' });
//       doc.moveDown();

//       doc.fontSize(12).fillColor('#000');
//       currentY = doc.y;
//       doc.text(`Coupon Code:`, labelX, currentY);
//       doc.text(`${order.coupon.code}`, valueX, currentY);
//       doc.moveDown();

//       if (order.coupon.discountType) {
//         currentY = doc.y;
//         doc.text(`Discount Type:`, labelX, currentY);
//         doc.text(`${order.coupon.discountType}`, valueX, currentY);
//         doc.moveDown();
//       }
//       if (order.coupon.discountValue) {
//         currentY = doc.y;
//         doc.text(`Discount Value:`, labelX, currentY);
//         doc.text(`${order.coupon.discountValue}`, valueX, currentY);
//         doc.moveDown();
//       }
//       if (order.coupon.discountAmount) {
//         currentY = doc.y;
//         doc.text(`Discount Amount:`, labelX, currentY);
//         doc.text(`$${order.coupon.discountAmount}`, valueX, currentY);
//         doc.moveDown();
//       }
//       // Draw a line after coupon details
//       doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
//       doc.moveDown();
//     }

//     // --- Products Table ---
//     doc.font('Helvetica-Bold').fontSize(12);
//     doc.text('Products', 50, doc.y, { underline: true });
//     doc.moveDown();

//     // Table headers for products
//     const tableTop = doc.y;
//     doc.font('Helvetica-Bold');
//     doc.text('Product', 50, tableTop);
//     doc.text('Quantity', 250, tableTop);
//     doc.text('Details', 350, tableTop);
//     doc.moveDown();
//     doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
//     doc.moveDown();

//     // Loop through products and add details (without customization)
//     doc.font('Helvetica').fontSize(12);
//     order.products.forEach(item => {
//       const productName = item.product.name;
//       const quantity = item.quantity;
//       // Additional product details – adjust fields as per your schema.
//       const productDescription = item.product.description || 'No description available';
//       const productPrice = item.product.price ? `$${item.product.price.toFixed(2)}` : 'Price not available';
      
//       let productDetails = `Description: ${productDescription}\nPrice: ${productPrice}`;

//       const yBefore = doc.y;
//       doc.text(productName, 50, yBefore);
//       doc.text(quantity.toString(), 250, yBefore);
//       doc.text(productDetails, 350, yBefore, { width: 200 });
//       doc.moveDown();
//       doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
//       doc.moveDown();
//     });

//     // --- Footer ---
//     // Add a simple footer with the current page number.
//     const addFooter = () => {
//       doc.fontSize(8)
//          .fillColor('#555')
//          .text(`Page ${doc.page.number}`, 50, doc.page.height - 50, {
//            align: 'center',
//            width: doc.page.width - 100
//          });
//     };

//     // Attach footer on the first page
//     addFooter();
//     // Add footer on subsequent pages (if any)
//     doc.on('pageAdded', addFooter);

//     // Finalize the PDF and end the stream
//     doc.end();
//   } catch (error) {
//     console.error('Download error:', error);
//     res.status(500).send({ error: 'Server error', details: error.message });
//   }
// });


// // app.get("/api/orders/:id/download", auth, async (req, res) => {
// //   try {
// //     const order = await Order.findById(req.params.id)
// //       .populate('user')
// //       .populate('products.product');

// //     if (!order) {
// //       return res.status(404).send({ error: 'Order not found' });
// //     }

// //     if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
// //       return res.status(403).send({ error: 'Not authorized' });
// //     }

// //     // Generate PDF report
// //     const PDFDocument = require('pdfkit');
// //     const doc = new PDFDocument();
    
// //     // Set response headers
// //     res.setHeader('Content-Type', 'application/pdf');
// //     res.setHeader('Content-Disposition', `attachment; filename=order-${order._id}.pdf`);

// //     doc.pipe(res);

// //     // Add content to PDF
// //     doc.fontSize(20).text('Order Details', { align: 'center' });
// //     doc.moveDown();
// //     doc.fontSize(12).text(`Order ID: ${order._id}`);
// //     doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
// //     doc.text(`Customer: ${order.user.email}`);
// //     doc.text(`Total Amount: $${order.totalAmount.toFixed(2)}`);
    
// //     doc.moveDown();
// //     doc.text('Products:', { underline: true });
    
// //     order.products.forEach(item => {
// //       doc.moveDown();
// //       doc.text(`Product: ${item.product.name}`);
// //       doc.text(`Quantity: ${item.quantity}`);
// //       if (item.customization?.customText) {
// //         doc.text(`Custom Text: ${item.customization.customText}`);
// //       }
// //       if (item.customization?.description) {
// //         doc.text(`Description: ${item.customization.description}`);
// //       }
// //     });

// //     doc.end();
// //   } catch (error) {
// //     res.status(500).send(error);
// //   }
// // });

// app.get('/api/orders/:orderId/customization/:fieldId', auth, async (req, res) => {
//   try {
//     const { orderId, fieldId } = req.params;
//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res.status(404).send({ error: 'Order not found' });
//     }
//     if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
//       return res.status(403).send({ error: 'Not authorized' });
//     }
//     let foundField = null;
//     // Iterate over order.products (not order.items)
//     order.products.forEach(item => {
//       const customField = item.customization?.customFields?.find(f => f.fieldId === fieldId);
//       const requiredField = item.customization?.requiredFields?.find(f => f.fieldId === fieldId);
//       if (customField || requiredField) {
//         foundField = customField || requiredField;
//       }
//     });
//     if (!foundField) {
//       return res.status(404).send({ error: 'Customization field not found' });
//     }
//     if (foundField.type === 'image' || foundField.type === 'logo') {
//       const imageData = foundField.content; // or foundField.value for required fields
//       if (!imageData) return res.status(404).send({ error: 'Image data not found' });
      
//       // If the stored image data is a file reference (e.g. starts with "/upload/")
//       if (typeof imageData === 'string' && imageData.startsWith('/upload/')) {
//         const fullPath = path.join(__dirname, imageData);
//         return res.sendFile(fullPath);
//       }
      
//       // Otherwise, assume it’s a data URL and decode it
//       const binary = Buffer.from(imageData.split(',')[1], 'base64');
//       res.setHeader('Content-Type', 'image/png');
//       res.setHeader('Content-Disposition', `attachment; filename=${fieldId}_original.png`);
//       return res.send(binary);
//     } else {
//       res.setHeader('Content-Type', 'text/plain');
//       res.setHeader('Content-Disposition', `attachment; filename=${fieldId}.txt`);
//       return res.send(foundField.content || foundField.value);
//     }
//   } catch (error) {
//     console.error('Download error:', error);
//     res.status(500).send({ error: 'Server error' });
//   }
// });

// // endpoint to include customization files
// app.get("/api/orders/:id/download", auth, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id)
//       .populate('user')
//       .populate('products.product')
//       .populate('products.customization.template');

//     if (!order) {
//       return res.status(404).send({ error: 'Order not found' });
//     }

//     if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
//       return res.status(403).send({ error: 'Not authorized' });
//     }

//     const PDFDocument = require('pdfkit');
//     const doc = new PDFDocument();
    
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=order-${order._id}.pdf`);

//     doc.pipe(res);

//     // Order Details
//     doc.fontSize(20).text('Order Details', { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Order ID: ${order._id}`);
//     doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
//     doc.text(`Customer: ${order.user.email}`);
//     doc.text(`Total Amount: $${order.totalAmount.toFixed(2)}`);
    
//     // Products and Customizations
//     order.products.forEach((item, index) => {
//       doc.moveDown();
//       doc.text(`Product ${index + 1}: ${item.product.name}`);
//       doc.text(`Quantity: ${item.quantity}`);
      
//       if (item.customization) {
//         doc.text('Customizations:', { underline: true });
        
//         // Template information
//         if (item.customization.template) {
//           doc.text(`Template: ${item.customization.template.name}`);
//         }

//         // Custom fields
//         if (item.customization.customFields && item.customization.customFields.length > 0) {
//           item.customization.customFields.forEach(field => {
//             if (field.type === 'text') {
//               doc.text(`${field.type}: ${field.content}`);
//             }
//             // Images are stored separately and can be downloaded individually
//           });
//         }

//         // Description
//         if (item.customization.description) {
//           doc.text(`Special Instructions: ${item.customization.description}`);
//         }

//         // Preview image
//         if (item.customization.preview) {
//           doc.image(Buffer.from(item.customization.preview.split(',')[1], 'base64'), {
//             fit: [250, 250],
//             align: 'center'
//           });
//         }
//       }
//     });

//     doc.end();
//   } catch (error) {
//     console.error('Error generating order PDF:', error);
//     res.status(500).send({ error: 'Error generating order PDF' });
//   }
// });


// //Users routs
// // Get all users (for coupon assignment)
// app.get("/api/users", auth, async (req, res) => {
//   try {
//     // Only allow admin to fetch users
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can access user list" });
//     }

//     // Fetch users, excluding sensitive information
//     const users = await User.find({}, 'email phone isAdmin');
//     res.send(users);
//   } catch (error) {
//     res.status(500).send({ error: "Error fetching users" });
//   }
// });

// app.put("/api/users/profile", auth, async (req, res) => {
//   try {
//     const { firstName, lastName, email, phone, company, currentPassword, newPassword, addresses, defaultAddress, preferences } = req.body;

//     // Find the user
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // If changing password, verify current password
//     if (currentPassword && newPassword) {
//       const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
//       if (!isPasswordValid) {
//         return res.status(400).json({ error: 'Current password is incorrect' });
//       }
//       user.password = await bcrypt.hash(newPassword, 10);
//     }

//     // Check if email is being changed and verify it's not taken
//     if (email && email !== user.email) {
//       const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
//       if (emailExists) {
//         return res.status(400).json({ error: 'Email address is already in use' });
//       }
//     }

//     // Update fields
//     user.firstName = firstName || user.firstName;
//     user.lastName = lastName || user.lastName;
//     user.email = email ? email.toLowerCase() : user.email;
//     user.phone = phone || user.phone;
//     user.company = company || user.company;

//     // Update addresses if provided
//     if (addresses) {
//       user.addresses = addresses;
//     }

//     // Set default address if provided
//     if (defaultAddress && user.addresses.some(addr => addr._id.toString() === defaultAddress)) {
//       user.defaultAddress = defaultAddress;
//     }

//     // Update preferences if provided
//     if (preferences) {
//       user.preferences = {
//         newsletter: preferences.newsletter !== undefined ? preferences.newsletter : user.preferences?.newsletter,
//         marketingEmails: preferences.marketingEmails !== undefined ? preferences.marketingEmails : user.preferences?.marketingEmails
//       };
//     }

//     await user.save();

//     // Create new token
//     const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);

//     // Remove sensitive data before sending response
//     const userResponse = user.toObject();
//     delete userResponse.password;

//     res.json({ user: userResponse, token });
//   } catch (error) {
//     console.error('Profile update error:', error);
//     res.status(500).json({ error: 'Error updating profile' });
//   }
// });


// // Delete user account
// app.delete("/api/users/profile", auth, async (req, res) => {
//   try {
//     // Find user and related data
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Check for pending orders
//     const pendingOrders = await Order.find({
//       user: req.user._id,
//       status: { $in: ['pending', 'processing'] }
//     });

//     if (pendingOrders.length > 0) {
//       return res.status(400).json({
//         error: 'Cannot delete account with pending orders. Please wait for orders to complete or contact support.'
//       });
//     }

//     // Remove user's cart
//     await Cart.findOneAndDelete({ user: req.user._id });

//     // Anonymize completed orders instead of deleting them
//     await Order.updateMany(
//       { user: req.user._id },
//       { 
//         $set: { 
//           user: null,
//           anonymizedUser: {
//             email: user.email,
//             name: `${user.firstName} ${user.lastName}`,
//             deletedAt: new Date()
//           }
//         } 
//       }
//     );

//     // Delete user's auth tokens from localStorage
//     // Note: This will be handled on the frontend after receiving successful response

//     // Delete the user
//     await User.findByIdAndDelete(req.user._id);

//     res.json({ 
//       message: 'Account deleted successfully',
//       success: true 
//     });
//   } catch (error) {
//     console.error('Account deletion error:', error);
//     res.status(500).json({ 
//       error: 'Error deleting account',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // Get user's order history
// app.get("/api/users/orders", auth, async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.user._id })
//       .sort({ createdAt: -1 })
//       .populate('products.product');
    
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching order history' });
//   }
// });

// // Update user's password
// app.put("/api/users/password", auth, async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     // Validate input
//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ 
//         error: 'Both current and new passwords are required' 
//       });
//     }

//     // Find user
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Verify current password
//     const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
//     if (!isPasswordValid) {
//       return res.status(400).json({ error: 'Current password is incorrect' });
//     }

//     // Hash and update new password
//     user.password = await bcrypt.hash(newPassword, 10);
//     await user.save();

//     res.json({ 
//       message: 'Password updated successfully',
//       success: true 
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Error updating password' });
//   }
// });

// // Get user's active coupons
// app.get("/api/users/coupons", auth, async (req, res) => {
//   try {
//     const now = new Date();
//     const coupons = await Coupon.find({
//       $or: [
//         { assignedUsers: req.user._id },
//         { assignedUsers: { $size: 0 } }
//       ],
//       isActive: true,
//       startDate: { $lte: now },
//       endDate: { $gte: now }
//     });

//     res.json(coupons);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching coupons' });
//   }
// });

// app.get("/api/users/login-activity", auth, async (req, res) => {
//   try {
//     const activities = await LoginActivity.find({ user: req.user._id })
//       .sort('-timestamp')
//       .limit(10);
//     res.json(activities);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching login activity' });
//   }
// });

// app.put("/api/users/preferences", auth, async (req, res) => {
//   try {
//     const { preferences } = req.body;
//     const user = await User.findById(req.user._id);
    
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     user.preferences = {
//       ...user.preferences,
//       ...preferences
//     };

//     await user.save();
//     res.json({ preferences: user.preferences });
//   } catch (error) {
//     res.status(500).json({ error: 'Error updating preferences' });
//   }
// });


// //Admin Routs
// // Get all activity logs
// app.get("/api/admin/activity-logs", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }

//     const logs = await ActivityLog.find()
//       .populate('user', 'email')
//       .sort('-createdAt')
//       .limit(1000); // Limit to last 1000 activities for performance

//     res.json(logs);
//   } catch (error) {
//     console.error('Error fetching activity logs:', error);
//     res.status(500).json({ error: 'Error fetching activity logs' });
//   }
// });

// // Get user list with security info
// // app.get("/api/admin/users", auth, async (req, res) => {
// //   try {
// //     if (!req.user.isAdmin) {
// //       return res.status(403).json({ error: "Admin access required" });
// //     }

// //     const users = await User.find({}, {
// //       email: 1,
// //       firstName: 1,
// //       lastName: 1,
// //       lastLogin: 1,
// //       createdAt: 1,
// //       updatedAt: 1
// //     }).sort('-createdAt');

// //     res.json(users);
// //   } catch (error) {
// //     console.error('Error fetching users:', error);
// //     res.status(500).json({ error: 'Error fetching users' });
// //   }
// // });
// // In your server.js
// app.get("/api/admin/users", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const search = req.query.search || '';
    
//     const query = {};
//     if (search) {
//       query.$or = [
//         { email: new RegExp(search, 'i') },
//         { firstName: new RegExp(search, 'i') },
//         { lastName: new RegExp(search, 'i') },
//         { phone: new RegExp(search, 'i') }
//       ];
//     }

//     const skip = (page - 1) * limit;

//     const [users, total] = await Promise.all([
//       User.find(query)
//         .select('email firstName lastName phone isAdmin createdAt')
//         .sort('-createdAt')
//         .skip(skip)
//         .limit(limit),
//       User.countDocuments(query)
//     ]);

//     res.json({
//       users,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({ 
//       error: 'Error fetching users',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// app.get("/api/admin/users", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Only admins can access user management" });
//     }

//     const { page = 1, limit = 10, search } = req.query;
//     const skip = (page - 1) * limit;

//     let query = {};
//     if (search) {
//       query = {
//         $or: [
//           { email: new RegExp(search, 'i') },
//           { firstName: new RegExp(search, 'i') },
//           { lastName: new RegExp(search, 'i') },
//           { phone: new RegExp(search, 'i') }
//         ]
//       };
//     }

//     const users = await User.find(query)
//       .select('-password')
//       .skip(skip)
//       .limit(parseInt(limit))
//       .sort('-createdAt');

//     const total = await User.countDocuments(query);

//     res.json({
//       users,
//       total,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching users' });
//   }
// });

// app.get("/api/admin/users/:userId/activity", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Only admins can view user activity" });
//     }

//     const activities = await ActivityLog.find({ user: req.params.userId })
//       .sort('-createdAt')
//       .limit(50);

//     res.json(activities);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching user activity' });
//   }
// });

// // Export security data
// app.get("/api/admin/security/export", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }

//     const activities = await ActivityLog.find()
//       .populate('user', 'email')
//       .sort('-createdAt')
//       .limit(5000);

//     // Convert to CSV
//     const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
//     const csvStringifier = createCsvStringifier({
//       header: [
//         { id: 'timestamp', title: 'Timestamp' },
//         { id: 'user', title: 'User' },
//         { id: 'action', title: 'Action' },
//         { id: 'type', title: 'Type' },
//         { id: 'details', title: 'Details' },
//         { id: 'ipAddress', title: 'IP Address' }
//       ]
//     });

//     const records = activities.map(activity => ({
//       timestamp: new Date(activity.createdAt).toISOString(),
//       user: activity.user?.email || 'System',
//       action: activity.action,
//       type: activity.type,
//       details: activity.details,
//       ipAddress: activity.ipAddress
//     }));

//     const csvString = csvStringifier.stringifyRecords(records);
    
//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', `attachment; filename=security-log-${new Date().toISOString().split('T')[0]}.csv`);
//     res.send(csvString);
//   } catch (error) {
//     console.error('Error exporting security data:', error);
//     res.status(500).json({ error: 'Error exporting security data' });
//   }
// });

// // Get detailed user security info
// app.get("/api/admin/users/:userId/security", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }

//     const userId = req.params.userId;

//     // Get user's activity logs
//     const activityLogs = await ActivityLog.find({ user: userId })
//       .sort('-createdAt')
//       .limit(100);

//     // Get user's login history
//     const loginHistory = await LoginActivity.find({ user: userId })
//       .sort('-timestamp')
//       .limit(50);

//     // Get user's profile update history
//     const profileUpdates = await ActivityLog.find({
//       user: userId,
//       action: 'profile_update'
//     }).sort('-createdAt').limit(20);

//     // Get failed login attempts
//     const failedLogins = await ActivityLog.find({
//       user: userId,
//       action: 'login_failed'
//     }).sort('-createdAt').limit(20);

//     res.json({
//       activityLogs,
//       loginHistory,
//       profileUpdates,
//       failedLogins
//     });
//   } catch (error) {
//     console.error('Error fetching user security info:', error);
//     res.status(500).json({ error: 'Error fetching user security info' });
//   }
// });

// // Get security statistics
// app.get("/api/admin/security/stats", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }

//     const now = new Date();
//     const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
//     const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
//     const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

//     const [
//       totalUsers,
//       activeUsers,
//       recentLogins,
//       failedLogins,
//       securityEvents,
//       profileUpdates
//     ] = await Promise.all([
//       User.countDocuments(),
//       User.countDocuments({ lastLogin: { $gte: oneDayAgo } }),
//       LoginActivity.countDocuments({ timestamp: { $gte: oneDayAgo } }),
//       ActivityLog.countDocuments({
//         action: 'login_failed',
//         createdAt: { $gte: sevenDaysAgo }
//       }),
//       ActivityLog.countDocuments({
//         type: 'security',
//         createdAt: { $gte: thirtyDaysAgo }
//       }),
//       ActivityLog.countDocuments({
//         action: 'profile_update',
//         createdAt: { $gte: thirtyDaysAgo }
//       })
//     ]);

//     res.json({
//       totalUsers,
//       activeUsers,
//       recentLogins,
//       failedLogins,
//       securityEvents,
//       profileUpdates
//     });
//   } catch (error) {
//     console.error('Error fetching security stats:', error);
//     res.status(500).json({ error: 'Error fetching security stats' });
//   }
// });

// // Log security event (internal function)
// const logSecurityEvent = async (userId, action, details, ipAddress) => {
//   try {
//     const log = new ActivityLog({
//       user: userId,
//       action,
//       type: 'security',
//       details,
//       ipAddress
//     });
//     await log.save();
//   } catch (error) {
//     console.error('Error logging security event:', error);
//   }
// };

// // Update user access tracking middleware
// const trackUserAccess = async (req, res, next) => {
//   try {
//     if (req.user) {
//       await User.findByIdAndUpdate(req.user._id, {
//         lastAccess: new Date(),
//         lastIp: req.ip
//       });
//     }
//     next();
//   } catch (error) {
//     console.error('Error tracking user access:', error);
//     next();
//   }
// };


// // Get all clients (users) with safe fields
// app.get("/api/admin/clients", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Admin access required" });
//     }
//     // Exclude sensitive fields
//     const clients = await User.find().select("-password -passwordResetToken -passwordResetExpires");
//     res.json(clients);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching clients" });
//   }
// });

// // Get detailed info for a specific client (plus their orders as an example)
// app.get("/api/admin/clients/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Admin access required" });
//     }
//     const client = await User.findById(req.params.id).select("-password -passwordResetToken -passwordResetExpires");
//     if (!client) return res.status(404).send({ error: "Client not found" });
    
//     const orders = await Order.find({ user: client._id });
//     const notes = await ClientNote.find({ user: client._id }).sort("-createdAt");
//     // For contacts, invoices, and files, return empty arrays as placeholders
//     res.json({ client, orders, notes, contacts: [], invoices: [], files: [] });
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching client details", details: error.message });
//   }
// });

// // New endpoint: Update client's admin status
// app.put("/api/admin/clients/:id/admin", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Admin access required" });
//     }
//     const { isAdmin } = req.body;
//     const client = await User.findByIdAndUpdate(req.params.id, { isAdmin }, { new: true });
//     if (!client) return res.status(404).send({ error: "Client not found" });
//     res.json({ message: "Client admin status updated", client: client.toSafeObject() });
//   } catch (error) {
//     res.status(500).json({ error: "Error updating client admin status" });
//   }
// });

// // New endpoint: Admin triggers reset password request for a client
// app.post("/api/admin/clients/:id/reset-password", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Admin access required" });
//     }
//     const client = await User.findById(req.params.id);
//     if (!client) return res.status(404).send({ error: "Client not found" });
    
//     const resetToken = crypto.randomBytes(20).toString("hex");
//     client.passwordResetToken = resetToken;
//     client.passwordResetExpires = Date.now() + 3600000; // 1 hour expiry
//     await client.save();

//     const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
//     const mailOptions = {
//       to: client.email,
//       from: process.env.SMTP_USER || "your-email@example.com",
//       subject: "Password Reset Request",
//       text: `An admin has requested a password reset for your account. Please click the following link to reset your password:\n\n${resetUrl}\n\nIf you did not expect this, please contact support.`
//     };
//     await transporter.sendMail(mailOptions);
//     res.json({ message: "Reset password request sent successfully" });
//   } catch (error) {
//     console.error("Error in reset-password endpoint:", error);
//     res.status(500).json({ error: "Error sending reset password request", details: error.message });
//   }
// });

// app.post("/api/admin/clients/:id/notes", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }
//     const { note } = req.body;
//     if (!note) {
//       return res.status(400).json({ error: "Note content is required" });
//     }
//     const client = await User.findById(req.params.id);
//     if (!client) {
//       return res.status(404).json({ error: "Client not found" });
//     }
//     const newNote = new ClientNote({ user: client._id, note });
//     await newNote.save();
//     res.json({ message: "Note added successfully", note: newNote });
//   } catch (error) {
//     console.error("Error adding note:", error);
//     res.status(500).json({ error: "Error adding note", details: error.message });
//   }
// });

// app.get("/api/admin/clients/:id/files", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       console.log("Admin access required.");
//       return res.status(403).json({ error: "Admin access required" });
//     }
//     const clientId = req.params.id;
//     console.log("Fetching files for client:", clientId);
//     // Find orders belonging to the client
//     const orders = await Order.find({ user: clientId });
//     console.log(`Found ${orders.length} orders for client ${clientId}.`);
//     const files = [];
//     orders.forEach(order => {
//       console.log("Processing order:", order._id);
//       order.products.forEach(product => {
//         console.log("Processing product:", product.product);
//         const customization = product.customization;
//         if (customization) {
//           console.log("Found customization:", customization);
//           // Check customFields
//           if (Array.isArray(customization.customFields)) {
//             customization.customFields.forEach(field => {
//               console.log("Processing customField:", field);
//               if (field.type === "image" || field.type === "logo") {
//                 let url = field.imageUrl || field.content;
//                 console.log("Found potential image URL in customField:", url);
//                 if (
//                   url &&
//                   typeof url === "string" &&
//                   (url.startsWith("/upload/") ||
//                     url.startsWith("http://") ||
//                     url.startsWith("https://"))
//                 ) {
//                   console.log("Adding file from customField:", url);
//                   files.push({
//                     orderId: order._id,
//                     productId: product.product,
//                     fieldId: field.fieldId,
//                     url,
//                   });
//                 }
//               }
//             });
//           }
//           // Check requiredFields
//           if (Array.isArray(customization.requiredFields)) {
//             customization.requiredFields.forEach(field => {
//               console.log("Processing requiredField:", field);
//               if (field.type === "image" || field.type === "logo") {
//                 let url = field.imageUrl || field.value;
//                 console.log("Found potential image URL in requiredField:", url);
//                 if (
//                   url &&
//                   typeof url === "string" &&
//                   (url.startsWith("/upload/") ||
//                     url.startsWith("http://") ||
//                     url.startsWith("https://"))
//                 ) {
//                   console.log("Adding file from requiredField:", url);
//                   files.push({
//                     orderId: order._id,
//                     productId: product.product,
//                     fieldId: field.fieldId,
//                     url,
//                   });
//                 }
//               }
//             });
//           }
//         } else {
//           console.log("No customization for product:", product.product);
//         }
//       });
//     });
//     console.log("Files found:", files);
//     res.json(files);
//   } catch (error) {
//     console.error("Error fetching client files:", error);
//     res.status(500).json({ error: "Error fetching client files", details: error.message });
//   }
// });


// app.get('/api/admin/uploads', authenticateAdmin, async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 12, 
//       search = '', 
//       inCart, 
//       inOrder, 
//       userOnly, 
//       visitorOnly, 
//       startDate, 
//       endDate,
//       sortBy = 'date',
//       sortOrder = 'desc'
//     } = req.query;
    
//     // Build the query filters
//     const filter = {};
    
//     // Search filter (filename or uploader)
//     if (search) {
//       filter['$or'] = [
//         { originalName: { $regex: search, $options: 'i' } },
//         { uploadedBy: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     // User type filters
//     if (userOnly === 'true') {
//       filter.userId = { $exists: true, $ne: null };
//     }
    
//     if (visitorOnly === 'true') {
//       filter.userId = { $exists: false };
//     }
    
//     // Date range filters
//     if (startDate || endDate) {
//       filter.createdAt = {};
//       if (startDate) {
//         filter.createdAt.$gte = new Date(startDate);
//       }
//       if (endDate) {
//         // Set to end of the day
//         const endOfDay = new Date(endDate);
//         endOfDay.setHours(23, 59, 59, 999);
//         filter.createdAt.$lte = endOfDay;
//       }
//     }
    
//     // Usage filters
//     if (inCart === 'true') {
//       filter.inCart = true;
//     }
    
//     if (inOrder === 'true') {
//       filter.inOrder = true;
//     }
    
//     // Determine sort options
//     let sortOptions = {};
//     switch(sortBy) {
//       case 'date':
//         sortOptions = { createdAt: sortOrder === 'asc' ? 1 : -1 };
//         break;
//       case 'user':
//         sortOptions = { uploadedBy: sortOrder === 'asc' ? 1 : -1 };
//         break;
//       case 'size':
//         sortOptions = { size: sortOrder === 'asc' ? 1 : -1 };
//         break;
//       default:
//         sortOptions = { createdAt: -1 };
//     }
    
//     // Count total matching documents
//     const total = await Upload.countDocuments(filter);
    
//     // Fetch paginated images
//     const images = await Upload.find(filter)
//       .sort(sortOptions)
//       .skip((Number(page) - 1) * Number(limit))
//       .limit(Number(limit));
    
//     res.json({
//       images,
//       total,
//       page: Number(page),
//       totalPages: Math.ceil(total / Number(limit))
//     });
//   } catch (error) {
//     console.error('Error fetching uploads:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get detailed information for a specific upload
// app.get('/api/admin/uploads/:id/details', authenticateAdmin, async (req, res) => {
//   try {
//     const upload = await Upload.findById(req.params.id);
    
//     if (!upload) {
//       return res.status(404).json({ message: 'Upload not found' });
//     }
    
//     // Fetch additional details if needed
//     const details = { ...upload.toObject() };
    
//     // If the image is in any orders, fetch related order IDs
//     if (upload.inOrder) {
//       const orders = await Order.find({ 
//         'items.uploadId': upload._id 
//       }).select('_id orderNumber createdAt status');
      
//       details.orders = orders;
//       details.orderCount = orders.length;
//     }
    
//     // If the image is in any carts, get count
//     if (upload.inCart) {
//       const cartCount = await Cart.countDocuments({ 
//         'items.uploadId': upload._id 
//       });
      
//       details.cartCount = cartCount;
//     }
    
//     res.json(details);
//   } catch (error) {
//     console.error('Error fetching upload details:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Download an image
// app.get('/api/admin/uploads/download/:id', authenticateAdmin, async (req, res) => {
//   try {
//     const upload = await Upload.findById(req.params.id);
    
//     if (!upload) {
//       return res.status(404).json({ message: 'Upload not found' });
//     }
    
//     // Get the file path
//     const filePath = path.join(__dirname, '../uploads', upload.path);
    
//     // Set headers for download
//     res.setHeader('Content-Disposition', `attachment; filename="${upload.originalName}"`);
//     res.setHeader('Content-Type', upload.mimetype);
    
//     // Stream the file
//     const fileStream = fs.createReadStream(filePath);
//     fileStream.pipe(res);
//   } catch (error) {
//     console.error('Error downloading file:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Delete an image
// app.delete('/api/admin/uploads/:id', authenticateAdmin, async (req, res) => {
//   try {
//     const upload = await Upload.findById(req.params.id);
    
//     if (!upload) {
//       return res.status(404).json({ message: 'Upload not found' });
//     }
    
//     // Check if the image is in active orders
//     const activeOrderCount = await Order.countDocuments({ 
//       'items.uploadId': upload._id,
//       status: { $nin: ['cancelled', 'completed'] }
//     });
    
//     if (activeOrderCount > 0) {
//       return res.status(400).json({ 
//         message: 'Cannot delete image that is part of active orders' 
//       });
//     }
    
//     // Delete the file from storage
//     const filePath = path.join(__dirname, '../uploads', upload.path);
//     fs.unlink(filePath, async (err) => {
//       if (err) {
//         console.error('Error deleting file:', err);
//         // Continue with database deletion even if file deletion fails
//       }
      
//       // Remove from database
//       await Upload.findByIdAndDelete(req.params.id);
      
//       res.json({ message: 'Image deleted successfully' });
//     });
//   } catch (error) {
//     console.error('Error deleting upload:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// app.get("/api/images", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can access images" });
//     }

//     const page = Math.max(1, parseInt(req.query.page) || 1);
//     const limit = 8; // Reduced for better performance
//     const skip = (page - 1) * limit;

//     // Get total count
//     const total = await Image.countDocuments();
//     const totalPages = Math.ceil(total / limit);

//     // Get images for current page
//     const images = await Image.find()
//       .sort('-createdAt')
//       .skip(skip)
//       .limit(limit)
//       .select('contentType data createdAt')
//       .lean();

//     const processedImages = images.map(img => ({
//       _id: img._id,
//       contentType: img.contentType,
//       data: img.data.toString('base64'),
//       createdAt: img.createdAt
//     }));

//     res.json({
//       images: processedImages,
//       total,
//       page,
//       totalPages
//     });

//   } catch (error) {
//     console.error('Error in GET /api/images:', error);
//     res.status(500).json({ error: 'Error fetching images' });
//   }
// });

// // Delete image with reference checking
// app.delete("/api/images/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can delete images" });
//     }

//     // Check if image is used in products or categories
//     const productUsingImage = await Product.findOne({ 
//       images: req.params.id 
//     });
    
//     const categoryUsingImage = await Category.findOne({ 
//       image: req.params.id 
//     });

//     if (productUsingImage || categoryUsingImage) {
//       return res.status(400).send({ 
//         error: 'Image is in use and cannot be deleted' 
//       });
//     }

//     const image = await Image.findByIdAndDelete(req.params.id);
//     if (!image) {
//       return res.status(404).send({ error: 'Image not found' });
//     }

//     res.json({ message: 'Image deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting image:', error);
//     res.status(500).send({ error: 'Error deleting image' });
//   }
// });

// app.delete("/api/images/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Only admins can delete images" });
//     }

//     const image = await Image.findByIdAndDelete(req.params.id);
//     if (!image) {
//       return res.status(404).send({ error: 'Image not found' });
//     }

//     res.send({ message: 'Image deleted successfully' });
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// // Notification Routes
// app.get("/api/notifications", auth, async (req, res) => {
//   try {
//     const notifications = await Notification.find({ user: req.user._id })
//       .sort('-createdAt')
//       .limit(10);
    
//     res.json(notifications);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching notifications' });
//   }
// });

// app.post("/api/notifications/mark-read", auth, async (req, res) => {
//   try {
//     const { notificationIds } = req.body;
    
//     await Notification.updateMany(
//       { 
//         _id: { $in: notificationIds },
//         user: req.user._id 
//       },
//       { $set: { isRead: true } }
//     );
    
//     res.json({ message: 'Notifications marked as read' });
//   } catch (error) {
//     res.status(500).json({ error: 'Error updating notifications' });
//   }
// });



// // Endpoint to fetch notifications created by admin (e.g., global notifications)
// app.get("/api/admin/notifications/created", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }
//     let { page, limit } = req.query;
//     page = parseInt(page) || 1;
//     limit = parseInt(limit) || 20;
//     const skip = (page - 1) * limit;
    
//     // Fetch all notifications sorted from newest to oldest
//     const notifications = await Notification.find({})
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);
    
//     const totalCount = await Notification.countDocuments({});
//     res.json({
//       notifications,
//       totalPages: Math.ceil(totalCount / limit),
//       currentPage: page,
//     });
//   } catch (error) {
//     console.error("Error fetching admin notifications:", error);
//     res.status(500).json({ error: "Error fetching admin notifications" });
//   }
// });

// app.post("/api/admin/notifications/send", auth, async (req, res) => {
//   try {
//     // Only allow admin users
//     if (!req.user.isAdmin) {
//       return res.status(403).send({ error: "Admin access required" });
//     }

//     const { selectedUsers, filter, channels, messageContent } = req.body;
//     let targetUsers = [];

//     // Determine target users based on selection or filter.
//     if (selectedUsers && selectedUsers.length > 0) {
//       targetUsers = await User.find({ _id: { $in: selectedUsers } });
//     } else {
//       // As an example, if no custom selection is provided, target all users.
//       targetUsers = await User.find({});
//       // Alternatively, use your dynamic filter logic here.
//     }

//     // Loop through each user and send notifications via each channel.
//     for (const user of targetUsers) {
//       // Send SMS if channel is selected and user has a phone number.
//       if (channels.sms && user.phone) {
//         try {          
//           const accountSid = process.env.TWILIO_ACCOUNT_SID;
//           const authToken = process.env.TWILIO_AUTH_TOKEN;
//           const client = require('twilio')(accountSid, authToken);
          
//           await client.messages.create({
//             body:  messageContent.sms,
//             from: process.env.TWILIO_PHONE_NUMBER,
//             to: user.phone
//           });
        
//         } catch (smsError) {
//           console.error(`Error sending SMS to ${user.phone}:`, smsError);
//           // Optionally, you can collect failed SMS notifications here.
//         }
//       }

//       // Send Email if channel is selected and user has an email.
//       if (channels.email && user.email) {
//         try {
//           await transporter.sendMail({
//             to: user.email,
//             from: process.env.SMTP_USER,
//             subject: "Newsletter / Notification",
//             html: messageContent.email,
//           });
//         } catch (emailError) {
//           console.error(`Error sending email to ${user.email}:`, emailError);
//         }
//       }

//       // Create an in-app notification if that channel is selected.
//       if (channels.inApp) {
//         try {
//           const notification = new Notification({
//             user: user._id,
//             message: messageContent.inApp,
//             type: "system",
//           });
//           await notification.save();
//         } catch (inAppError) {
//           console.error(`Error creating in-app notification for ${user._id}:`, inAppError);
//         }
//       }
//     }

//     res.send({ message: "Notifications processed. Check server logs for any errors." });
//   } catch (error) {
//     console.error("Error in notifications send endpoint:", error);
//     res.status(500).send({ error: "Error sending notifications", details: error.message });
//   }
// });

// app.put("/api/admin/notifications/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }
//     const notificationId = req.params.id;
//     const { active } = req.body;
//     // Update the notification with the new active status
//     const updatedNotification = await Notification.findByIdAndUpdate(
//       notificationId,
//       { active },
//       { new: true }
//     );
//     if (!updatedNotification) {
//       return res.status(404).json({ error: "Notification not found" });
//     }
//     res.json(updatedNotification);
//   } catch (error) {
//     console.error("Error updating notification status:", error);
//     res.status(500).json({ error: "Error updating notification status" });
//   }
// });

// app.delete("/api/admin/notifications/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Admin access required" });
//     }
//     const notificationId = req.params.id;
//     const deletedNotification = await Notification.findByIdAndDelete(notificationId);
//     if (!deletedNotification) {
//       return res.status(404).json({ error: "Notification not found" });
//     }
//     res.json({ message: "Notification deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting notification:", error);
//     res.status(500).json({ error: "Error deleting notification" });
//   }
// });






// app.post("/api/products/:id/remind-me", async (req, res) => {
//   try {
//     const productId = req.params.id;
//     const { email, phone } = req.body;
//     let userId = null;
    
//     // If an authorization header is provided, verify token to set userId
//     if (req.headers.authorization) {
//       try {
//         const token = req.headers.authorization.replace("Bearer ", "");
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         userId = decoded.userId;
//       } catch (tokenError) {
//         console.log("Token verification failed:", tokenError);
//         // Continue without userId if token is invalid
//       }
//     }
    
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ error: 'Product not found' });
//     }
    
//     if (product.inStock) {
//       return res.status(400).json({ error: 'Product is already in stock' });
//     }
    
//     // Determine final contact info
//     let finalEmail = email, finalPhone = phone;
    
//     if (userId) {
//       const user = await User.findById(userId);
//       if (user) {
//         if (!finalEmail) finalEmail = user.email;
//         if (!finalPhone) finalPhone = user.phone;
//       }
//     }
    
//     if (!finalEmail && !finalPhone) {
//       return res.status(400).json({ error: 'Email or phone number is required for notification' });
//     }
    
//     // Format phone number for storage
//     if (finalPhone) {
//       try {
//         const confirmationMessage = `You will be notified when "${product.name}" is back in stock.`;
        
//         // Initialize Twilio client same way as in password reset
//         const accountSid = process.env.TWILIO_ACCOUNT_SID;
//         const authToken = process.env.TWILIO_AUTH_TOKEN;
//         const client = require('twilio')(accountSid, authToken);
        
//         await client.messages.create({
//           body: confirmationMessage,
//           from: process.env.TWILIO_PHONE_NUMBER,
//           to: finalPhone
//         });
        
//         console.log(`Confirmation SMS sent to ${finalPhone}`);
//       } catch (smsError) {
//         console.error(`SMS send error to ${finalPhone}:`, smsError);
//         // Don't return error to user, just log it and continue
//       }
//     }
    
//     // Check if notification already exists
//     const existingNotification = await ProductNotification.findOne({
//       product: productId,
//       $or: [
//         { email: finalEmail },
//         { phone: finalPhone }
//       ],
//       notified: false
//     });
    
//     if (existingNotification) {
//       return res.json({ 
//         message: 'You\'re already on the notification list for this product.', 
//         existing: true 
//       });
//     }
    
//     // Create new notification record
//     const notification = new ProductNotification({
//       product: productId,
//       user: userId,
//       email: finalEmail,
//       phone: finalPhone
//     });
    
//     await notification.save();
    
//     // Send confirmation
//     if (finalEmail) {
//       try {
//         const confirmationEmail = `
//           <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #0056b3;">Back in Stock Notification Confirmed</h2>
//             <p>We've added you to the notification list for <strong>${product.name}</strong>.</p>
//             <p>You'll receive an email when this product becomes available.</p>
//             <hr style="border: none; border-top: 1px solid #ccc;" />
//             <p style="font-size: 12px; color: #777;">Thank you for your interest in our products.</p>
//           </div>
//         `;
        
//         await transporter.sendMail({
//           to: finalEmail,
//           from: process.env.SMTP_USER,
//           subject: 'Back in Stock Notification Confirmed',
//           html: confirmationEmail
//         });
//       } catch (emailError) {
//         console.error('Error sending confirmation email:', emailError);
//       }
//     }
    
//     if (finalPhone) {
//       try {
//         const confirmationSMS = `You're on our notification list for "${product.name}". We'll text you when it's back in stock.`;
        
//         await twilioClient.messages.create({
//           body: confirmationSMS,
//           from: process.env.TWILIO_PHONE_NUMBER,
//           to: finalPhone
//         });
//       } catch (smsError) {
//         console.error('Error sending confirmation SMS:', smsError);
//       }
//     }
    
//     res.json({ 
//       message: 'Notification request saved. We will notify you when the product is available.',
//       success: true
//     });
//   } catch (error) {
//     console.error('Error in remind-me:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });


// // Sales Report Routes
// app.get("/api/reports/sales", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Only admins can access reports" });
//     }

//     const { startDate, endDate } = req.query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
//     const end = endDate ? new Date(endDate) : new Date();

//     // Fetch orders within date range
//     const orders = await Order.find({
//       createdAt: { $gte: start, $lte: end }
//     }).populate('user', 'email');

//     // Calculate various metrics
//     const salesData = {
//       totalRevenue: 0,
//       totalOrders: orders.length,
//       averageOrderValue: 0,
//       productsSold: 0,
//       dailyRevenue: {},
//       topProducts: {},
//       ordersByStatus: {
//         pending: 0,
//         processing: 0,
//         shipped:0,
//         completed: 0,
//         cancelled: 0
//       }
//     };

//     // Process orders
//     orders.forEach(order => {
//       // Add to total revenue
//       salesData.totalRevenue += order.totalAmount;

//       // Count products sold
//       order.products.forEach(product => {
//         salesData.productsSold += product.quantity;
//         // Track top products
//         const productId = product.product.toString();
//         salesData.topProducts[productId] = (salesData.topProducts[productId] || 0) + product.quantity;
//       });

//       // Track daily revenue
//       const dateKey = order.createdAt.toISOString().split('T')[0];
//       salesData.dailyRevenue[dateKey] = (salesData.dailyRevenue[dateKey] || 0) + order.totalAmount;

//       // Count orders by status
//       salesData.ordersByStatus[order.status]++;
//     });

//     // Calculate average order value
//     salesData.averageOrderValue = salesData.totalRevenue / salesData.totalOrders;

//     // Get top products details
//     const topProductIds = Object.keys(salesData.topProducts);
//     const topProducts = await Product.find({
//       _id: { $in: topProductIds }
//     }, 'name basePrice');

//     // Format top products data
//     salesData.topProducts = topProductIds.map(id => ({
//       product: topProducts.find(p => p._id.toString() === id),
//       quantity: salesData.topProducts[id]
//     })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

//     res.json(salesData);
//   } catch (error) {
//     console.error('Error generating sales report:', error);
//     res.status(500).json({ error: 'Error generating sales report' });
//   }
// });

// // Generate PDF report
// app.get("/api/reports/sales/download", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ error: "Only admins can download reports" });
//     }

//     const { startDate, endDate } = req.query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
//     const end = endDate ? new Date(endDate) : new Date();

//     const orders = await Order.find({
//       createdAt: { $gte: start, $lte: end }
//     }).populate('user', 'email').populate('products.product', 'name basePrice');

//     const PDFDocument = require('pdfkit');
//     const doc = new PDFDocument();

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=sales-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.pdf`);

//     doc.pipe(res);

//     // Add content to PDF
//     doc.fontSize(20).text('Sales Report', { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`);

//     // Add summary
//     const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
//     doc.moveDown();
//     doc.text(`Total Orders: ${orders.length}`);
//     doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`);
//     doc.text(`Average Order Value: $${(totalRevenue / orders.length).toFixed(2)}`);

//     // Add detailed order list
//     doc.moveDown();
//     doc.text('Order Details:', { underline: true });
//     orders.forEach(order => {
//       doc.moveDown();
//       doc.text(`Order ID: ${order._id}`);
//       doc.text(`Customer: ${order.user.email}`);
//       doc.text(`Amount: $${order.totalAmount.toFixed(2)}`);
//       doc.text(`Status: ${order.status}`);
//       doc.text('Products:');
//       order.products.forEach(item => {
//         doc.text(`  - ${item.product.name} (${item.quantity}x)`);
//       });
//     });

//     doc.end();
//   } catch (error) {
//     console.error('Error generating PDF report:', error);
//     res.status(500).json({ error: 'Error generating PDF report' });
//   }
// });





// // Helper function to create notifications
// const createNotification = async (userId, message, type, link = null) => {
//   try {
//     const notification = new Notification({
//       user: userId,
//       message,
//       type,
//       link
//     });
//     await notification.save();
//     return notification;
//   } catch (error) {
//     console.error('Error creating notification:', error);
//   }
// };

// // Helper function to log user activity
// const logActivity = async (userId, action, details, ipAddress) => {
//   try {
//     const activity = new ActivityLog({
//       user: userId,
//       action,
//       details,
//       ipAddress
//     });
//     await activity.save();
//     return activity;
//   } catch (error) {
//     console.error('Error logging activity:', error);
//   }
// };

// // Contact form validation and submission route
// app.post('/api/contact', contactLimiter, [
//   // Validation middleware
//   body('name').trim().notEmpty().withMessage('Name is required'),
//   body('email').trim().isEmail().withMessage('Invalid email address'),
//   body('message').trim().notEmpty().withMessage('Message is required'),
//   body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
// ], async (req, res) => {
//   // Check for validation errors
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const { name, email, phone, company, message } = req.body;

//   try {
//     // Send email
//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM || 'Info@bagbox.ca', 
//       to: process.env.EMAIL_TO || 'Info@bagbox.ca',
//       replyTo: email,
//       subject: 'New Contact Form Submission - Bag&Box',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>New Contact Form Submission</h2>
//           <table style="width: 100%; border-collapse: collapse;">
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
//             </tr>
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td>
//             </tr>
//             ${phone ? `
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;">${phone}</td>
//             </tr>` : ''}
//             ${company ? `
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;">${company}</td>
//             </tr>` : ''}
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Message:</strong></td>
//               <td style="padding: 10px; border-bottom: 1px solid #eee;">${message}</td>
//             </tr>
//           </table>
//         </div>
//       `,
//       text: `
//         New Contact Form Submission
        
//         Name: ${name}
//         Email: ${email}
//         ${phone ? `Phone: ${phone}` : ''}
//         ${company ? `Company: ${company}` : ''}
        
//         Message: ${message}
//       `
//     });

//     // Optional: Log successful submission
//     console.log(`Contact form submission from ${name} (${email})`);

//     // Respond with success
//     res.status(200).json({ 
//       message: 'Message sent successfully. We\'ll get back to you soon!',
//       success: true 
//     });
//   } catch (error) {
//     console.error('Email send error:', error);
//     res.status(500).json({ 
//       message: 'Failed to send message. Please try again later.',
//       success: false,
//       error: error.toString()
//     });
//   }
// });



// // Apply tracking middleware to all routes
// app.use(trackUserAccess);



// app.get('/api/config/maps', (req, res) => {
//   res.json({ googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY });
// });

// // Health check route
// app.get('/api/health', (req, res) => {
//   res.status(200).json({ 
//     status: 'healthy', 
//     timestamp: new Date().toISOString() 
//   });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     message: 'An unexpected error occurred',
//     success: false
//   });
// });


// // Serve static files in production
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/build")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
//   });
// }

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI
//   // , {
//   // useNewUrlParser: true,
//   // useUnifiedTopology: true,
//   // maxPoolSize: 10, // Limit maximum connections in the pool
//   // serverSelectionTimeoutMS: 5000, // How long to try selecting a server
//   // socketTimeoutMS: 45000, // How long to wait for responses
//   // connectTimeoutMS: 10000, // How long to wait for initial connection
// // }
// )
//   .then(() => {
//     console.log("Connected to MongoDB Atlas");
//     // Start the server after successful database connection
//     const PORT = process.env.PORT || 80;
//     app.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error("MongoDB connection error:", error);
//     process.exit(1); // Exit the process if database connection fails
//   });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });

// app.use('/upload', express.static(path.join(__dirname, 'upload')));


// app.use('/upload', (req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', 'Authorization');
//   next();
// }, express.static(path.join(__dirname, 'upload')));


