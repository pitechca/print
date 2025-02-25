// workin fine without steps
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { useLocation } from 'react-router-dom';


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
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const prefilledIdentifier = params.get('identifier') || '';
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState(prefilledIdentifier);

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
  
    if (step !== 3) {
      return; // This is an additional safety check
    }

    if (!validateInputs()) {
      return;
    }
    
    console.log('Form submitted - starting validation');
    if (step === 3 && postalCode.trim()) {
      const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      if (!postalCodeRegex.test(postalCode.trim())) {
        setError('Please enter a valid Canadian postal code');
        return;
      }
    }
  
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

      <div className="w-full mb-6">
        <div className="flex justify-between mb-2">
          <span className={`font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>Account</span>
          <span className={`font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>Personal Info</span>
          <span className={`font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>Address</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} autoComplete="off">


        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-4">Account Information</h3>
              
             

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

            </div>
          )}

        {step === 2 && (  
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
              <label className="block text-gray-700 text-sm font-medium mb-2">Company (Optional)</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>
            
            {/* <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Admin Code (Optional)</label>
              <input
                type="text"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
            </div> */}

          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-4">Shipping Address (Optional)</h3>
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

            
            </div>
        )}
        {/* <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Account
          </button>
        </div> */}
        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault(); 
                setStep(step - 1);
              }}
              className="bg-gray-200 text-gray-800 py-3 px-6 rounded-md font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button
              type="button" // This explicitly prevents form submission
              onClick={(e) => {
                e.preventDefault(); // Add this to be doubly sure
                // Validation for each step
                setError('');
                if (step === 1) {
                  // Validate email, password and phone
                  const cleanEmail = sanitizeInput(email);
                  const cleanPhone = sanitizeInput(phone);
                  
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(cleanEmail)) {
                    setError('Please enter a valid email address');
                    return;
                  }

                  const phoneRegex = /^\+?[\d\s-]{8,}$/;
                  if (!phoneRegex.test(cleanPhone)) {
                    setError('Please enter a valid phone number');
                    return;
                  }

                  if (password.length < 8) {
                    setError('Password must be at least 8 characters long');
                    return;
                  }

                  const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                  if (!passwordStrengthRegex.test(password)) {
                    setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and special character');
                    return;
                  }
                } else if (step === 2) {
                  // Validate name fields
                  if (!firstName.trim() || !lastName.trim()) {
                    setError('Please fill in all required fields');
                    return;
                  }
                  
                  // Admin code validation (if provided)
                  if (adminCode) {
                    const cleanAdminCode = sanitizeInput(adminCode);
                    if (cleanAdminCode.length < 6) {
                      setError('Invalid admin code');
                      return;
                    }
                  }
                }
                
                setStep(step + 1);
              }}
              className="ml-auto bg-blue-500 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Next
            </button>
          ) : (
            <button
              type="submit" // This one should remain as submit for the final step
              className="ml-auto bg-blue-500 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Account
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Register;
















// // steps but not working
// // src/pages/Register.js
// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';
// import { Eye, EyeOff } from 'lucide-react';
// import AddressAutocomplete from '../components/AddressAutocomplete'

// const Register = () => {
//   const navigate = useNavigate();
//   const { login } = useAuth();
//   const location = useLocation();
//   const params = new URLSearchParams(location.search);
//   const prefilledIdentifier = params.get('identifier') || '';
//   const [street, setStreet] = useState('');


//   // Step tracking
//   const [step, setStep] = useState(1);
//   const totalSteps = 3;

//   // Form fields
//   const [email, setEmail] = useState(prefilledIdentifier.includes('@') ? prefilledIdentifier : '');
//   const [phone, setPhone] = useState(!prefilledIdentifier.includes('@') ? prefilledIdentifier : '');
//   const [password, setPassword] = useState('');
//   // const [confirmPassword, setConfirmPassword] = useState('');
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [company, setCompany] = useState('');
//   const [address, setAddress] = useState('');
//   const [city, setCity] = useState('');
//   const [state, setState] = useState('');
//   const [postalCode, setPostalCode] = useState('');
//   const [country, setCountry] = useState('');
//   const [error, setError] = useState('');
//   const [showPassword, setShowPassword] = useState(false);

//   // Google Places Autocomplete
//   const addressInputRef = useRef(null);
//   const autocompleteRef = useRef(null);

//   // Initialize Google Places Autocomplete
//   // Replace your useEffect for Google Places with this:
// useEffect(() => {
//   if (step === 3 && window.google && window.google.maps && addressInputRef.current) {
//     autocompleteRef.current = new window.google.maps.places.Autocomplete(
//       addressInputRef.current,
//       { types: ['address'], componentRestrictions: { country: ['ca'] } }
//     );

//     autocompleteRef.current.addListener('place_changed', () => {
//       const place = autocompleteRef.current.getPlace();
//       if (!place.geometry) {
//         return;
//       }

//       let streetNumber = '';
//       let route = '';
//       let postalCode = '';
//       let city = '';
//       let state = '';
//       let country = 'Canada';

//       // Extract address components
//       for (const component of place.address_components) {
//         const componentType = component.types[0];

//         switch (componentType) {
//           case 'street_number':
//             streetNumber = component.long_name;
//             break;
//           case 'route':
//             route = component.long_name;
//             break;
//           case 'postal_code':
//             setPostalCode(component.long_name);
//             break;
//           case 'locality':
//             setCity(component.long_name);
//             break;
//           case 'administrative_area_level_1':
//             setState(component.long_name);
//             break;
//           case 'country':
//             setCountry(component.long_name);
//             break;
//           default:
//             break;
//         }
//       }

//       // Combine street number and route for street address
//       const fullStreet = streetNumber && route 
//         ? `${streetNumber} ${route}` 
//         : place.formatted_address;
      
//       setStreet(fullStreet);
//     });

//     return () => {
//       if (autocompleteRef.current) {
//         window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
//       }
//     };
//   }
// }, [step]);

//   const sanitizeInput = (input) => {
//     // Remove leading/trailing whitespace and normalize spaces
//     return input.trim().replace(/\s+/g, ' ');
//   };

//   const validateStep1 = () => {
//     setError('');
//     const cleanEmail = sanitizeInput(email);
//     const cleanPhone = sanitizeInput(phone);
    
//     // Validate email
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(cleanEmail)) {
//       setError('Please enter a valid email address');
//       return false;
//     }

//     // Validate phone
//     const phoneRegex = /^\+?[\d\s-]{8,}$/;
//     if (!phoneRegex.test(cleanPhone)) {
//       setError('Please enter a valid phone number');
//       return false;
//     }

//     // Validate password
//     if (password.length < 8) {
//       setError('Password must be at least 8 characters long');
//       return false;
//     }

//     // // Validate password confirmation
//     // if (password !== confirmPassword) {
//     //   setError('Passwords do not match');
//     //   return false;
//     // }

//     return true;
//   };

//   const validateStep2 = () => {
//     setError('');

//     // Validate names
//     if (firstName.trim() === '') {
//       setError('First name is required');
//       return false;
//     }

//     if (lastName.trim() === '') {
//       setError('Last name is required');
//       return false;
//     }

//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     // Final validation for address fields
//     if (!street) {
//       setError('Please enter your street address');
//       return;
//     }

//     // if (!address) {
//     //   setError('Please enter your address');
//     //   return;
//     // }

//     if (!city) {
//       setError('Please enter your city');
//       return;
//     }

//     if (!postalCode) {
//       setError('Please enter your postal code');
//       return;
//     }

//     // if (!country) {
//     //   setError('Please enter your country');
//     //   return;
//     // }

//     try {
//       // Prepare registration data
//       const userData = {
//         email: sanitizeInput(email),
//         phone: sanitizeInput(phone),
//         password,
//         firstName,
//         lastName,
//         company, // Optional
//         // address,
//         address: street,
//         city,
//         state,
//         postalCode,
//         country: country || 'Canada' // Default to Canada if empty
//       };

//       // Submit registration request
//       const { data } = await axios.post('/api/register', userData, {
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });

//       // Login the user with returned credentials
//       await login(data.user, data.token);
      
//       // Navigate to home page after successful registration
//       navigate('/');
//     } catch (error) {
//       // Handle registration errors
//       const errorMessage = error.response?.data?.message || 'Registration failed';
//       setError(errorMessage);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6" style={{marginTop: 100+'px', marginBottom: 70+'px'}}>
//       <h2 className="text-2xl font-bold mb-4">Create an Account</h2>
      
//       {/* Progress Bar */}
//       <div className="mb-6">
//         <div className="flex justify-between mb-2">
//           {[...Array(totalSteps)].map((_, index) => (
//             <div key={index} className="text-sm font-medium">
//               Step {index + 1}
//             </div>
//           ))}
//         </div>
//         <div className="w-full bg-gray-200 rounded-full h-2.5">
//           <div
//             className="bg-blue-600 h-2.5 rounded-full"
//             style={{ width: `${(step / totalSteps) * 100}%` }}
//           ></div>
//         </div>
//       </div>
      
//       {error && <p className="text-red-500 mb-4">{error}</p>}
      
//       <form onSubmit={handleSubmit} autoComplete="off">
//         {/* Step 1: Account Information */}
//         {step === 1 && (
//           <>
//             <h3 className="text-lg font-medium mb-4">Account Information</h3>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Email Address</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 placeholder="Enter your email address"
//                 required
//                 maxLength={100}
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Phone Number</label>
//               <input
//                 type="tel"
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 placeholder="Enter your phone number"
//                 required
//                 maxLength={20}
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Password</label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   required
//                   minLength={8}
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
//             </div>
//             {/* <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Confirm Password</label>
//               <input
//                 type="password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 required
//                 minLength={8}
//                 maxLength={128}
//               />
//             </div> */}
//             <button
//               type="button"
//               onClick={() => {
//                 if (validateStep1()) setStep(2);
//               }}
//               className="w-full bg-blue-500 text-white px-4 py-2 rounded"
//             >
//               Continue
//             </button>
//           </>
//         )}

//         {/* Step 2: Personal Information */}
//         {step === 2 && (
//           <>
//             <h3 className="text-lg font-medium mb-4">Personal Information</h3>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">First Name</label>
//               <input
//                 type="text"
//                 value={firstName}
//                 onChange={(e) => setFirstName(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 required
//                 maxLength={50}
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Last Name</label>
//               <input
//                 type="text"
//                 value={lastName}
//                 onChange={(e) => setLastName(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 required
//                 maxLength={50}
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Company (Optional)</label>
//               <input
//                 type="text"
//                 value={company}
//                 onChange={(e) => setCompany(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 maxLength={100}
//               />
//             </div>
//             <div className="flex gap-3">
//               <button
//                 type="button"
//                 onClick={() => setStep(1)}
//                 className="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded"
//               >
//                 Back
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   if (validateStep2()) setStep(3);
//                 }}
//                 className="w-full bg-blue-500 text-white px-4 py-2 rounded"
//               >
//                 Continue
//               </button>
//             </div>
//           </>
//         )}

//         {/* Step 3: Address Information */}
//         {step === 3 && (
//   <>
//     <h3 className="text-lg font-medium mb-4">Address Information</h3>
//     <div className="mb-4">
//       <AddressAutocomplete 
//         index={0} // Since registration only has one address
//         address={{
//           street: street,
//           city: city,
//           state: state,
//           postalCode: postalCode,
//           country: 'Canada'
//         }}
//         onAddressChange={(index, field, value) => {
//           // Update the corresponding state based on the field
//           switch (field) {
//             case 'street':
//               setStreet(value);
//               setAddress(value); // Make sure to update both fields
//               break;
//             case 'city':
//               setCity(value);
//               break;
//             case 'state':
//               setState(value);
//               break;
//             case 'postalCode':
//               setPostalCode(value);
//               break;
//             case 'country':
//               setCountry(value);
//               break;
//             default:
//               break;
//           }
//         }}
//       />
//     </div>

//     <div className="grid grid-cols-2 gap-4 mb-4">
//       <div>
//         <label className="block text-gray-700 text-sm font-medium mb-2">City</label>
//         <input
//           type="text"
//           value={city}
//           onChange={(e) => setCity(e.target.value)}
//           className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           maxLength={50}
//         />
//       </div>
//       <div>
//         <label className="block text-gray-700 text-sm font-medium mb-2">Province</label>
//         <input
//           type="text"
//           value={state}
//           onChange={(e) => setState(e.target.value)}
//           className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           maxLength={50}
//         />
//       </div>
//     </div>

//     <div className="mb-4">
//       <label className="block text-gray-700 text-sm font-medium mb-2">Postal Code</label>
//       <input
//         type="text"
//         value={postalCode}
//         onChange={(e) => setPostalCode(e.target.value)}
//         className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//         maxLength={7}
//         placeholder="A1A 1A1"
//       />
//     </div>
    
//     <input type="hidden" value={country || 'Canada'} />


//               {/* <label className="block text-gray-700 mb-2">Street Address</label>
//               <input
//                 ref={addressInputRef}
//                 type="text"
//                 value={address}
//                 onChange={(e) => setAddress(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 placeholder="Start typing your address"
//                 required
//                 maxLength={100}
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 Start typing and select from the dropdown suggestions
//               </p>
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">City</label>
//               <input
//                 type="text"
//                 value={city}
//                 onChange={(e) => setCity(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 required
//                 maxLength={50}
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">State/Province</label>
//               <input
//                 type="text"
//                 value={state}
//                 onChange={(e) => setState(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 maxLength={50}
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Postal Code</label>
//               <input
//                 type="text"
//                 value={postalCode}
//                 onChange={(e) => setPostalCode(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 required
//                 maxLength={20}
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Country</label>
//               <input
//                 type="text"
//                 value={country}
//                 onChange={(e) => setCountry(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 required
//                 maxLength={50}
//               /
//             </div>>*/} 
//             <div className="flex gap-3">
//               <button
//                 type="button"
//                 onClick={() => setStep(2)}
//                 className="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded"
//               >
//                 Back
//               </button>
//               <button
//                 type="submit"
//                 className="w-full bg-blue-500 text-white px-4 py-2 rounded"
//               >
//                 Register
//               </button>
//             </div>
//           </>
//         )}
//       </form>

//       <div className="mt-6">
//         <p className="text-center text-sm">
//           Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login here</a>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;

































// // workin fine without steps
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';
// import { Eye, EyeOff } from 'lucide-react';
// import AddressAutocomplete from '../components/AddressAutocomplete';
// import { useLocation } from 'react-router-dom';


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
//   const location = useLocation();
//   const params = new URLSearchParams(location.search);
//   const prefilledIdentifier = params.get('identifier') || '';

//   const [identifier, setIdentifier] = useState(prefilledIdentifier);

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

//               {/* Replace just this part in your Right Column - Shipping Address section */}
//               <div>
//                 <AddressAutocomplete 
//                   index={0} // Since registration only has one address
//                   address={{
//                     street: street,
//                     city: city,
//                     state: state,
//                     postalCode: postalCode,
//                     country: 'Canada'
//                   }}
//                   onAddressChange={(index, field, value) => {
//                     // Update the corresponding state based on the field
//                     switch (field) {
//                       case 'street':
//                         setStreet(value);
//                         break;
//                       case 'city':
//                         setCity(value);
//                         break;
//                       case 'state':
//                         setState(value);
//                         break;
//                       case 'postalCode':
//                         setPostalCode(value);
//                         break;
//                       default:
//                         break;
//                     }
//                   }}
//                 />
//               </div>
                            
//               {/* <div>
//                 <label className="block text-gray-700 text-sm font-medium mb-2">Street Address</label>
//                 <input
//                   type="text"
//                   value={street}
//                   onChange={(e) => setStreet(e.target.value)}
//                   className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   maxLength={100}
//                 />
//               </div> */}

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