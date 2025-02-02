// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
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

    // Phone validation (adjust regex according to your needs)
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

    // Password strength check
    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordStrengthRegex.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
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

    try {
      const cleanEmail = sanitizeInput(email);
      const cleanPhone = sanitizeInput(phone);
      const cleanAdminCode = adminCode ? sanitizeInput(adminCode) : '';

      const { data } = await axios.post('/api/register', {
        email: cleanEmail,
        password: password, // Don't trim password
        phone: cleanPhone,
        adminCode: cleanAdminCode
      }, {
        headers: {
          'Content-Type': 'application/json',
          // Add CSRF token if you have it
          // 'X-CSRF-Token': getCsrfToken(),
        }
      });

      login(data.user, data.token);
      navigate('/');
    } catch (error) {
      // Generic error message
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6" style={{marginTop: 50+'px', marginBottom: 30+'px'}}>
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            maxLength={100}
            autoComplete="email"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            maxLength={128}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            maxLength={20}
            autoComplete="tel"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Admin Code (Optional)</label>
          <input
            type="text"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            maxLength={50}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;


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

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const { data } = await axios.post('/api/register', {
//         email,
//         password,
//         phone,
//         adminCode
//       });
//       login(data.user, data.token);
//       navigate('/');
//     } catch (error) {
//       setError('Registration failed');
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6" style={{marginTop: 50+'px', marginBottom: 30+'px'}}>
//       <h2 className="text-2xl font-bold mb-4">Register</h2>
//       {error && <p className="text-red-500 mb-4">{error}</p>}
//       <form onSubmit={handleSubmit}>
//         <div className="mb-4">
//           <label className="block text-gray-700 mb-2">Email</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="w-full px-3 py-2 border rounded"
//             required
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
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700 mb-2">Admin Code (Optional)</label>
//           <input
//             type="text"
//             value={adminCode}
//             onChange={(e) => setAdminCode(e.target.value)}
//             className="w-full px-3 py-2 border rounded"
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
