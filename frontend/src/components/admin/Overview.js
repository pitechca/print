// src/components/admin/Overview.js
import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';

const Overview = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    recentOrders: [],
    monthlyData: []
  });
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('adminNotes');
    return saved ? JSON.parse(saved) : [];
  });
  const [newNote, setNewNote] = useState('');
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('adminTodos');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
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

        // Create sample data for last 6 months
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          const monthOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getFullYear() === date.getFullYear() && 
                   orderDate.getMonth() === date.getMonth();
          });

          monthlyData.push({
            month: monthYear,
            revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
            orders: monthOrders.length
          });
        }

        setStats({
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          totalProducts: products.length,
          recentOrders: orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5),
          monthlyData
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  // Simple bar chart using divs
  const SimpleBarChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    const maxOrders = Math.max(...data.map(d => d.orders));
    return (
      <div className="flex items-end h-48 gap-2 pt-4">
        {data.map((d, i) => {
          const height = maxOrders ? (d.orders / maxOrders) * 100 : 0;
          return (
            <div key={i} className="flex flex-col items-center flex-1 group relative">
              <div className="absolute top-0 -translate-y-full opacity-0 group-hover:opacity-100 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                {d.orders} orders
              </div>
              <div 
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${height}%` }}
              />
              <span className="text-xs mt-1 -rotate-45 origin-top-left truncate max-w-16">
                {d.month.split('-')[1]}/{d.month.split('-')[0].slice(2)}
              </span>
            </div>
          );
        })}
      </div>
    )
  };

  // Simple line chart using SVG
  const SimpleLineChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const padding = 10;
    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * (100 - 2 * padding) + padding,
      y: maxRevenue ? (100 - padding) - ((d.revenue / maxRevenue) * (100 - 2 * padding)) : 0,
      revenue: d.revenue,
      month: d.month
    }));

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1={padding}
              y1={y}
              x2="95"
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}
          {/* Data line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill="#3b82f6"
              className="hover:r-2"
            >
              <title>${p.revenue.toFixed(2)} - {p.month}</title>
            </circle>
          ))}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
          <SimpleLineChart data={stats.monthlyData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Orders</h3>
          <SimpleBarChart data={stats.monthlyData} />
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








// sticky , to do (markd not removed), empty graph
// src/components/admin/Overview.js
// import React, { useState, useEffect } from 'react';
// import { Trash2, Plus } from 'lucide-react';

// const Overview = () => {
//   const [stats, setStats] = useState({
//     totalOrders: 0,
//     totalRevenue: 0,
//     totalProducts: 0,
//     recentOrders: [],
//     monthlyData: []
//   });
//   const [notes, setNotes] = useState(() => {
//     const saved = localStorage.getItem('adminNotes');
//     return saved ? JSON.parse(saved) : [];
//   });
//   const [newNote, setNewNote] = useState('');
//   const [todos, setTodos] = useState(() => {
//     const saved = localStorage.getItem('adminTodos');
//     return saved ? JSON.parse(saved) : [];
//   });
//   const [newTodo, setNewTodo] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const headers = { Authorization: `Bearer ${token}` };
        
//         const [ordersRes, productsRes] = await Promise.all([
//           fetch('/api/orders', { headers }),
//           fetch('/api/products', { headers })
//         ]);

//         if (!ordersRes.ok || !productsRes.ok) throw new Error('Failed to fetch data');
        
//         const [orders, products] = await Promise.all([
//           ordersRes.json(),
//           productsRes.json()
//         ]);

//         // Process orders by month for the chart
//         const monthlyStats = orders.reduce((acc, order) => {
//           const date = new Date(order.createdAt);
//           const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
//           if (!acc[monthYear]) {
//             acc[monthYear] = { revenue: 0, orders: 0 };
//           }
//           acc[monthYear].revenue += order.totalAmount;
//           acc[monthYear].orders += 1;
//           return acc;
//         }, {});

//         const monthlyData = Object.entries(monthlyStats)
//           .map(([month, data]) => ({
//             month,
//             revenue: data.revenue,
//             orders: data.orders
//           }))
//           .sort((a, b) => a.month.localeCompare(b.month));

//         setStats({
//           totalOrders: orders.length,
//           totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
//           totalProducts: products.length,
//           recentOrders: orders
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//             .slice(0, 5),
//           monthlyData
//         });
//       } catch (error) {
//         console.error('Error fetching stats:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStats();
//   }, []);

//   const handleAddNote = () => {
//     if (!newNote.trim()) return;
//     const updatedNotes = [...notes, { id: Date.now(), text: newNote }];
//     setNotes(updatedNotes);
//     localStorage.setItem('adminNotes', JSON.stringify(updatedNotes));
//     setNewNote('');
//   };

//   const handleAddTodo = () => {
//     if (!newTodo.trim()) return;
//     const updatedTodos = [...todos, { id: Date.now(), text: newTodo, completed: false }];
//     setTodos(updatedTodos);
//     localStorage.setItem('adminTodos', JSON.stringify(updatedTodos));
//     setNewTodo('');
//   };

//   const toggleTodo = (id) => {
//     const updatedTodos = todos.map(todo =>
//       todo.id === id ? { ...todo, completed: !todo.completed } : todo
//     );
//     setTodos(updatedTodos);
//     localStorage.setItem('adminTodos', JSON.stringify(updatedTodos));
//   };

//   const deleteNote = (id) => {
//     const updatedNotes = notes.filter(note => note.id !== id);
//     setNotes(updatedNotes);
//     localStorage.setItem('adminNotes', JSON.stringify(updatedNotes));
//   };

//   // Simple bar chart using divs
//   const SimpleBarChart = ({ data }) => {
//     if (!data || data.length === 0) return null;
//     const maxOrders = Math.max(...data.map(d => d.orders));
//     return (
//       <div className="flex items-end h-48 gap-2 pt-4">
//         {data.map((d, i) => {
//           const height = maxOrders ? (d.orders / maxOrders) * 100 : 0;
//           return (
//             <div key={i} className="flex flex-col items-center flex-1 group relative">
//               <div className="absolute top-0 -translate-y-full opacity-0 group-hover:opacity-100 bg-gray-800 text-white px-2 py-1 rounded text-xs">
//                 {d.orders} orders
//               </div>
//               <div 
//                 className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
//                 style={{ height: `${height}%` }}
//               />
//               <span className="text-xs mt-1 -rotate-45 origin-top-left truncate max-w-16">
//                 {d.month.split('-')[1]}/{d.month.split('-')[0].slice(2)}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     )
//   };

//   // Simple line chart using SVG
//   const SimpleLineChart = ({ data }) => {
//     const maxRevenue = Math.max(...data.map(d => d.revenue));
//     const points = data.map((d, i) => ({
//       x: (i / (data.length - 1)) * 100,
//       y: 100 - ((d.revenue / maxRevenue) * 100)
//     }));

//     const pathData = points
//       .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
//       .join(' ');

//     return (
//       <svg className="w-full h-48" viewBox="0 0 100 100" preserveAspectRatio="none">
//         <path
//           d={pathData}
//           fill="none"
//           stroke="#3b82f6"
//           strokeWidth="2"
//         />
//       </svg>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-gray-500 text-sm">Total Orders</h3>
//           <p className="text-3xl font-bold">{stats.totalOrders}</p>
//         </div>
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-gray-500 text-sm">Total Revenue</h3>
//           <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
//         </div>
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-gray-500 text-sm">Total Products</h3>
//           <p className="text-3xl font-bold">{stats.totalProducts}</p>
//         </div>
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-gray-500 text-sm">Recent Orders</h3>
//           <ul className="mt-2">
//             {stats.recentOrders.map(order => (
//               <li key={order._id} className="text-sm text-gray-600">
//                 Order #{order._id.slice(-6)} - ${order.totalAmount.toFixed(2)}
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
//           <SimpleLineChart data={stats.monthlyData} />
//         </div>
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Monthly Orders</h3>
//           <SimpleBarChart data={stats.monthlyData} />
//         </div>
//       </div>

//       {/* Notes and Todos */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Sticky Notes */}
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Quick Notes</h3>
//           <div className="flex mb-4">
//             <input
//               type="text"
//               value={newNote}
//               onChange={(e) => setNewNote(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
//               className="flex-1 p-2 border rounded-l"
//               placeholder="Add a note..."
//             />
//             <button
//               onClick={handleAddNote}
//               className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
//             >
//               <Plus className="h-5 w-5" />
//             </button>
//           </div>
//           <div className="space-y-2 max-h-64 overflow-y-auto">
//             {notes.map(note => (
//               <div key={note.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded">
//                 <p className="text-sm">{note.text}</p>
//                 <button
//                   onClick={() => deleteNote(note.id)}
//                   className="text-red-500 hover:text-red-700"
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Todo List */}
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Todo List</h3>
//           <div className="flex mb-4">
//             <input
//               type="text"
//               value={newTodo}
//               onChange={(e) => setNewTodo(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
//               className="flex-1 p-2 border rounded-l"
//               placeholder="Add a todo..."
//             />
//             <button
//               onClick={handleAddTodo}
//               className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
//             >
//               <Plus className="h-5 w-5" />
//             </button>
//           </div>
//           <div className="space-y-2 max-h-64 overflow-y-auto">
//             {todos.map(todo => (
//               <div
//                 key={todo.id}
//                 className="flex items-center justify-between p-3 bg-gray-50 rounded"
//               >
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     checked={todo.completed}
//                     onChange={() => toggleTodo(todo.id)}
//                     className="mr-3"
//                   />
//                   <span className={todo.completed ? 'line-through text-gray-500' : ''}>
//                     {todo.text}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Overview;

















// // with sticky note but graph not working
// // src/components/admin/Overview.js
// import React, { useState, useEffect } from 'react';
// import { Trash2, Plus } from 'lucide-react';

// const Overview = () => {
//   const [stats, setStats] = useState({
//     totalOrders: 0,
//     totalRevenue: 0,
//     totalProducts: 0,
//     recentOrders: [],
//     monthlyData: []
//   });
//   const [notes, setNotes] = useState(() => {
//     const saved = localStorage.getItem('adminNotes');
//     return saved ? JSON.parse(saved) : [];
//   });
//   const [newNote, setNewNote] = useState('');
//   const [todos, setTodos] = useState(() => {
//     const saved = localStorage.getItem('adminTodos');
//     return saved ? JSON.parse(saved) : [];
//   });
//   const [newTodo, setNewTodo] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const headers = { Authorization: `Bearer ${token}` };
        
//         const [ordersRes, productsRes] = await Promise.all([
//           fetch('/api/orders', { headers }),
//           fetch('/api/products', { headers })
//         ]);

//         if (!ordersRes.ok || !productsRes.ok) throw new Error('Failed to fetch data');
        
//         const [orders, products] = await Promise.all([
//           ordersRes.json(),
//           productsRes.json()
//         ]);

//         // Process orders by month for the chart
//         const monthlyStats = orders.reduce((acc, order) => {
//           const date = new Date(order.createdAt);
//           const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
//           if (!acc[monthYear]) {
//             acc[monthYear] = { revenue: 0, orders: 0 };
//           }
//           acc[monthYear].revenue += order.totalAmount;
//           acc[monthYear].orders += 1;
//           return acc;
//         }, {});

//         const monthlyData = Object.entries(monthlyStats)
//           .map(([month, data]) => ({
//             month,
//             revenue: data.revenue,
//             orders: data.orders
//           }))
//           .sort((a, b) => a.month.localeCompare(b.month));

//         setStats({
//           totalOrders: orders.length,
//           totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
//           totalProducts: products.length,
//           recentOrders: orders
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//             .slice(0, 5),
//           monthlyData
//         });
//       } catch (error) {
//         console.error('Error fetching stats:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStats();
//   }, []);

//   const handleAddNote = () => {
//     if (!newNote.trim()) return;
//     const updatedNotes = [...notes, { id: Date.now(), text: newNote }];
//     setNotes(updatedNotes);
//     localStorage.setItem('adminNotes', JSON.stringify(updatedNotes));
//     setNewNote('');
//   };

//   const handleAddTodo = () => {
//     if (!newTodo.trim()) return;
//     const updatedTodos = [...todos, { id: Date.now(), text: newTodo, completed: false }];
//     setTodos(updatedTodos);
//     localStorage.setItem('adminTodos', JSON.stringify(updatedTodos));
//     setNewTodo('');
//   };

//   const toggleTodo = (id) => {
//     const updatedTodos = todos.map(todo =>
//       todo.id === id ? { ...todo, completed: !todo.completed } : todo
//     );
//     setTodos(updatedTodos);
//     localStorage.setItem('adminTodos', JSON.stringify(updatedTodos));
//   };

//   const deleteNote = (id) => {
//     const updatedNotes = notes.filter(note => note.id !== id);
//     setNotes(updatedNotes);
//     localStorage.setItem('adminNotes', JSON.stringify(updatedNotes));
//   };

//   // Simple bar chart using divs
//   const SimpleBarChart = ({ data }) => {
//     const maxOrders = Math.max(...data.map(d => d.orders));
//     return (
//       <div className="flex items-end h-48 gap-2">
//         {data.map((d, i) => (
//           <div key={i} className="flex flex-col items-center flex-1">
//             <div 
//               className="w-full bg-blue-500 rounded-t"
//               style={{ height: `${(d.orders / maxOrders) * 100}%` }}
//             />
//             <span className="text-xs mt-1 -rotate-45 origin-top-left">{d.month}</span>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   // Simple line chart using SVG
//   const SimpleLineChart = ({ data }) => {
//     const maxRevenue = Math.max(...data.map(d => d.revenue));
//     const points = data.map((d, i) => ({
//       x: (i / (data.length - 1)) * 100,
//       y: 100 - ((d.revenue / maxRevenue) * 100)
//     }));

//     const pathData = points
//       .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
//       .join(' ');

//     return (
//       <svg className="w-full h-48" viewBox="0 0 100 100" preserveAspectRatio="none">
//         <path
//           d={pathData}
//           fill="none"
//           stroke="#3b82f6"
//           strokeWidth="2"
//         />
//       </svg>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-gray-500 text-sm">Total Orders</h3>
//           <p className="text-3xl font-bold">{stats.totalOrders}</p>
//         </div>
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-gray-500 text-sm">Total Revenue</h3>
//           <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
//         </div>
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-gray-500 text-sm">Total Products</h3>
//           <p className="text-3xl font-bold">{stats.totalProducts}</p>
//         </div>
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-gray-500 text-sm">Recent Orders</h3>
//           <ul className="mt-2">
//             {stats.recentOrders.map(order => (
//               <li key={order._id} className="text-sm text-gray-600">
//                 Order #{order._id.slice(-6)} - ${order.totalAmount.toFixed(2)}
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
//           <SimpleLineChart data={stats.monthlyData} />
//         </div>
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Monthly Orders</h3>
//           <SimpleBarChart data={stats.monthlyData} />
//         </div>
//       </div>

//       {/* Notes and Todos */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Sticky Notes */}
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Quick Notes</h3>
//           <div className="flex mb-4">
//             <input
//               type="text"
//               value={newNote}
//               onChange={(e) => setNewNote(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
//               className="flex-1 p-2 border rounded-l"
//               placeholder="Add a note..."
//             />
//             <button
//               onClick={handleAddNote}
//               className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
//             >
//               <Plus className="h-5 w-5" />
//             </button>
//           </div>
//           <div className="space-y-2 max-h-64 overflow-y-auto">
//             {notes.map(note => (
//               <div key={note.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded">
//                 <p className="text-sm">{note.text}</p>
//                 <button
//                   onClick={() => deleteNote(note.id)}
//                   className="text-red-500 hover:text-red-700"
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Todo List */}
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Todo List</h3>
//           <div className="flex mb-4">
//             <input
//               type="text"
//               value={newTodo}
//               onChange={(e) => setNewTodo(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
//               className="flex-1 p-2 border rounded-l"
//               placeholder="Add a todo..."
//             />
//             <button
//               onClick={handleAddTodo}
//               className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
//             >
//               <Plus className="h-5 w-5" />
//             </button>
//           </div>
//           <div className="space-y-2 max-h-64 overflow-y-auto">
//             {todos.map(todo => (
//               <div
//                 key={todo.id}
//                 className="flex items-center justify-between p-3 bg-gray-50 rounded"
//               >
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     checked={todo.completed}
//                     onChange={() => toggleTodo(todo.id)}
//                     className="mr-3"
//                   />
//                   <span className={todo.completed ? 'line-through text-gray-500' : ''}>
//                     {todo.text}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Overview;







// //working without notes, to do, graphs
// // src/components/admin/Overview.js
// import React, { useState, useEffect } from 'react';

// const Overview = () => {
//   const [stats, setStats] = useState({
//     totalOrders: 0,
//     totalRevenue: 0,
//     totalProducts: 0,
//     recentOrders: []
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const headers = { Authorization: `Bearer ${token}` };
        
//         const response = await fetch('/api/orders', { headers });
//         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//         const orders = await response.json();

//         const productsResponse = await fetch('/api/products', { headers });
//         if (!productsResponse.ok) throw new Error(`HTTP error! status: ${productsResponse.status}`);
//         const products = await productsResponse.json();
        
//         setStats({
//           totalOrders: orders.length,
//           totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
//           totalProducts: products.length,
//           recentOrders: orders
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//             .slice(0, 5)
//         });
//       } catch (error) {
//         console.error('Error fetching stats:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStats();
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-gray-500 text-sm">Total Orders</h3>
//         <p className="text-3xl font-bold">{stats.totalOrders}</p>
//       </div>
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-gray-500 text-sm">Total Revenue</h3>
//         <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
//       </div>
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-gray-500 text-sm">Total Products</h3>
//         <p className="text-3xl font-bold">{stats.totalProducts}</p>
//       </div>
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-gray-500 text-sm">Recent Orders</h3>
//         <ul className="mt-2">
//           {stats.recentOrders.map(order => (
//             <li key={order._id} className="text-sm text-gray-600">
//               Order #{order._id.slice(-6)} - ${order.totalAmount.toFixed(2)}
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default Overview;