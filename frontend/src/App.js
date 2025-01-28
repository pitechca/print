// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductEditor from './components/ProductEditor';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import './styles/main.css';
import Footer from './components/Footer';
import AboutUs from './pages/AboutUs';


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8" style={{minWidth:100 + "%", padding: 0}}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/customize/:productId" element={<ProductEditor />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/orders" element={<Orders />} />  
                <Route path="/aboutUs" element={<AboutUs />} />  
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;





// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
