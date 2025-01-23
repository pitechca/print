// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        phone: user.phone
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setSuccess('');
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      email: user.email,
      phone: user.phone
    });
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      login(data.user, data.token);
      setIsEditing(false);
      setSuccess('Profile updated successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!isEditing}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!isEditing}
              required
            />
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default Profile;



// //working but editing profile not working properly
// // src/pages/Profile.js
// import React, { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';

// const Profile = () => {
//   const { user, login } = useAuth();
//   const [isEditing, setIsEditing] = useState(false);
//   const [formData, setFormData] = useState({
//     email: user?.email || '',
//     phone: user?.phone || '',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');

//     try {
//       const { data } = await axios.put('/api/users/profile', formData, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//       });
      
//       login(data.user, data.token);
//       setSuccess('Profile updated successfully');
//       setIsEditing(false);
//     } catch (error) {
//       setError(error.response?.data?.error || 'Error updating profile');
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
      
//       {error && (
//         <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
//           {error}
//         </div>
//       )}
      
//       {success && (
//         <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-600">
//           {success}
//         </div>
//       )}

//       <form onSubmit={handleSubmit}>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Email</label>
//             <input
//               type="email"
//               value={formData.email}
//               onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
//               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//               disabled={!isEditing}
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Phone</label>
//             <input
//               type="tel"
//               value={formData.phone}
//               onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
//               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//               disabled={!isEditing}
//             />
//           </div>

//           {isEditing && (
//             <>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Current Password</label>
//                 <input
//                   type="password"
//                   value={formData.currentPassword}
//                   onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">New Password</label>
//                 <input
//                   type="password"
//                   value={formData.newPassword}
//                   onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
//                 <input
//                   type="password"
//                   value={formData.confirmPassword}
//                   onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//                 />
//               </div>
//             </>
//           )}
//         </div>

//         <div className="mt-6 flex space-x-4">
//           {!isEditing ? (
//             <button
//               type="button"
//               onClick={() => setIsEditing(true)}
//               className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//             >
//               Edit Profile
//             </button>
//           ) : (
//             <>
//               <button
//                 type="submit"
//                 className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
//               >
//                 Save Changes
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setIsEditing(false)}
//                 className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
//               >
//                 Cancel
//               </button>
//             </>
//           )}
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Profile;