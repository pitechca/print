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
