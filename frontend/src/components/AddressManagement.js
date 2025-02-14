// // src/components/AddressManagement.js
// import React, { useState } from 'react';
// import { Plus, Home, Briefcase, MapPin, Check, X } from 'lucide-react';

// const AddressManagement = ({ addresses, onAddressChange }) => {
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newAddress, setNewAddress] = useState({
//     street: '',
//     city: '',
//     state: '',
//     postalCode: '',
//     country: 'Canada',
//     label: 'Home',
//     isDefault: false
//   });

//   const handleNewAddressSubmit = (e) => {
//     e.preventDefault();
//     onAddressChange([...addresses, newAddress]);
//     setNewAddress({
//       street: '',
//       city: '',
//       state: '',
//       postalCode: '',
//       country: 'Canada',
//       label: 'Home',
//       isDefault: false
//     });
//     setShowAddForm(false);

//   };

//   const handleDeleteAddress = (index) => {
//     const updatedAddresses = addresses.filter((_, i) => i !== index);
//     if (addresses[index].isDefault && updatedAddresses.length > 0) {
//       updatedAddresses[0].isDefault = true;
//     }
//     onAddressChange(updatedAddresses);
//   };

//   const handleSetDefault = (index) => {
//     const updatedAddresses = addresses.map((addr, i) => ({
//       ...addr,
//       isDefault: i === index
//     }));
//     onAddressChange(updatedAddresses);
//   };

//   const getAddressIcon = (label) => {
//     switch (label.toLowerCase()) {
//       case 'home':
//         return <Home className="h-5 w-5" />;
//       case 'work':
//         return <Briefcase className="h-5 w-5" />;
//       default:
//         return <MapPin className="h-5 w-5" />;
//     }
//   };

//   return (
//     <div className="space-y-4">
//       {/* Existing Addresses */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {addresses.map((address, index) => (
//           <div
//             key={index}
//             className={`p-4 rounded-lg border ${
//               address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
//             }`}
//           >
//             <div className="flex justify-between items-start mb-2">
//               <div className="flex items-center space-x-2">
//                 {getAddressIcon(address.label)}
//                 <span className="font-medium">{address.label}</span>
//                 {address.isDefault && (
//                   <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                     Default
//                   </span>
//                 )}
//               </div>
//               <div className="flex space-x-2">
//                 {!address.isDefault && (
//                   <button
//                     onClick={() => handleSetDefault(index)}
//                     className="text-blue-600 hover:text-blue-800"
//                   >
//                     Set Default
//                   </button>
//                 )}
//                 <button
//                   onClick={() => handleDeleteAddress(index)}
//                   className="text-red-600 hover:text-red-800"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>
//             </div>
//             <div className="text-sm text-gray-600 space-y-1">
//               <p>{address.street}</p>
//               <p>{`${address.city}, ${address.state} ${address.postalCode}`}</p>
//               <p>{address.country}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Add New Address Button/Form */}
//       {!showAddForm ? (
//         <button
//           onClick={() => setShowAddForm(true)}
//           className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
//         >
//           <Plus className="h-5 w-5" />
//           <span>Add New Address</span>
//         </button>
//       ) : (
//         <form onSubmit={handleNewAddressSubmit} className="bg-gray-50 p-4 rounded-lg">
//           <h3 className="text-lg font-medium mb-4">Add New Address</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium mb-1">Label</label>
//               <select
//                 value={newAddress.label}
//                 onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="Home">Home</option>
//                 <option value="Work">Work</option>
//                 <option value="Other">Other</option>
//               </select>
//             </div>
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium mb-1">Street Address</label>
//               <input
//                 type="text"
//                 value={newAddress.street}
//                 onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">City</label>
//               <input
//                 type="text"
//                 value={newAddress.city}
//                 onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Province/State</label>
//               <input
//                 type="text"
//                 value={newAddress.state}
//                 onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Postal Code</label>
//               <input
//                 type="text"
//                 value={newAddress.postalCode}
//                 onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Country</label>
//               <select
//                 value={newAddress.country}
//                 onChange={(e) => setNewAddress({...newAddress, country: e.target.value})}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="Canada">Canada</option>
//                 <option value="United States">United States</option>
//               </select>
//             </div>
//             <div className="md:col-span-2">
//               <label className="flex items-center space-x-2">
//                 <input
//                   type="checkbox"
//                   checked={newAddress.isDefault}
//                   onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
//                   className="rounded text-blue-600"
//                 />
//                 <span className="text-sm">Set as default address</span>
//               </label>
//             </div>
//           </div>
//           <div className="flex justify-end space-x-2 mt-4">
//             <button
//               type="button"
//               onClick={() => setShowAddForm(false)}
//               className="px-4 py-2 text-gray-600 hover:text-gray-800"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//             >
//               Save Address
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// };

// export default AddressManagement;