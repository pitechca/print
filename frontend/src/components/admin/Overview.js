// src/components/admin/Overview.js
import React, { useState, useEffect } from 'react';

const Overview = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const response = await fetch('/api/orders', { headers });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const orders = await response.json();

        const productsResponse = await fetch('/api/products', { headers });
        if (!productsResponse.ok) throw new Error(`HTTP error! status: ${productsResponse.status}`);
        const products = await productsResponse.json();
        
        setStats({
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          totalProducts: products.length,
          recentOrders: orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">Total Orders</h3>
        <p className="text-3xl font-bold">{stats.totalOrders}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">Total Revenue</h3>
        <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">Total Products</h3>
        <p className="text-3xl font-bold">{stats.totalProducts}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">Recent Orders</h3>
        <ul className="mt-2">
          {stats.recentOrders.map(order => (
            <li key={order._id} className="text-sm text-gray-600">
              Order #{order._id.slice(-6)} - ${order.totalAmount.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Overview;