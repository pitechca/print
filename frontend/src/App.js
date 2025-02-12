// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/main.css';
import ProductEditorRoute from './routs/ProductEditorRoute';

//components
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
// import ProductEditor from './components/ProductEditor';

//Context
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

//pages
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Product from './pages/Product';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import SalesReport from './pages/SalesReport';



function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8" style={{minWidth:100 + "%", padding: 0}}>
              <Routes>
                <Route path="/" element={<Home />} />
                {/* <Route path="/customize/:productId" element={<ProductEditor />} /> */}
                <Route path="/customize/:productId" element={<ProductEditorRoute />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/orders" element={<Orders />} />  
                <Route path="/aboutUs" element={<AboutUs />} />  
                <Route path="/contactUs" element={<Contact/>} />
                <Route path="/products" element={<Product/>} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/sales" element={<SalesReport />} />
              </Routes>
            </main>
            <Footer style={{}}/>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
