// src/context/CartContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // useEffect(() => {
  //   fetchCart();
  // }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCart([]);
    } else {
      fetchCart();
    }
  }, [localStorage.getItem('token')]);


  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const { data } = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(data.items);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart([]);
    }
  };

  const addToCart = async (item) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post('/api/cart/add', item, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateCartItem = async (index, updates) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
  
      await axios.put(`/api/cart/${index}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const removeFromCart = async (index) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete(`/api/cart/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, updateCartItem  }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);