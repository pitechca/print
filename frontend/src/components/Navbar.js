// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon, Menu, X, User, Package, Home, Info, Mail, LogOut, UserRoundCog } from 'lucide-react'; 

// Add this to your App.js or index.js or create a separate CSS file

// }

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Add padding to body
  useEffect(() => {
    // Add padding to body to prevent content from being hidden behind fixed navbar
    document.body.style.paddingTop = '80px';
    
    // Add media query for responsive padding
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = (e) => {
      if (e.matches) {
        document.body.style.paddingTop = '70px';
      } else {
        document.body.style.paddingTop = '80px';
      }
    };
    
    // Set initial padding based on screen size
    handleMediaChange(mediaQuery);
    
    // Add listener for screen size changes
    mediaQuery.addEventListener('change', handleMediaChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      document.body.style.paddingTop = '0';
    };
  }, []);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  
  // Check if current path is the admin dashboard
  const isAdminDashboard = location.pathname === '/admin';

  // Function to close menu when a mobile link is clicked
  const handleLinkClick = () => {
    setIsOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    // Redirect to home or login page after logout
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900 shadow-lg py-2' : 'bg-gray-800/90 backdrop-blur-sm py-4'}`}
    style={{marginTop: -90+'px'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left container with logo */}
          <div className="flex items-center h-full">           
            <Link to="/" className="flex items-center h-full">
              <img
                className="h-16 w-auto transition-all duration-300 hover:scale-105"
                src="../images/logoBagBox.png"
                alt="Bag & Box Store"
                style={{ maxHeight: '100%' }}
              />
              {/* <span className="ml-2 text-lg font-bold text-white hidden lg:block">BAG & BOX STORE</span> */}
            </Link>
          </div>
          
          {/* Center container with main navigation - desktop only */}
          <div className="hidden md:flex items-center justify-center space-x-1">
            <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/' ? 'text-blue-400 bg-gray-700' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'} transition-all duration-200`}>
              <span className="flex items-center"><Home className="w-4 h-4 mr-1" /> Home</span>
            </Link>
            <Link to="/products" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/products' ? 'text-blue-400 bg-gray-700' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'} transition-all duration-200`}>
              <span className="flex items-center"><Package className="w-4 h-4 mr-1" /> Shop</span>
            </Link>
            <Link to="/aboutUs" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/aboutUs' ? 'text-blue-400 bg-gray-700' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'} transition-all duration-200`}>
              <span className="flex items-center"><Info className="w-4 h-4 mr-1" /> About Us</span>
            </Link>
            <Link to="/contactUs" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/contactUs' ? 'text-blue-400 bg-gray-700' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'} transition-all duration-200`}>
              <span className="flex items-center"><Mail className="w-4 h-4 mr-1" /> Contact</span>
            </Link>
          </div>

          {/* Right container with user actions */}
          <div className="flex items-center space-x-4">
            {/* Account dropdown for desktop */}
            <div className="hidden md:block relative">
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-gray-300 hover:text-blue-400 focus:outline-none">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{user.name || 'Account'}</span>
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {user.isAdmin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-blue-400">
                        Admin Dashboard
                      </Link>
                    )}
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-blue-400">
                      My Profile
                    </Link>
                    {!user.isAdmin && (
                      <Link to="/orders" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-blue-400">
                        Orders
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-blue-400"
                    >
                      <span className="flex items-center"><LogOut className="w-4 h-4 mr-1" /> Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login" className="px-3 py-1 text-sm text-gray-300 hover:text-blue-400 border border-transparent hover:border-gray-700 rounded-md transition-all duration-200">
                    Login
                  </Link>
                  <Link to="/register" className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-all duration-200">
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Cart button */}
            <Link to="/cart" className="relative group p-1 rounded-full hover:bg-gray-700 transition-all duration-200">
              <ShoppingCartIcon className="w-6 h-6 text-gray-300 group-hover:text-blue-400" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Hamburger Menu - hidden on admin dashboard */}
            {!isAdminDashboard && (
              <button
                onClick={toggleMenu}
                className="md:hidden p-1 rounded-md focus:outline-none hover:bg-gray-700 transition-all duration-200"
              >
                {isOpen ? (
                  <X className="w-6 h-6 text-gray-300" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-300" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - hidden on admin dashboard */}
      {!isAdminDashboard && (
        <div
          className={`md:hidden bg-gray-800 shadow-lg overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link
              onClick={handleLinkClick}
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'text-blue-400 bg-gray-700' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'}`}
            >
              <span className="flex items-center"><Home className="w-4 h-4 mr-2" /> Home</span>
            </Link>
            <Link
              onClick={handleLinkClick}
              to="/products"
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/products' ? 'text-blue-400 bg-gray-700' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'}`}
            >
              <span className="flex items-center"><Package className="w-4 h-4 mr-2" /> Shop</span>
            </Link>
            <Link
              onClick={handleLinkClick}
              to="/aboutUs"
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/aboutUs' ? 'text-blue-400 bg-gray-700' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'}`}
            >
              <span className="flex items-center"><Info className="w-4 h-4 mr-2" /> About Us</span>
            </Link>
            <Link
              onClick={handleLinkClick}
              to="/contactUs"
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/contactUs' ? 'text-blue-400 bg-gray-700' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'}`}
            >
              <span className="flex items-center"><Mail className="w-4 h-4 mr-2" /> Contact Us</span>
            </Link>
            
            {user?.isAdmin && (
              <Link 
                onClick={handleLinkClick}
                to="/admin"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-blue-400 hover:bg-gray-700"
              >
                
                <span className="flex items-center"><UserRoundCog className="w-4 h-4 mr-2" /> Admin Dashboard</span>

              </Link>
            )}
            
            {/* User options */}
            {user ? (
              <>
                <Link
                  onClick={handleLinkClick}
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-blue-400 hover:bg-gray-700"
                >
                  <span className="flex items-center"><User className="w-4 h-4 mr-2" /> My Profile</span>
                </Link>
                {!user.isAdmin && (
                  <Link
                    onClick={handleLinkClick}
                    to="/orders"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-blue-400 hover:bg-gray-700"
                  >
                    Orders
                  </Link>
                )}
                <button 
                  onClick={() => {
                    handleLinkClick();
                    handleLogout();
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-blue-400 hover:bg-gray-700"
                >
                  <span className="flex items-center"><LogOut className="w-4 h-4 mr-2" /> Logout</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-1 px-3 py-2">
                <Link 
                  onClick={handleLinkClick}
                  to="/login"
                  className="w-full block py-2 text-center rounded-md text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-blue-400"
                >
                  Login
                </Link>          
                <Link 
                  onClick={handleLinkClick}
                  to="/register"
                  className="w-full block py-2 text-center rounded-md text-white bg-blue-600 hover:bg-blue-500"
                >
                  Register
                </Link>          
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;





// // working well after admin hamburgur removial
// // src/components/Navbar.js
// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useCart } from '../context/CartContext';
// import { ShoppingCartIcon, Menu, X } from 'lucide-react'; 

// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const { cart } = useCart();
//   const [isOpen, setIsOpen] = React.useState(false);
//   const location = useLocation();
//   const toggleMenu = () => setIsOpen(!isOpen);

//   // Check if current path is the admin dashboard
//   const isAdminDashboard = location.pathname === '/admin';

//   // Function to close menu when a mobile link is clicked
//   const handleLinkClick = () => {
//     setIsOpen(false);
//   };

//   return (
//     <nav className="bg-white shadow-lg">
//       <div className="w-full">
//         <div className="flex justify-between items-center h-16">
//           {/* Left container with logo */}
//           <div className="flex items-center">           
//             <Link to="/" className="text-xl font-bold">
//               <img
//                 style={{ maxHeight: '100px' }}
//                 src="../images/logoBagBox.png"
//                 alt="Logo"
//               />
//               {/* BAG & BOX STORE */}
//             </Link>
//           </div>
//           {/* Right container with cart & hamburger menu*/}
//           <div className="flex items-center space-x-4">
//             {/* Account links for desktop only */}
//             <div className="hidden md:flex items-center space-x-4">
//               {user?.isAdmin && (
//                 <Link to="/admin" className="hover:text-blue-600">
//                   Admin Dashboard
//                 </Link>
//               )}
//               {user ? (
//                 <>
//                   <Link to="/profile">Account</Link>
//                   {!user.isAdmin && <Link to="/orders">Orders</Link>}
//                 </>
//               ) : (
//                 <>
//                   <Link to="/login" className="hover:text-blue-600">
//                     Login
//                   </Link>
//                   <Link to="/register" className="hover:text-blue-600">
//                     Register
//                   </Link>
//                 </>
//               )}
//             </div>

//             <span style={{ lineHeight: '5px', paddingRight: '20px' }}>
//               <Link to="/cart" className="hover:text-blue-600">
//                 &nbsp; {cart.length}
//                 {<ShoppingCartIcon className="mr-2" />}
//               </Link>
//             </span>

//             {/* Hamburger Menu - hidden on admin dashboard */}
//             {!isAdminDashboard && (
//               <button
//                 style={{marginLeft: -10+'px', boxShadow: 'none', border: 'none', transform: 'none'}}
//                 onClick={toggleMenu}
//                 className="md:hidden ml-[10px] focus:outline-none"
//               >
//                 {isOpen ? (
//                   <X className="w-6 h-6 transition-transform duration-300" />
//                 ) : (
//                   <Menu className="w-6 h-6 transition-transform duration-300" />
//                 )}
//               </button>
//             )}
//           </div>
          
//         </div>
//       </div>
//       {/* Hamburger menu links for mobile view with smooth animation - hidden on admin dashboard */}
//       {!isAdminDashboard && (
//         <div
//           className={`md:hidden bg-white shadow-lg overflow-hidden transition-all duration-300 ${
//             isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
//           }`}
//         >
//           {user?.isAdmin && (
//             <Link 
//               onClick={handleLinkClick}
//               to="/admin"
//               className="block px-4 py-2 hover:bg-gray-200"
//             >Admin Dashboard</Link>
//           )}
//           <Link
//             onClick={handleLinkClick}
//             to="/"
//             className="block px-4 py-2 hover:bg-gray-200"
//           >
//             Home
//           </Link>
//           {user ? (
//             <Link
//             onClick={handleLinkClick}
//             to="/profile"
//             className="block px-4 py-2 hover:bg-gray-200"
//             >Account</Link>
//           ) : (
//             <>
//             <Link 
//              onClick={handleLinkClick}
//              to="/login"
//              className="block px-4 py-2 hover:bg-gray-200">
//               Login
//             </Link>          
//             </>
//           )}
//           <Link
//             onClick={handleLinkClick}
//             to="/products"
//             className="block px-4 py-2 hover:bg-gray-200"
//           >
//             Shop
//           </Link>
//           <Link
//             onClick={handleLinkClick}
//             to="/aboutUs"
//             className="block px-4 py-2 hover:bg-gray-200"
//           >
//             About Us
//           </Link>
//           <Link
//             onClick={handleLinkClick}
//             to="/contactUs"
//             className="block px-4 py-2 hover:bg-gray-200"
//           >
//             Contact Us
//           </Link>
//         </div>
//       )}
//     </nav>
//   );
// };

// export default Navbar;







// // working before removing hamburgur menu in admin
// // src/components/Navbar.js
// import React from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useCart } from '../context/CartContext';
// import { ShoppingCartIcon, Menu, X } from 'lucide-react'; 

// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const { cart } = useCart();
//   const [isOpen, setIsOpen] = React.useState(false);
//   const toggleMenu = () => setIsOpen(!isOpen);

//   // Function to close menu when a mobile link is clicked
//   const handleLinkClick = () => {
//     setIsOpen(false);
//   };

//   return (
//     <nav className="bg-white shadow-lg">
//       <div className="w-full">
//         <div className="flex justify-between items-center h-16">
//           {/* Left container with logo */}
//           <div className="flex items-center">           
//             <Link to="/" className="text-xl font-bold">
//               <img
//                 style={{ maxHeight: '100px' }}
//                 src="../images/logoBagBox.png"
//                 alt="Logo"
//               />
//               {/* BAG & BOX STORE */}
//             </Link>
//           </div>
//           {/* Right container with cart & hamburger menu*/}
//           <div className="flex items-center space-x-4">
//             {/* {user ? (
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
//             )} */}
//             {/* Account links for desktop only */}
//             <div className="hidden md:flex items-center space-x-4">
//               {user?.isAdmin && (
//                 <Link to="/admin" className="hover:text-blue-600">
//                   Admin Dashboard
//                 </Link>
//               )}
//               {user ? (
//                 <>
//                   <Link to="/profile">Account</Link>
//                   {!user.isAdmin && <Link to="/orders">Orders</Link>}
//                 </>
//               ) : (
//                 <>
//                   <Link to="/login" className="hover:text-blue-600">
//                     Login
//                   </Link>
//                   <Link to="/register" className="hover:text-blue-600">
//                     Register
//                   </Link>
//                 </>
//               )}
//             </div>

//             <span style={{ lineHeight: '5px', paddingRight: '20px' }}>
//               <Link to="/cart" className="hover:text-blue-600">
//                 &nbsp; {cart.length}
//                 {<ShoppingCartIcon className="mr-2" />}
//               </Link>
//             </span>

//             {/* Hamburger Menu */}
//             <button
//               style={{marginLeft: -10+'px', boxShadow: 'none', border: 'none', transform: 'none'}}
//               onClick={toggleMenu}
//               className="md:hidden ml-[10px] focus:outline-none"
//             >
//               {isOpen ? (
//                 <X className="w-6 h-6 transition-transform duration-300" />
//               ) : (
//                 <Menu className="w-6 h-6 transition-transform duration-300" />
//               )}
//             </button>

//           </div>
          
//         </div>
//       </div>
//       {/* Hamburger menu links for mobile view with smooth animation */}
//       <div
//         className={`md:hidden bg-white shadow-lg overflow-hidden transition-all duration-300 ${
//           isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
//         }`}
//       >
//         {user?.isAdmin && (
//           <Link 
//             onClick={handleLinkClick}
//             to="/admin"
//             className="block px-4 py-2 hover:bg-gray-200"
//           >Admin Dashboard</Link>
//         )}
//         <Link
//           onClick={handleLinkClick}
//           to="/"
//           className="block px-4 py-2 hover:bg-gray-200"
//         >
//           Home
//         </Link>
//         {user ? (
//           <Link
//           onClick={handleLinkClick}
//           to="/profile"
//           className="block px-4 py-2 hover:bg-gray-200"
//           >Account</Link>
//         ) : (
//           <>
//           <Link 
//            onClick={handleLinkClick}
//            to="/login"
//            className="block px-4 py-2 hover:bg-gray-200">
//             Login
//           </Link>          
//           </>
//         )}
//         <Link
//           onClick={handleLinkClick}
//           to="/products"
//           className="block px-4 py-2 hover:bg-gray-200"
//         >
//           Shop
//         </Link>
//         <Link
//           onClick={handleLinkClick}
//           to="/aboutUs"
//           className="block px-4 py-2 hover:bg-gray-200"
//         >
//           About Us
//         </Link>
//         <Link
//           onClick={handleLinkClick}
//           to="/contactUs"
//           className="block px-4 py-2 hover:bg-gray-200"
//         >
//           Contact Us
//         </Link>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

