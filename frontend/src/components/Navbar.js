// with hambergur menu
// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon, Menu } from 'lucide-react'; 

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white shadow-lg">
      <div className="w-full">
        <div className="flex justify-between items-center h-16">
          {/* Left container with hamburger menu and logo */}
          <div className="flex items-center">
            <button onClick={toggleMenu} className="md:hidden mr-2">
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="text-xl font-bold">
              <img style={{ maxHeight: '100px' }} src='../images/logoBagBox.png' alt="Logo" />
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
            {user ? (
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
            )}
            {user ? (!user.isAdmin ? (<Link to="/orders">Orders</Link>) : ("")) : ("")}
            <span style={{ lineHeight: '5px', paddingRight: 20+'px' }}>
              <Link to="/cart" className="hover:text-blue-600">
                &nbsp; {cart.length} 
                {<ShoppingCartIcon className="mr-2" />}
              </Link>
            </span>
          </div>
        </div>
      </div>
      {/* Hamburger menu links for mobile view */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <Link to="/" className="block px-4 py-2 hover:bg-gray-200">Home</Link>
          <Link to="/shop" className="block px-4 py-2 hover:bg-gray-200">Shop</Link>
          <Link to="/about" className="block px-4 py-2 hover:bg-gray-200">About</Link>
          {/* Add more links here as needed */}
        </div>
      )}
    </nav>
  );
}

export default Navbar;









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
