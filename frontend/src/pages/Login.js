// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const sanitizeInput = (input) => {
    // Remove leading/trailing whitespace and normalize spaces
    return input.trim().replace(/\s+/g, ' ');
  };

  const validateInput = () => {
    const cleanIdentifier = sanitizeInput(identifier);
    
    // Basic email validation if identifier contains @
    if (cleanIdentifier.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanIdentifier)) {
        setError('Please enter a valid email address');
        return false;
      }
    } else {
      // Phone number validation (basic example - adjust according to your needs)
      const phoneRegex = /^\+?[\d\s-]{8,}$/;
      if (!phoneRegex.test(cleanIdentifier)) {
        setError('Please enter a valid phone number');
        return false;
      }
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateInput()) {
      return;
    }

    try {
      const cleanIdentifier = sanitizeInput(identifier);
      const { data } = await axios.post('/api/login', {
        identifier: cleanIdentifier,
        password: password // Never trim passwords as spaces might be intentional
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
      // Generic error message to prevent user enumeration
      setError('Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6" style={{marginTop: 100+'px', marginBottom: 70+'px'}}>
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email or Phone Number</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter email or phone number"
            required
            maxLength={100}
            autoComplete="username"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Password</label>
          {/* <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            maxLength={128}
            autoComplete="current-password"
          /> */}
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
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded"
        >
          Login
        </button>
      </form>

      <div style={{marginTop: 20+'px'}}>
        <p>Have not created an account yet? <a href='/register'>Click here</a></p>
      </div>
    </div>
  );
};


export default Login;