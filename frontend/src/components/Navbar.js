// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon, Menu, X } from 'lucide-react'; 

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  // Function to close menu when a mobile link is clicked
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="w-full">
        <div className="flex justify-between items-center h-16">
          {/* Left container with hamburger menu and logo */}
          <div className="flex items-center">
            <button
              onClick={toggleMenu}
              // Added a 10px left margin using Tailwind's arbitrary value syntax
              className="md:hidden ml-[10px] focus:outline-none"
            >
              {isOpen ? (
                <X className="w-6 h-6 transition-transform duration-300" />
              ) : (
                <Menu className="w-6 h-6 transition-transform duration-300" />
              )}
            </button>
            <Link to="/" className="text-xl font-bold">
              <img
                style={{ maxHeight: '100px' }}
                src="../images/logoBagBox.png"
                alt="Logo"
              />
              {/* BAG & BOX STORE */}
            </Link>
          </div>
          {/* Right container remains unchanged */}
          <div className="flex items-center space-x-4">
            {user?.isAdmin && (
              <Link to="/admin" className="hover:text-blue-600">
                Admin Dashboard
              </Link>
            )}
            {/* {user ? (
              <Link to="/profile">Account</Link>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-600">
                  Login
                </Link>
                <Link to="/register" className="hover:text-blue-600">
                  Register
                </Link>
              </>
            )} */}
            {/* Account links for desktop only */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/profile">Account</Link>
                  {!user.isAdmin && <Link to="/orders">Orders</Link>}
                </>
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

            <span style={{ lineHeight: '5px', paddingRight: '20px' }}>
              <Link to="/cart" className="hover:text-blue-600">
                &nbsp; {cart.length}
                {<ShoppingCartIcon className="mr-2" />}
              </Link>
            </span>
          </div>
        </div>
      </div>
      {/* Hamburger menu links for mobile view with smooth animation */}
      <div
        className={`md:hidden bg-white shadow-lg overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <Link
          onClick={handleLinkClick}
          to="/"
          className="block px-4 py-2 hover:bg-gray-200"
        >
          Home
        </Link>
        {user ? (
          <Link
          onClick={handleLinkClick}
          to="/profile"
          className="block px-4 py-2 hover:bg-gray-200"
          >Account</Link>
        ) : (
          <>
          <Link 
           onClick={handleLinkClick}
           to="/login"
           className="block px-4 py-2 hover:bg-gray-200">
            Login
          </Link>          
          </>
        )}
        <Link
          onClick={handleLinkClick}
          to="/products"
          className="block px-4 py-2 hover:bg-gray-200"
        >
          Shop
        </Link>
        <Link
          onClick={handleLinkClick}
          to="/aboutUs"
          className="block px-4 py-2 hover:bg-gray-200"
        >
          About Us
        </Link>
        <Link
          onClick={handleLinkClick}
          to="/contactUs"
          className="block px-4 py-2 hover:bg-gray-200"
        >
          Contact Us
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;




// // with hambergur menu
// // src/components/Navbar.js
// import React from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useCart } from '../context/CartContext';
// import { ShoppingCartIcon, Menu } from 'lucide-react'; 

// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const { cart } = useCart();
//   const [isOpen, setIsOpen] = React.useState(false);
//   const toggleMenu = () => setIsOpen(!isOpen);

//   return (
//     <nav className="bg-white shadow-lg">
//       <div className="w-full">
//         <div className="flex justify-between items-center h-16">
//           {/* Left container with hamburger menu and logo */}
//           <div className="flex items-center">
//             <button onClick={toggleMenu} className="md:hidden mr-2">
//               <Menu className="w-6 h-6" />
//             </button>
//             <Link to="/" className="text-xl font-bold">
//               <img style={{ maxHeight: '100px' }} src='../images/logoBagBox.png' alt="Logo" />
//               {/* BAG & BOX STORE */}
//             </Link>
//           </div>
//           {/* Right container remains unchanged */}
//           <div className="flex items-center space-x-4">
//             {user?.isAdmin && (
//               <Link to="/admin" className="hover:text-blue-600">
//                 Admin Dashboard
//               </Link>
//             )}
//             {user ? (
//               <Link to="/profile">Account</Link>  
//             ) : (
//               <>
//                 <Link to="/login" className="hover:text-blue-600">
//                   Login
//                 </Link>
//                 <Link to="/register" className="hover:text-blue-600">
//                   Register
//                 </Link>
//               </>
//             )}
//             {user ? (!user.isAdmin ? (<Link to="/orders">Orders</Link>) : ("")) : ("")}
//             <span style={{ lineHeight: '5px', paddingRight: 20+'px' }}>
//               <Link to="/cart" className="hover:text-blue-600">
//                 &nbsp; {cart.length} 
//                 {<ShoppingCartIcon className="mr-2" />}
//               </Link>
//             </span>
//           </div>
//         </div>
//       </div>
//       {/* Hamburger menu links for mobile view */}
//       {isOpen && (
//         <div className="md:hidden bg-white shadow-lg">
//           <Link to="/" className="block px-4 py-2 hover:bg-gray-200">Home</Link>
//           <Link to="/products" className="block px-4 py-2 hover:bg-gray-200">Shop</Link>
//           <Link to="/aboutUs" className="block px-4 py-2 hover:bg-gray-200">About Us</Link>
//           <Link to="/contactUs" className="block px-4 py-2 hover:bg-gray-200">Contact Us</Link>

//           {/* Add more links here as needed */}
//         </div>
//       )}
//     </nav>
//   );
// }

// export default Navbar;









// working properly without hamburger menu
// // src/components/Navbar.js
// import React from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useCart } from '../context/CartContext';
// import { ShoppingCartIcon} from 'lucide-react'; 


// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const { cart } = useCart();

//   return (
//     <nav className="bg-white shadow-lg">
//       <div className="container mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           <Link to="/" className="text-xl font-bold">
//            <img style={{maxHeight:100+'px'}}
//            src='../images/logoBagBox.png' />
//             {/* BAG & BOX STORE */}
//           </Link>
//           <div className="flex items-center space-x-4">
//             {user?.isAdmin && (
//               <Link to="/admin" className="hover:text-blue-600">
//                 Admin Dashboard
//               </Link>
//             )}
//             {user ? (
//                <Link to="/profile">Account</Link>  
//               // <button
//               //   onClick={logout}
//               //   className="hover:text-blue-600"
//               // >
//               //   Logout
//               // </button>
//             ) : (
//               <>
//                 <Link to="/login" className="hover:text-blue-600">
//                   Login
//                 </Link>
//                 <Link to="/register" className="hover:text-blue-600">
//                   Register
//                 </Link>
//               </>
//             )}
//             {/* {user?  (<Link to="/orders">Orders</Link>) : ("") }             */}
//             {user? (!user.isAdmin?  (<Link to="/orders">Orders</Link>) : ("") ) : ("")}            

//             <span style={{lineHeight:5+"px"}}>
//             <Link to="/cart" className="hover:text-blue-600">
//               &nbsp; {cart.length} 
//               {<ShoppingCartIcon className="mr-2"/>}
//             </Link>
//             </span>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;
