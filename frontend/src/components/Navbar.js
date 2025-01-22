// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">
            Custom Packaging Store
          </Link>
          <div className="flex items-center space-x-4">
            {user?.isAdmin && (
              <Link to="/admin" className="hover:text-blue-600">
                Admin Dashboard
              </Link>
            )}
            <Link to="/cart" className="hover:text-blue-600">
              Cart ({cart.length})
            </Link>
            {user ? (
              <button
                onClick={logout}
                className="hover:text-blue-600"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-600">
                  Login
                </Link>
                <Link to="/register" className="hover:text-blue-600">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
