//working perfectrly
//src/components/admin/Overview.css
import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  Trash2, Plus, TrendingUp, DollarSign, Package, Users, ShoppingBag,
  Bell, Calendar, ArrowUp, ArrowDown, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";



const DashboardCard = ({ title, value, icon: Icon, trend, color }) => (
  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        {trend !== undefined && (
          <div className={`flex items-center mt-2 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
            <span className="text-sm">{Math.abs(trend)}% from last month</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const Overview = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    recentOrders: [],
    monthlyData: [],
    orderStatusDistribution: [
      { name: 'Completed', value: 0 },
      { name: 'Processing', value: 0 },
      { name: 'Pending', value: 0 }
    ]
  });
  const [showNotifications, setShowNotifications] = useState(false);

  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('adminTodos');
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('adminNotes');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTodo, setNewTodo] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/orders', { headers }),
          fetch('/api/products', { headers })
        ]);

        if (!ordersRes.ok || !productsRes.ok) throw new Error('Failed to fetch data');
        
        const [orders, products] = await Promise.all([
          ordersRes.json(),
          productsRes.json()
        ]);

        // Process monthly data
        const monthlyStats = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          const monthOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getFullYear() === date.getFullYear() && 
                   orderDate.getMonth() === date.getMonth();
          });

          monthlyStats[monthYear] = {
            month: monthYear,
            revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
            orders: monthOrders.length
          };
        }

        // Calculate order status distribution
        const statusCount = orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});

        const orderStatusDistribution = [
          { name: 'Completed', value: statusCount.completed || 0 },
          { name: 'Shipped', value: statusCount.shipped || 0 },
          { name: 'Processing', value: statusCount.processing || 0 },
          { name: 'Pending', value: statusCount.pending || 0 },
          { name: 'Cancelled', value: statusCount.cancelled || 0 }

        ];

        // Calculate trends
        const currentMonth = new Date().getMonth();
        const currentMonthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === currentMonth;
        });
        
        const lastMonth = currentMonth - 1;
        const lastMonthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === lastMonth;
        });

        const ordersTrend = lastMonthOrders.length ? 
          ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 : 0;

        const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const revenueTrend = lastMonthRevenue ? 
          ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

        setStats({
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          totalProducts: products.length,
          recentOrders: orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5),
          monthlyData: Object.values(monthlyStats),
          orderStatusDistribution,
          trends: {
            orders: ordersTrend,
            revenue: revenueTrend,
            products: products.length > 0 ? 5.2 : 0 // Example static trend
          }
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort notifications by date (newest first)
      const sortedNotifications = response.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };
  
  const downloadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      window.open(`/api/reports/sales/download?token=${token}`, '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update state to remove the deleted notification
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification. Please try again.');
    }
  };
   
  const COLORS = ['#A020F0', '#0088FE', '#00C49F', '#FFBB28', '#FF6347'];

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updatedNotes = [...notes, { id: Date.now(), text: newNote }];
    setNotes(updatedNotes);
    localStorage.setItem('adminNotes', JSON.stringify(updatedNotes));
    setNewNote('');
  };

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    const updatedTodos = [...todos, { id: Date.now(), text: newTodo, completed: false }];
    setTodos(updatedTodos);
    localStorage.setItem('adminTodos', JSON.stringify(updatedTodos));
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    localStorage.setItem('adminTodos', JSON.stringify(updatedTodos));
  };

  const deleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('adminNotes', JSON.stringify(updatedNotes));
  };
    

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <div className="flex items-center space-x-4">
        <button 
          className="relative"
          style={{ 
            boxShadow: 'none', 
            border: 'none', 
            background: 'transparent',
            transform: 'none',
            padding: 0,
            overflow: 'visible'
          }}
          onClick={() => {
            setShowNotifications(!showNotifications);
            if (!showNotifications) {
              fetchNotifications(); // Fetch notifications when opening the panel
            }
            if (window.innerWidth <= 768) {
              window.scrollBy({ top: 300, behavior: 'smooth' });
            }
          }}
        >
          <Bell className="h-6 w-6 text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {notifications.length}
          </span>
        </button>
          <span className="text-gray-600">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button 
          onClick={() => navigate('/admin/security')} 
          className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-3"
        >
          <div className="p-3 bg-blue-100 rounded-full">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-left">
            <h4 className="font-medium">Security</h4>
            <p className="text-sm text-gray-500">Manage system security</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/admin/users')}
          className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-3"
        >
          <div className="p-3 bg-green-100 rounded-full">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-left">
            <h4 className="font-medium">Manage Users</h4>
            <p className="text-sm text-gray-500">View and edit user accounts</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/admin/sales')}
          className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-3"
        >
          <div className="p-3 bg-purple-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-left">
            <h4 className="font-medium">Sales Report</h4>
            <p className="text-sm text-gray-500">View sales analytics</p>
          </div>
        </button>

        <button 
          onClick={() => {
            setShowNotifications(!showNotifications);
            if (!showNotifications) {
              fetchNotifications();
            }
          }}
          className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-3"
        >
          <div className="p-3 bg-orange-100 rounded-full">
            <Bell className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-left">
            <h4 className="font-medium">Notifications</h4>
            <p className="text-sm text-gray-500">View all notifications</p>
          </div>
        </button>
      </div>

      {/* Notifications */}
      {showNotifications && (
        <div className="bg-white p-6 rounded-lg shadow" id='notificationSection'>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Notifications</h3>
            <div className="flex items-center space-x-4">
              <button 
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={fetchNotifications}
              >
                Refresh
              </button>
              <button 
                className="text-sm text-gray-600 hover:text-gray-800"
                onClick={() => setShowNotifications(false)}
              >
                Close
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {notificationsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            ) : (
              // Only show the 5 most recent notifications
              notifications.slice(0, 5).map(notification => (
                <div key={notification._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      notification.type === 'order' ? 'bg-blue-100 text-blue-600' :
                      notification.type === 'inventory' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {notification.type === 'order' ? <ShoppingBag className="h-5 w-5" /> :
                      notification.type === 'inventory' ? <Package className="h-5 w-5" /> :
                      <Users className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => handleDeleteNotification(notification._id)}
                    style={{ 
                      boxShadow: 'none', 
                      border: 'none', 
                      background: 'transparent',
                      transform: 'none',
                      padding: 0,
                      overflow: 'visible'
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )} 

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          trend={stats.trends?.revenue}
          color="bg-green-500"
        />
        <DashboardCard 
          title="Total Orders" 
          value={stats.totalOrders}
          icon={ShoppingBag}
          trend={stats.trends?.orders}
          color="bg-blue-500"
        />
        <DashboardCard 
          title="Total Products" 
          value={stats.totalProducts}
          icon={Package}
          trend={stats.trends?.products}
          color="bg-purple-500"
        />
        <DashboardCard 
          title="Active Orders" 
          value={stats.orderStatusDistribution.find(s => s.name === 'Processing')?.value || 0}
          icon={Activity}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year.slice(2)}`;
                }}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                wrapperStyle={{
                  borderRadius: '10px',                 
                }}
                contentStyle={{
                  borderRadius: '10px',                 
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue"
                stroke="#0088FE" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Orders</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month"
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year.slice(2)}`;
                }}
              />
              <YAxis />
              <Tooltip 
                wrapperStyle={{
                  borderRadius: '10px',                 
                }}
                contentStyle={{
                  borderRadius: '10px',                 
                }}/>
              <Legend />
              <Bar 
                dataKey="orders" 
                fill="#00C49F" 
                name="Orders"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      #{order._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.user?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.orderStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({name, value}) => `${name}: ${value}`}
              >
                {stats.orderStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

     {/* Notes and Todos */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Sticky Notes */}
         <div className="bg-white p-6 rounded-lg shadow">
           <h3 className="text-lg font-semibold mb-4">Quick Notes</h3>
           <div className="flex mb-4">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              className="flex-1 p-2 border rounded-l"
              placeholder="Add a note..."
            />
            <button
              onClick={handleAddNote}
              className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notes.map(note => (
              <div key={note.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded">
                <p className="text-sm">{note.text}</p>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-red-500 hover:text-red-700"
                  style={{ 
                    boxShadow: 'none', 
                    border: 'none', 
                    background: 'transparent',
                    transform: 'none',
                    padding: 0,
                    overflow: 'visible'
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Todo List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Todo List</h3>
          <div className="flex mb-4">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              className="flex-1 p-2 border rounded-l"
              placeholder="Add a todo..."
            />
            <button
              onClick={handleAddTodo}
              className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todos.map(todo => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="mr-3"
                  />
                  <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                    {todo.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Overview;
