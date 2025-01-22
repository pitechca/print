const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const paypal = require("paypal-rest-sdk");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    isAdmin: Boolean,
});

const ProductSchema = new mongoose.Schema({
    name: String,
    category: String,
    image: String,
    price: Number,
});

const User = mongoose.model("User", UserSchema);
const Product = mongoose.model("Product", ProductSchema);

app.post("/api/register", async (req, res) => {
    const { email, password, adminCode } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = adminCode === process.env.ADMIN_CODE;

    const newUser = new User({ email, password: hashedPassword, isAdmin });
    await newUser.save();
    res.json({ message: "User registered" });
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
});

app.post("/api/products", async (req, res) => {
    const { name, category, image, price } = req.body;
    const newProduct = new Product({ name, category, image, price });
    await newProduct.save();
    res.json({ message: "Product added" });
});

app.get("/api/products", async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

app.post("/api/payment", async (req, res) => {
    const { amount } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            payment_method_types: ["card"],
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));









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

// // User Schema
// const UserSchema = new mongoose.Schema({
//     email: String,
//     password: String,
//     isAdmin: Boolean,
// });
// const User = mongoose.model("User", UserSchema);

// // Product Schema
// const ProductSchema = new mongoose.Schema({
//     name: String,
//     category: String,
//     image: String,
//     price: Number,
//     customizable: Boolean
// });
// const Product = mongoose.model("Product", ProductSchema);

// // Cart Schema
// const CartSchema = new mongoose.Schema({
//     userId: String,
//     products: [
//         {
//             productId: String,
//             quantity: Number,
//             customization: {
//                 text: String,
//                 image: String
//             }
//         }
//     ]
// });
// const Cart = mongoose.model("Cart", CartSchema);

// // Register User
// app.post("/api/register", async (req, res) => {
//     const { email, password, adminCode } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const isAdmin = adminCode === process.env.ADMIN_CODE;
//     const user = new User({ email, password: hashedPassword, isAdmin });
//     await user.save();
//     res.json({ message: "User registered successfully" });
// });

// // Login User
// app.post("/api/login", async (req, res) => {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ message: "Invalid credentials" });
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
//     const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
//     res.json({ token, isAdmin: user.isAdmin });
// });

// // Admin: Add Product
// app.post("/api/admin/products", async (req, res) => {
//     const { name, category, image, price, customizable } = req.body;
//     const product = new Product({ name, category, image, price, customizable });
//     await product.save();
//     res.json({ message: "Product added successfully" });
// });

// // Get Products
// app.get("/api/products", async (req, res) => {
//     const products = await Product.find();
//     res.json(products);
// });

// // Add to Cart
// app.post("/api/cart", async (req, res) => {
//     const { userId, productId, quantity, customization } = req.body;
//     let cart = await Cart.findOne({ userId });
//     if (!cart) {
//         cart = new Cart({ userId, products: [] });
//     }
//     cart.products.push({ productId, quantity, customization });
//     await cart.save();
//     res.json({ message: "Added to cart" });
// });

// // Checkout (Stripe & PayPal)
// app.post("/api/checkout", async (req, res) => {
//     const { userId, paymentMethod, amount } = req.body;
//     if (paymentMethod === "stripe") {
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: amount * 100,
//             currency: "usd"
//         });
//         res.json({ clientSecret: paymentIntent.client_secret });
//     } else if (paymentMethod === "paypal") {
//         const create_payment_json = {
//             "intent": "sale",
//             "payer": {
//                 "payment_method": "paypal"
//             },
//             "transactions": [{
//                 "amount": {
//                     "total": amount,
//                     "currency": "USD"
//                 },
//                 "description": "Purchase from Custom Packaging Store"
//             }],
//             "redirect_urls": {
//                 "return_url": "http://localhost:3000/success",
//                 "cancel_url": "http://localhost:3000/cancel"
//             }
//         };
//         paypal.payment.create(create_payment_json, function (error, payment) {
//             if (error) {
//                 res.status(500).json({ error: error.message });
//             } else {
//                 res.json({ approvalUrl: payment.links.find(link => link.rel === 'approval_url').href });
//             }
//         });
//     }
// });

// app.listen(5000, () => console.log("Server running on port 5000"));