// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const paypal = require("paypal-rest-sdk");

// dotenv.config();

// const app = express();
// app.use(express.json());
// app.use(cors());

// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log("MongoDB connected"))
// .catch(err => console.log(err));

// const UserSchema = new mongoose.Schema({
//     email: String,
//     password: String,
//     isAdmin: Boolean,
// });

// const ProductSchema = new mongoose.Schema({
//     name: String,
//     category: String,
//     image: String,
//     price: Number,
// });

// const User = mongoose.model("User", UserSchema);
// const Product = mongoose.model("Product", ProductSchema);

// app.post("/api/register", async (req, res) => {
//     const { email, password, adminCode } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const isAdmin = adminCode === process.env.ADMIN_CODE;

//     const newUser = new User({ email, password: hashedPassword, isAdmin });
//     await newUser.save();
//     res.json({ message: "User registered" });
// });

// app.post("/api/login", async (req, res) => {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//         return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "1h" });
//     res.json({ token });
// });

// app.post("/api/products", async (req, res) => {
//     const { name, category, image, price } = req.body;
//     const newProduct = new Product({ name, category, image, price });
//     await newProduct.save();
//     res.json({ message: "Product added" });
// });

// app.get("/api/products", async (req, res) => {
//     const products = await Product.find();
//     res.json(products);
// });

// app.post("/api/payment", async (req, res) => {
//     const { amount } = req.body;
//     try {
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount,
//             currency: "usd",
//             payment_method_types: ["card"],
//         });
//         res.json({ clientSecret: paymentIntent.client_secret });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// app.use(express.static(path.join(__dirname, "../frontend/build")));
// app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));











// Backend: server.js
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

// MongoDB Schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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

// Image handling middleware
const upload = multer({
  limits: {
    fileSize: 5000000 // 5MB limit
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

// Routes

// Auth routes
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = adminCode === process.env.ADMIN_CODE;

    const user = new User({ email, password: hashedPassword, isAdmin });
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

// Image upload route
app.post("/api/upload", auth, async (req, res) => {
  try {
    const { image } = req.body;
    const { buffer, contentType } = base64ToBuffer(image);
    const newImage = new Image({ data: buffer, contentType });
    await newImage.save();
    res.send({ 
      _id: newImage._id,
      url: `data:${contentType};base64,${buffer.toString('base64')}`
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Order routes with payment
app.post("/api/orders", auth, async (req, res) => {
  try {
    const { products, totalAmount, paymentMethod, customizations } = req.body;
    
    // Save customization images
    const processedProducts = await Promise.all(products.map(async (item) => {
      const customization = customizations[item.product];
      if (!customization) return item;

      // Save preview image
      const { buffer, contentType } = base64ToBuffer(customization.preview);
      const previewImage = new Image({ data: buffer, contentType });
      await previewImage.save();

      // Save custom image if exists
      let customImageId = null;
      if (customization.customImage) {
        const { buffer: imgBuffer, contentType: imgType } = base64ToBuffer(customization.customImage);
        const customImage = new Image({ data: imgBuffer, contentType: imgType });
        await customImage.save();
        customImageId = customImage._id;
      }

      return {
        ...item,
        customization: {
          customImage: customImageId,
          customText: customization.customText,
          preview: previewImage._id
        }
      };
    }));

    const order = new Order({
      user: req.user._id,
      products: processedProducts,
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
      amount,
      currency: "usd"
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Frontend: src/components/ProductEditor.js
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const ProductEditor = () => {
  const [canvas, setCanvas] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customText, setCustomText] = useState("");
  const [cart, setCart] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
    });
    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    if (product.templates && product.templates.length > 0) {
      fabric.Image.fromURL(product.templates[0].data, (img) => {
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      });
    }
  };

  const handleTextAdd = () => {
    if (!customText) return;
    const text = new fabric.Text(customText, {
      left: 100,
      top: 100,
      fontSize: 20,
    });
    canvas.add(text);
    canvas.renderAll();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        img.scaleToWidth(200);
        canvas.add(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    
    // Get canvas data URL for preview
    const preview = canvas.toDataURL();
    
    // Get custom image if any
    let customImage = null;
    const objects = canvas.getObjects();
    for (const obj of objects) {
      if (obj instanceof fabric.Image && obj !== canvas.backgroundImage) {
        customImage = obj.toDataURL();
        break;
      }
    }

    try {
      const response = await axios.post("/api/upload", { 
        image: preview 
      });

      setCart([
        ...cart,
        {
          product: selectedProduct,
          preview: response.data.url,
          customization: {
            customImage,
            customText,
            previewId: response.data._id
          }
        }
      ]);
    } catch (error) {
      console.error("Error saving preview:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <canvas ref={canvasRef} />
          <div className="mt-4">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="border p-2"
              placeholder="Enter custom text"
            />
            <button
              onClick={handleTextAdd}
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Text
            </button>
            <input
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
              className="mt-2"
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Cart ({cart.length} items)</h2>
          {cart.map((item, index) => (
            <div key={index} className="border p-4 mb-2">
              <img src={item.preview} alt="Preview" className="w-32" />
              <p>{item.product.name}</p>
              <p>${item.product.basePrice}</p>
            </div>
          ))}
          {cart.length > 0 && (
            <Elements stripe={stripePromise}>
              <CheckoutForm cart={cart} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

const CheckoutForm = ({ cart }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    try {
      // Calculate total amount
      const amount = cart.reduce((sum, item) => sum + item.product.basePrice, 0) * 100;

      // Create payment intent
      const { data: { clientSecret } } = await axios.post("/api/create-payment-intent", {
        amount
      });

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      });

      if (error) {
        console.error(error);
      } else {
        // Create order
        await axios.post("/api/orders", {
          products: cart.map(item => ({
            product: item.product._id,
            quantity: 1
          })),
          totalAmount: amount / 100,
          paymentMethod: "stripe",
          customizations: cart.reduce((acc, item) => ({
            ...acc,
            [item.product._id]: {
              customImage: item.customization.customImage,
              customText: item.customization.customText,
              preview: item.preview
            }
          }), {})
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`bg-blue-500 text-white px-4 py-2 rounded w-full ${
          (!stripe || processing) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

export default ProductEditor;



