// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon} from 'lucide-react'; 


const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">
            BAG & BOX STORE
          </Link>
          <div className="flex items-center space-x-4">
            {user?.isAdmin && (
              <Link to="/admin" className="hover:text-blue-600">
                Admin Dashboard
              </Link>
            )}
         
            <Link to="/orders">Orders</Link>
            {/* {user?.isAdmin==false && (
            <Link to="/profile">Profile</Link>)}             */}
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
            <span style={{lineHeight:5+"px"}}>
            <Link to="/cart" className="hover:text-blue-600">
              &nbsp; {cart.length} 
              {<ShoppingCartIcon className="mr-2"/>}
            </Link>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
