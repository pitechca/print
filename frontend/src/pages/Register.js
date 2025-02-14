import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';


const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const sanitizeInput = (input) => {
    return input.trim().replace(/\s+/g, ' ');
  };

  const validateInputs = () => {
    const cleanEmail = sanitizeInput(email);
    const cleanPhone = sanitizeInput(phone);
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid phone number');
      return false;
    }

    // Password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordStrengthRegex.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and special character');
      return false;
    }

    // Postal code validation only if provided
    if (postalCode.trim()) {
      const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      if (!postalCodeRegex.test(postalCode.trim())) {
        setError('Please enter a valid Canadian postal code');
        return false;
      }
    }

    // Required fields check
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all required fields');
      return false;
    }

    // Admin code validation (if provided)
    if (adminCode) {
      const cleanAdminCode = sanitizeInput(adminCode);
      if (cleanAdminCode.length < 6) {
        setError('Invalid admin code');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    if (!validateInputs()) {
      return;
    }
    
    console.log('Form submitted - starting validation');
  
    try {
      const cleanEmail = sanitizeInput(email);
      const cleanPhone = sanitizeInput(phone);
      const cleanAdminCode = adminCode ? sanitizeInput(adminCode) : '';
  
      const requestData = {
        email: cleanEmail,
        password,
        phone: cleanPhone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        adminCode: cleanAdminCode,
        company: company.trim()
      };
  
      // Only include addresses array if any address field is filled
      if (street.trim() || city.trim() || state.trim() || postalCode.trim()) {
        const addressData = {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: 'Canada'
        };
        requestData.addresses = [addressData];
        console.log('Adding address to request:', addressData);
      }
      
      console.log('Final request data:', requestData);
  
      const { data } = await axios.post('/api/register', requestData);
      login(data.user, data.token);
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      if (errorMessage.toLowerCase().includes('email')) {
        document.querySelector('input[type="email"]').focus();
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8" style={{marginTop: 50, marginBottom: 30}}>
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="md:grid md:grid-cols-2 md:gap-8">
          {/* Left Column - Personal Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                At least 8 characters with uppercase, lowercase, number, and special character.
              </p>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                maxLength={20}
              />
            </div>       

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Admin Code (Optional)</label>
              <input
                type="text"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
            </div>
          </div>

          {/* Right Column - Shipping Address */}
          <div className="mt-8 md:mt-0">
            <h3 className="text-lg font-medium mb-6">Shipping Address (Optional)</h3>
            <div className="space-y-6">

              {/* Replace just this part in your Right Column - Shipping Address section */}
              <div>
                <AddressAutocomplete 
                  index={0} // Since registration only has one address
                  address={{
                    street: street,
                    city: city,
                    state: state,
                    postalCode: postalCode,
                    country: 'Canada'
                  }}
                  onAddressChange={(index, field, value) => {
                    // Update the corresponding state based on the field
                    switch (field) {
                      case 'street':
                        setStreet(value);
                        break;
                      case 'city':
                        setCity(value);
                        break;
                      case 'state':
                        setState(value);
                        break;
                      case 'postalCode':
                        setPostalCode(value);
                        break;
                      default:
                        break;
                    }
                  }}
                />
              </div>
                            
              {/* <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Street Address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
              </div> */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Province</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={7}
                  placeholder="A1A 1A1"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Company (Optional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;





// // working with multiple address but no auto complete
// // src/pages/Register.js
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';
// import { Eye, EyeOff } from 'lucide-react';

// const Register = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [adminCode, setAdminCode] = useState('');
//   const [phone, setPhone] = useState('');
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [street, setStreet] = useState('');
//   const [city, setCity] = useState('');
//   const [state, setState] = useState('');
//   const [postalCode, setPostalCode] = useState('');
//   const [company, setCompany] = useState('');
//   const [error, setError] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const sanitizeInput = (input) => {
//     return input.trim().replace(/\s+/g, ' ');
//   };

//   const validateInputs = () => {
//     const cleanEmail = sanitizeInput(email);
//     const cleanPhone = sanitizeInput(phone);
    
//     // Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(cleanEmail)) {
//       setError('Please enter a valid email address');
//       return false;
//     }

//     // Phone validation
//     const phoneRegex = /^\+?[\d\s-]{8,}$/;
//     if (!phoneRegex.test(cleanPhone)) {
//       setError('Please enter a valid phone number');
//       return false;
//     }

//     // Password validation
//     if (password.length < 8) {
//       setError('Password must be at least 8 characters long');
//       return false;
//     }

//     const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//     if (!passwordStrengthRegex.test(password)) {
//       setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and special character');
//       return false;
//     }

//     // Postal code validation only if provided
//     if (postalCode.trim()) {
//       const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
//       if (!postalCodeRegex.test(postalCode.trim())) {
//         setError('Please enter a valid Canadian postal code');
//         return false;
//       }
//     }

//     // Required fields check
//     if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
//       setError('Please fill in all required fields');
//       return false;
//     }

//     // Admin code validation (if provided)
//     if (adminCode) {
//       const cleanAdminCode = sanitizeInput(adminCode);
//       if (cleanAdminCode.length < 6) {
//         setError('Invalid admin code');
//         return false;
//       }
//     }

//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
  
//     if (!validateInputs()) {
//       return;
//     }
    
//     console.log('Form submitted - starting validation');
  
//     try {
//       const cleanEmail = sanitizeInput(email);
//       const cleanPhone = sanitizeInput(phone);
//       const cleanAdminCode = adminCode ? sanitizeInput(adminCode) : '';
  
//       const requestData = {
//         email: cleanEmail,
//         password,
//         phone: cleanPhone,
//         firstName: firstName.trim(),
//         lastName: lastName.trim(),
//         adminCode: cleanAdminCode,
//         company: company.trim()
//       };
  
//       // Only include addresses array if any address field is filled
//       if (street.trim() || city.trim() || state.trim() || postalCode.trim()) {
//         const addressData = {
//           street: street.trim(),
//           city: city.trim(),
//           state: state.trim(),
//           postalCode: postalCode.trim(),
//           country: 'Canada'
//         };
//         requestData.addresses = [addressData];
//         console.log('Adding address to request:', addressData);
//       }
      
//       console.log('Final request data:', requestData);
  
//       const { data } = await axios.post('/api/register', requestData);
//       login(data.user, data.token);
//       navigate('/');
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
//       setError(errorMessage);
      
//       if (errorMessage.toLowerCase().includes('email')) {
//         document.querySelector('input[type="email"]').focus();
//       }
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8" style={{marginTop: 50, marginBottom: 30}}>
//       <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
//           {error}
//         </div>
//       )}
      
//       <form onSubmit={handleSubmit} autoComplete="off">
//         <div className="md:grid md:grid-cols-2 md:gap-8">
//           {/* Left Column - Personal Information */}
//           <div className="space-y-6">
//             <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-gray-700 text-sm font-medium mb-2">First Name *</label>
//                 <input
//                   type="text"
//                   value={firstName}
//                   onChange={(e) => setFirstName(e.target.value)}
//                   className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   required
//                   maxLength={50}
//                 />
//               </div>
//               <div>
//                 <label className="block text-gray-700 text-sm font-medium mb-2">Last Name *</label>
//                 <input
//                   type="text"
//                   value={lastName}
//                   onChange={(e) => setLastName(e.target.value)}
//                   className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   required
//                   maxLength={50}
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-gray-700 text-sm font-medium mb-2">Email *</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//                 maxLength={100}
//               />
//             </div>

//             <div>
//               <label className="block text-gray-700 text-sm font-medium mb-2">Password *</label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   required
//                   maxLength={128}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//               <p className="text-sm text-gray-500 mt-1">
//                 At least 8 characters with uppercase, lowercase, number, and special character.
//               </p>
//             </div>

//             <div>
//               <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number *</label>
//               <input
//                 type="tel"
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//                 maxLength={20}
//               />
//             </div>       

//             <div>
//               <label className="block text-gray-700 text-sm font-medium mb-2">Admin Code (Optional)</label>
//               <input
//                 type="text"
//                 value={adminCode}
//                 onChange={(e) => setAdminCode(e.target.value)}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 maxLength={50}
//               />
//             </div>
//           </div>

//           {/* Right Column - Shipping Address */}
//           <div className="mt-8 md:mt-0">
//             <h3 className="text-lg font-medium mb-6">Shipping Address (Optional)</h3>
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-gray-700 text-sm font-medium mb-2">Street Address</label>
//                 <input
//                   type="text"
//                   value={street}
//                   onChange={(e) => setStreet(e.target.value)}
//                   className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   maxLength={100}
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-gray-700 text-sm font-medium mb-2">City</label>
//                   <input
//                     type="text"
//                     value={city}
//                     onChange={(e) => setCity(e.target.value)}
//                     className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     maxLength={50}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-gray-700 text-sm font-medium mb-2">Province</label>
//                   <input
//                     type="text"
//                     value={state}
//                     onChange={(e) => setState(e.target.value)}
//                     className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     maxLength={50}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-gray-700 text-sm font-medium mb-2">Postal Code</label>
//                 <input
//                   type="text"
//                   value={postalCode}
//                   onChange={(e) => setPostalCode(e.target.value)}
//                   className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   maxLength={7}
//                   placeholder="A1A 1A1"
//                 />
//               </div>

//               <div>
//                 <label className="block text-gray-700 text-sm font-medium mb-2">Company (Optional)</label>
//                 <input
//                   type="text"
//                   value={company}
//                   onChange={(e) => setCompany(e.target.value)}
//                   className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   maxLength={100}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="mt-8">
//           <button
//             type="submit"
//             className="w-full bg-blue-500 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//           >
//             Create Account
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Register;







// //working with 1 address
// // src/pages/Register.js
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';
// const Register = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [adminCode, setAdminCode] = useState('');
//   const [phone, setPhone] = useState('');
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const sanitizeInput = (input) => {
//     return input.trim().replace(/\s+/g, ' ');
//   };

//   const validateInputs = () => {
//     const cleanEmail = sanitizeInput(email);
//     const cleanPhone = sanitizeInput(phone);
    
//     // Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(cleanEmail)) {
//       setError('Please enter a valid email address');
//       return false;
//     }

//     // Phone validation (adjust regex according to your needs)
//     const phoneRegex = /^\+?[\d\s-]{8,}$/;
//     if (!phoneRegex.test(cleanPhone)) {
//       setError('Please enter a valid phone number');
//       return false;
//     }

//     // Password validation
//     if (password.length < 8) {
//       setError('Password must be at least 8 characters long');
//       return false;
//     }

//     // Password strength check
//     const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//     if (!passwordStrengthRegex.test(password)) {
//       setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
//       return false;
//     }

//     // Admin code validation (if provided)
//     if (adminCode) {
//       const cleanAdminCode = sanitizeInput(adminCode);
//       if (cleanAdminCode.length < 6) {
//         setError('Invalid admin code');
//         return false;
//       }
//     }

//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (!validateInputs()) {
//       return;
//     }

//     try {
//       const cleanEmail = sanitizeInput(email);
//       const cleanPhone = sanitizeInput(phone);
//       const cleanAdminCode = adminCode ? sanitizeInput(adminCode) : '';

//       const { data } = await axios.post('/api/register', {
//         email: cleanEmail,
//         password: password, // Don't trim password
//         phone: cleanPhone,
//         adminCode: cleanAdminCode
//       }, {
//         headers: {
//           'Content-Type': 'application/json',
//           // Add CSRF token if you have it
//           // 'X-CSRF-Token': getCsrfToken(),
//         }
//       });

//       login(data.user, data.token);
//       navigate('/');
//     } catch (error) {
//       // Generic error message
//       setError('Registration failed. Please try again.');
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6" style={{marginTop: 50+'px', marginBottom: 30+'px'}}>
//       <h2 className="text-2xl font-bold mb-4">Register</h2>
//       {error && <p className="text-red-500 mb-4">{error}</p>}
//       <form onSubmit={handleSubmit} autoComplete="off">
//         <div className="mb-4">
//           <label className="block text-gray-700 mb-2">Email</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="w-full px-3 py-2 border rounded"
//             required
//             maxLength={100}
//             autoComplete="email"
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700 mb-2">Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             className="w-full px-3 py-2 border rounded"
//             required
//             maxLength={128}
//             autoComplete="new-password"
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700 mb-2">Phone Number</label>
//           <input
//             type="tel"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//             className="w-full px-3 py-2 border rounded"
//             required
//             maxLength={20}
//             autoComplete="tel"
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700 mb-2">Admin Code (Optional)</label>
//           <input
//             type="text"
//             value={adminCode}
//             onChange={(e) => setAdminCode(e.target.value)}
//             className="w-full px-3 py-2 border rounded"
//             maxLength={50}
//             autoComplete="off"
//           />
//         </div>
//         <button
//           type="submit"
//           className="w-full bg-blue-500 text-white px-4 py-2 rounded"
//         >
//           Register
//         </button>
//       </form>
//     </div>
//   );
// };

// export default Register;