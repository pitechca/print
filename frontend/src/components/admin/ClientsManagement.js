// src/components/admin/ClientsManagement.js
import React, { useState, useEffect } from "react";
import {ImageIcon} from "lucide-react";
import { useNavigate } from 'react-router-dom'; 
import {Menu, X, Search, User, FileText, ShoppingCart, Clipboard, Image} from "lucide-react";

const ClientsManagement = () => {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [newNote, setNewNote] = useState("");
  const navigate = useNavigate(); 
  const [showClientList, setShowClientList] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  const handleDownloadImage = async (imageUrl, fileName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download the image. Please try again.');
    }
  };

  // Fetch clients list on mount
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/clients", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log("DEBUG: Clients fetched:", data);
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // When a client is selected, fetch detailed info and files in parallel
  useEffect(() => {
    if (!selectedClient) {
      setClientDetails(null);
      return;
    }
    const fetchClientDetails = async () => {
      setDetailsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [detailsRes, filesRes] = await Promise.all([
          fetch(`/api/admin/clients/${selectedClient._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/admin/clients/${selectedClient._id}/files`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const detailsData = await detailsRes.json();
        const filesData = await filesRes.json();
        console.log("DEBUG: Client details fetched:", detailsData);
        console.log("DEBUG: Files fetched:", filesData);
        setClientDetails({
          client: detailsData.client,
          orders: detailsData.orders || [],
          contacts: detailsData.contacts || [],
          invoices: detailsData.invoices || [],
          notes: detailsData.notes || [],
          files: filesData || [],
        });
      } catch (error) {
        console.error("Error fetching client details", error);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchClientDetails();
  }, [selectedClient]);

  
// First define filteredClients
const filteredClients = clients.filter((client) =>
  `${client.firstName} ${client.lastName} ${client.email}`
    .toLowerCase()
    .includes(searchQuery.toLowerCase())
);

// Then define sortedClients
const sortedClients = [...filteredClients].sort((a, b) => {
  // If you have a createdAt field, use this:
  // return new Date(b.createdAt) - new Date(a.createdAt);
  
  // If you don't have a date field, sort by ID (assuming newer clients have larger IDs)
  // This is just a fallback method - adjust according to your data structure
  return b._id > a._id ? 1 : -1;
});

// Now use sortedClients for pagination
const indexOfLastUser = currentPage * usersPerPage;
const indexOfFirstUser = indexOfLastUser - usersPerPage;
const currentUsers = sortedClients.slice(indexOfFirstUser, indexOfLastUser);
const totalPages = Math.ceil(sortedClients.length / usersPerPage);

// Define the Pagination component after having all the required variables
const Pagination = () => {
  return (
    <div className="flex justify-center items-center mt-4 space-x-2">
      <button
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          currentPage === 1 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        Prev
      </button>
      
      <span className="px-3 py-1">
        Page {currentPage} of {totalPages || 1}
      </span>
      
      <button
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages || totalPages === 0}
        className={`px-3 py-1 rounded ${
          currentPage === totalPages || totalPages === 0
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        Next
      </button>
    </div>
  );
};

  const handleToggleAdmin = async (client) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = !client.isAdmin;
      const res = await fetch(`/api/admin/clients/${client._id}/admin`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isAdmin: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification("Client admin status updated successfully.");
        setClients((prev) =>
          prev.map((c) =>
            c._id === client._id ? { ...c, isAdmin: newStatus } : c
          )
        );
        if (selectedClient && selectedClient._id === client._id) {
          setSelectedClient({ ...selectedClient, isAdmin: newStatus });
          setClientDetails((prev) => prev && { ...prev, client: { ...prev.client, isAdmin: newStatus } });
        }
      } else {
        setNotification(data.error || "Failed to update admin status.");
      }
    } catch (error) {
      console.error(error);
      setNotification("Error updating admin status.");
    }
  };

  const handleResetPassword = async (client) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/clients/${client._id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNotification("Reset password request sent successfully.");
      } else {
        setNotification(data.error || "Failed to send reset password request.");
      }
    } catch (error) {
      console.error(error);
      setNotification("Error sending reset password request.");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setNotification("Note content cannot be empty.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/clients/${selectedClient._id}/notes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ note: newNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification("Note added successfully.");
        setClientDetails((prev) => ({
          ...prev,
          notes: [data.note, ...prev.notes],
        }));
        setNewNote("");
      } else {
        setNotification(data.error || "Failed to add note.");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      setNotification("Error adding note.");
    }
  };

  const renderTabContent = () => {
    if (detailsLoading) return <div>Loading client details...</div>;
    if (!clientDetails) return <div>Please select a client.</div>;
    const { client, orders, contacts, invoices, notes, files } = clientDetails;
    switch (activeTab) {   
      case "info":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Client Information</h2>
            <p><strong>Name:</strong> {client.firstName} {client.lastName}</p>
            <p><strong>Email:</strong> {client.email}</p>
            <p><strong>Phone:</strong> {client.phone}</p>
            <p><strong>Company:</strong> {client.company}</p>
            {client.addresses && client.addresses.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mt-4">Addresses</h3>
                {client.addresses.map((addr, index) => (
                  <div key={index} className="border p-2 my-2 rounded">
                    <p>{addr.street}, {addr.city}, {addr.state}, {addr.postalCode}, {addr.country}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-gray-500">No address data available.</p>
            )}
            <div className="mt-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
              <button
                onClick={() => handleToggleAdmin(client)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                {client.isAdmin ? "Revoke Admin" : "Make Admin"}
              </button>
              <button
                onClick={() => handleResetPassword(client)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send Reset Password Request
              </button>
            </div>
          </div>
        );
      case "contacts":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Contacts</h2>
            {contacts.length > 0 ? (
              contacts.map((contact, idx) => (
                <div key={idx} className="border p-2 my-2 rounded">
                  <p>{contact.name} - {contact.email}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No contacts data available.</p>
            )}
          </div>
        );
      case "invoices":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Invoices</h2>
            {invoices.length > 0 ? (
              invoices.map((invoice, idx) => (
                <div key={idx} className="border p-2 my-2 rounded">
                  <p><strong>Invoice ID:</strong> {invoice._id}</p>
                  <p><strong>Amount:</strong> ${invoice.amount}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No invoices data available.</p>
            )}
          </div>
        );
      case "orders":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Orders</h2>
            {orders.length > 0 ? (
              orders.map((order, idx) => (
                <div key={idx} className="border p-2 my-2 rounded">
                  <p><strong>Order ID:</strong> {order._id}</p>
                  <p><strong>Total Amount:</strong> ${order.totalAmount}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No orders data available.</p>
            )}
          </div>
        );
      case "notes":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full border p-2 rounded"
              />
              <button
                onClick={handleAddNote}
                className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Add Note
              </button>
            </div>
            {notes.length > 0 ? (
              notes.map((note, idx) => (
                <div key={idx} className="border p-2 my-2 rounded">
                  <p>{note.note}</p>
                  <p className="text-sm text-gray-500">{new Date(note.createdAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No notes data available.</p>
            )}
          </div>
        );
      case "files":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Files</h2>
            {clientDetails.files.length > 0 ? (
              clientDetails.files.map((file, idx) => (
                <div key={idx} className="border p-2 my-2 rounded flex items-center space-x-4">
                  <img 
                    src={file.url} 
                    alt={`Order ${file.orderId} - Field ${file.fieldId}`} 
                    className="w-20 sm:w-32 h-auto object-contain border rounded bg-white"
                  />
                  <div>
                    <p className="text-sm">
                      Order: {file.orderId} <br /> Field: {file.fieldId}
                    </p>
                    <button
                      onClick={() => handleDownloadImage(file.url, `order-${file.orderId}-field-${file.fieldId}.png`)}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No files data available.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center">
        {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /> */}
        <img src='../images/loading.gif'/>
      </div>
    );
  }

  // return (
  //   <div>
  //    <h2 className="text-2xl font-bold mb-6">Clients</h2>

  //     <div className="flex flex-col md:flex-row bg-white shadow rounded-2xl p-4">
  //       <div className="w-full md:w-1/3 md:border-r md:pr-4">
  //         <input
  //           type="text"
  //           placeholder="Search clients..."
  //           value={searchQuery}
  //           onChange={(e) => setSearchQuery(e.target.value)}
  //           className="w-full px-3 py-2 border rounded mb-4"
  //         />
  //         {loading ? (
  //           <div>Loading...</div>
  //         ) : (
  //           <ul className="space-y-2">
  //             {filteredClients.map(client => (
  //               <li key={client._id}>
  //                 <button
  //                   onClick={() => {
  //                     setSelectedClient(client);
  //                     setActiveTab("info");
  //                   }}
  //                   className={`w-full text-left px-3 py-2 rounded ${
  //                     selectedClient && selectedClient._id === client._id
  //                       ? 'bg-blue-500 text-white'
  //                       : 'hover:bg-gray-100'
  //                   }`}
  //                 >
  //                   {client.firstName} {client.lastName}
  //                 </button>
  //               </li>
  //             ))}
  //           </ul>
  //         )}
  //       </div>
  //       <div className="w-full md:w-2/3 md:pl-4 mt-4 md:mt-0">
  //         {selectedClient ? (
  //           <>
  //             <div className="border-b mb-4">
  //               <nav className="flex space-x-2 overflow-x-auto whitespace-nowrap">
  //                 {["info", "invoices", "orders", "notes", "files"].map(tab => (
  //                   <button
  //                     key={tab}
  //                     onClick={() => setActiveTab(tab)}
  //                     className={`px-3 py-2 font-medium ${
  //                       activeTab === tab
  //                         ? 'border-b-2 border-blue-500 text-blue-600'
  //                         : 'text-gray-600 hover:text-blue-600'
  //                     }`}
  //                   >
  //                     {tab.charAt(0).toUpperCase() + tab.slice(1)}
  //                   </button>
  //                 ))}
  //               </nav>
  //             </div>
  //             <div className="p-4">
  //               {renderTabContent()}
  //             </div>
  //           </>
  //         ) : (
  //           <div className="flex items-center justify-center h-full">
  //             Select a client to view details.
  //           </div>
  //         )}
  //       </div>
  //       {notification && (
  //         <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded">
  //           {notification}
  //         </div>
  //       )}
        
  //     </div>
  //     <button 
  //       onClick={() => navigate('/admin/uploads')}
  //       className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-3 mt-6"
  //     >
  //       <div className="p-3 bg-indigo-100 rounded-full">
  //         <ImageIcon className="h-6 w-6 text-indigo-600" />
  //       </div>
  //       <div className="text-left">
  //         <h4 className="font-medium">Clients' Uploaded Images</h4>
  //         <p className="text-sm text-gray-500">Manage user & visitor uploads</p>
  //       </div>
  //     </button>
  //   </div>
  // );
 // 1. Update the return statement to remove the duplicate back button

return (
  <div>
    <h2 className="text-2xl font-bold mb-6">Clients</h2>

    <div className="flex flex-col bg-white shadow rounded-2xl p-4 relative">
      {/* Mobile Toggle Button - Only show when in client list view */}
      {(!selectedClient || showClientList) && (
        <button 
          className="md:hidden absolute top-4 right-4 z-10 p-2 bg-blue-500 text-white rounded-full"
          onClick={() => setShowClientList(!showClientList)}
        >
          <Menu size={20} />
        </button>
      )}

      <div className={`flex flex-col md:flex-row`}>
        {/* Client List - Hidden on mobile when viewing details */}
        <div className={`w-full md:w-1/3 md:border-r md:pr-4 ${
          (selectedClient && !showClientList) ? 'hidden md:block' : 'block'
        }`}>
          <div className="flex items-center border rounded px-2 mb-4">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border-0 focus:outline-none"
            />
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div>
              <ul className="space-y-2">
                {currentUsers.map(client => (
                  <li key={client._id}>
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setActiveTab("info");
                        setShowClientList(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded ${
                        selectedClient && selectedClient._id === client._id
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {client.firstName} {client.lastName}
                    </button>
                  </li>
                ))}
              </ul>
              <Pagination />
            </div>
          )}
        </div>

        {/* Client Details - Full screen on mobile */}
        <div className={`w-full md:w-2/3 md:pl-4 mt-4 md:mt-0 ${
          (selectedClient && !showClientList) || !selectedClient || showClientList === true ? 'block' : 'hidden'
        }`}>
          {selectedClient ? (
            <>
              {/* Mobile Back Button - Only show when viewing details */}
              {!showClientList && (
                <div className="md:hidden flex items-center mb-4">
                  <button 
                    onClick={() => setShowClientList(true)}
                    className="flex items-center text-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to clients
                  </button>
                  <h3 className="ml-2 font-medium truncate">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </h3>
                </div>
              )}

              {/* Mobile Tab Navigation - Icons */}
              <div className="border-b mb-4 md:hidden">
                <nav className="flex justify-between px-2">
                  <button onClick={() => setActiveTab("info")} className={`p-3 ${activeTab === "info" ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-600'}`}>
                    <User size={20} />
                  </button>
                  <button onClick={() => setActiveTab("invoices")} className={`p-3 ${activeTab === "invoices" ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-600'}`}>
                    <FileText size={20} />
                  </button>
                  <button onClick={() => setActiveTab("orders")} className={`p-3 ${activeTab === "orders" ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-600'}`}>
                    <ShoppingCart size={20} />
                  </button>
                  <button onClick={() => setActiveTab("notes")} className={`p-3 ${activeTab === "notes" ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-600'}`}>
                    <Clipboard size={20} />
                  </button>
                  <button onClick={() => setActiveTab("files")} className={`p-3 ${activeTab === "files" ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-600'}`}>
                    <Image size={20} />
                  </button>
                </nav>
              </div>

              {/* Desktop Tab Navigation - Text */}
              <div className="border-b mb-4 hidden md:block">
                <nav className="flex space-x-2 overflow-x-auto whitespace-nowrap">
                  {["info", "invoices", "orders", "notes", "files"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-2 font-medium ${
                        activeTab === tab
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-2 md:p-4 max-h-[65vh] overflow-y-auto">
                {renderTabContent()}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              Select a client to view details.
            </div>
          )}
        </div>
        {notification && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded">
            {notification}
          </div>
        )}
      </div>
    </div>
    <button 
      onClick={() => navigate('/admin/uploads')}
      className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-3 mt-6"
    >
      <div className="p-3 bg-indigo-100 rounded-full">
        <ImageIcon className="h-6 w-6 text-indigo-600" />
      </div>
      <div className="text-left">
        <h4 className="font-medium">Clients' Uploaded Images</h4>
        <p className="text-sm text-gray-500">Manage user & visitor uploads</p>
      </div>
    </button>
  </div>
);

};

export default ClientsManagement;







// // work well before mibile view
// // src/components/admin/ClientsManagement.js
// import React, { useState, useEffect } from "react";
// import {ImageIcon} from "lucide-react";
// import { useNavigate } from 'react-router-dom'; 
// import {Menu, X, Search, User, FileText, ShoppingCart, Clipboard, Image} from "lucide-react";

// const ClientsManagement = () => {
//   const [clients, setClients] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedClient, setSelectedClient] = useState(null);
//   const [clientDetails, setClientDetails] = useState(null);
//   const [activeTab, setActiveTab] = useState("info");
//   const [loading, setLoading] = useState(false);
//   const [detailsLoading, setDetailsLoading] = useState(false);
//   const [notification, setNotification] = useState("");
//   const [newNote, setNewNote] = useState("");
//   const navigate = useNavigate(); 

//   const downloadFile = (url, fileName) => {
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = fileName;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const handleDownloadImage = async (imageUrl, fileName) => {
//     try {
//       const response = await fetch(imageUrl);
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', fileName);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error('Error downloading image:', error);
//       alert('Failed to download the image. Please try again.');
//     }
//   };

//   // Fetch clients list on mount
//   useEffect(() => {
//     const fetchClients = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem("token");
//         const res = await fetch("/api/admin/clients", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         console.log("DEBUG: Clients fetched:", data);
//         setClients(data);
//       } catch (error) {
//         console.error("Error fetching clients", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchClients();
//   }, []);

//   // When a client is selected, fetch detailed info and files in parallel
//   useEffect(() => {
//     if (!selectedClient) {
//       setClientDetails(null);
//       return;
//     }
//     const fetchClientDetails = async () => {
//       setDetailsLoading(true);
//       try {
//         const token = localStorage.getItem("token");
//         const [detailsRes, filesRes] = await Promise.all([
//           fetch(`/api/admin/clients/${selectedClient._id}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//           fetch(`/api/admin/clients/${selectedClient._id}/files`, {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//         ]);
//         const detailsData = await detailsRes.json();
//         const filesData = await filesRes.json();
//         console.log("DEBUG: Client details fetched:", detailsData);
//         console.log("DEBUG: Files fetched:", filesData);
//         setClientDetails({
//           client: detailsData.client,
//           orders: detailsData.orders || [],
//           contacts: detailsData.contacts || [],
//           invoices: detailsData.invoices || [],
//           notes: detailsData.notes || [],
//           files: filesData || [],
//         });
//       } catch (error) {
//         console.error("Error fetching client details", error);
//       } finally {
//         setDetailsLoading(false);
//       }
//     };
//     fetchClientDetails();
//   }, [selectedClient]);

//   const handleToggleAdmin = async (client) => {
//     try {
//       const token = localStorage.getItem("token");
//       const newStatus = !client.isAdmin;
//       const res = await fetch(`/api/admin/clients/${client._id}/admin`, {
//         method: "PUT",
//         headers: { 
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({ isAdmin: newStatus }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setNotification("Client admin status updated successfully.");
//         setClients((prev) =>
//           prev.map((c) =>
//             c._id === client._id ? { ...c, isAdmin: newStatus } : c
//           )
//         );
//         if (selectedClient && selectedClient._id === client._id) {
//           setSelectedClient({ ...selectedClient, isAdmin: newStatus });
//           setClientDetails((prev) => prev && { ...prev, client: { ...prev.client, isAdmin: newStatus } });
//         }
//       } else {
//         setNotification(data.error || "Failed to update admin status.");
//       }
//     } catch (error) {
//       console.error(error);
//       setNotification("Error updating admin status.");
//     }
//   };

//   const handleResetPassword = async (client) => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch(`/api/admin/clients/${client._id}/reset-password`, {
//         method: "POST",
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setNotification("Reset password request sent successfully.");
//       } else {
//         setNotification(data.error || "Failed to send reset password request.");
//       }
//     } catch (error) {
//       console.error(error);
//       setNotification("Error sending reset password request.");
//     }
//   };

//   const handleAddNote = async () => {
//     if (!newNote.trim()) {
//       setNotification("Note content cannot be empty.");
//       return;
//     }
//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch(`/api/admin/clients/${selectedClient._id}/notes`, {
//         method: "POST",
//         headers: { 
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}` 
//         },
//         body: JSON.stringify({ note: newNote }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setNotification("Note added successfully.");
//         setClientDetails((prev) => ({
//           ...prev,
//           notes: [data.note, ...prev.notes],
//         }));
//         setNewNote("");
//       } else {
//         setNotification(data.error || "Failed to add note.");
//       }
//     } catch (error) {
//       console.error("Error adding note:", error);
//       setNotification("Error adding note.");
//     }
//   };

//   const filteredClients = clients.filter((client) =>
//     `${client.firstName} ${client.lastName} ${client.email}`
//       .toLowerCase()
//       .includes(searchQuery.toLowerCase())
//   );

//   const renderTabContent = () => {
//     if (detailsLoading) return <div>Loading client details...</div>;
//     if (!clientDetails) return <div>Please select a client.</div>;
//     const { client, orders, contacts, invoices, notes, files } = clientDetails;
//     switch (activeTab) {
//       case "info":
//         return (
//           <div>
//             <h2 className="text-xl font-semibold mb-4">Client Information</h2>
//             <p><strong>Name:</strong> {client.firstName} {client.lastName}</p>
//             <p><strong>Email:</strong> {client.email}</p>
//             <p><strong>Phone:</strong> {client.phone}</p>
//             <p><strong>Company:</strong> {client.company}</p>
//             {client.addresses && client.addresses.length > 0 ? (
//               <div>
//                 <h3 className="text-lg font-semibold mt-4">Addresses</h3>
//                 {client.addresses.map((addr, index) => (
//                   <div key={index} className="border p-2 my-2 rounded">
//                     <p>{addr.street}, {addr.city}, {addr.state}, {addr.postalCode}, {addr.country}</p>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="mt-2 text-gray-500">No address data available.</p>
//             )}
//             <div className="mt-4 space-x-4">
//               <button
//                 onClick={() => handleToggleAdmin(client)}
//                 className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
//               >
//                 {client.isAdmin ? "Revoke Admin" : "Make Admin"}
//               </button>
//               <button
//                 onClick={() => handleResetPassword(client)}
//                 className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//               >
//                 Send Reset Password Request
//               </button>
//             </div>
//           </div>
//         );
//       case "contacts":
//         return (
//           <div>
//             <h2 className="text-xl font-semibold mb-4">Contacts</h2>
//             {contacts.length > 0 ? (
//               contacts.map((contact, idx) => (
//                 <div key={idx} className="border p-2 my-2 rounded">
//                   <p>{contact.name} - {contact.email}</p>
//                 </div>
//               ))
//             ) : (
//               <p className="text-gray-500">No contacts data available.</p>
//             )}
//           </div>
//         );
//       case "invoices":
//         return (
//           <div>
//             <h2 className="text-xl font-semibold mb-4">Invoices</h2>
//             {invoices.length > 0 ? (
//               invoices.map((invoice, idx) => (
//                 <div key={idx} className="border p-2 my-2 rounded">
//                   <p><strong>Invoice ID:</strong> {invoice._id}</p>
//                   <p><strong>Amount:</strong> ${invoice.amount}</p>
//                 </div>
//               ))
//             ) : (
//               <p className="text-gray-500">No invoices data available.</p>
//             )}
//           </div>
//         );
//       case "orders":
//         return (
//           <div>
//             <h2 className="text-xl font-semibold mb-4">Orders</h2>
//             {orders.length > 0 ? (
//               orders.map((order, idx) => (
//                 <div key={idx} className="border p-2 my-2 rounded">
//                   <p><strong>Order ID:</strong> {order._id}</p>
//                   <p><strong>Total Amount:</strong> ${order.totalAmount}</p>
//                 </div>
//               ))
//             ) : (
//               <p className="text-gray-500">No orders data available.</p>
//             )}
//           </div>
//         );
//       case "notes":
//         return (
//           <div>
//             <h2 className="text-xl font-semibold mb-4">Notes</h2>
//             <div className="mb-4">
//               <textarea
//                 value={newNote}
//                 onChange={(e) => setNewNote(e.target.value)}
//                 placeholder="Add a note..."
//                 className="w-full border p-2 rounded"
//               />
//               <button
//                 onClick={handleAddNote}
//                 className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
//               >
//                 Add Note
//               </button>
//             </div>
//             {notes.length > 0 ? (
//               notes.map((note, idx) => (
//                 <div key={idx} className="border p-2 my-2 rounded">
//                   <p>{note.note}</p>
//                   <p className="text-sm text-gray-500">{new Date(note.createdAt).toLocaleString()}</p>
//                 </div>
//               ))
//             ) : (
//               <p className="text-gray-500">No notes data available.</p>
//             )}
//           </div>
//         );
//       case "files":
//         return (
//           <div>
//             <h2 className="text-xl font-semibold mb-4">Files</h2>
//             {clientDetails.files.length > 0 ? (
//               clientDetails.files.map((file, idx) => (
//                 <div key={idx} className="border p-2 my-2 rounded flex items-center space-x-4">
//                   <img 
//                     src={file.url} 
//                     alt={`Order ${file.orderId} - Field ${file.fieldId}`} 
//                     className="w-20 sm:w-32 h-auto object-contain border rounded bg-white"
//                   />
//                   <div>
//                     <p className="text-sm">
//                       Order: {file.orderId} <br /> Field: {file.fieldId}
//                     </p>
//                     <button
//                       onClick={() => handleDownloadImage(file.url, `order-${file.orderId}-field-${file.fieldId}.png`)}
//                       className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
//                     >
//                       Download
//                     </button>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p className="text-gray-500">No files data available.</p>
//             )}
//           </div>
//         );
//       default:
//         return null;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="fixed inset-0 flex flex-col items-center justify-center">
//         {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /> */}
//         <img src='../images/loading.gif'/>
//       </div>
//     );
//   }

//   return (
//     <div>
//      <h2 className="text-2xl font-bold mb-6">Clients</h2>

//       <div className="flex flex-col md:flex-row bg-white shadow rounded-2xl p-4">
//         <div className="w-full md:w-1/3 md:border-r md:pr-4">
//           <input
//             type="text"
//             placeholder="Search clients..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-3 py-2 border rounded mb-4"
//           />
//           {loading ? (
//             <div>Loading...</div>
//           ) : (
//             <ul className="space-y-2">
//               {filteredClients.map(client => (
//                 <li key={client._id}>
//                   <button
//                     onClick={() => {
//                       setSelectedClient(client);
//                       setActiveTab("info");
//                     }}
//                     className={`w-full text-left px-3 py-2 rounded ${
//                       selectedClient && selectedClient._id === client._id
//                         ? 'bg-blue-500 text-white'
//                         : 'hover:bg-gray-100'
//                     }`}
//                   >
//                     {client.firstName} {client.lastName}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//         <div className="w-full md:w-2/3 md:pl-4 mt-4 md:mt-0">
//           {selectedClient ? (
//             <>
//               <div className="border-b mb-4">
//                 <nav className="flex space-x-2 overflow-x-auto whitespace-nowrap">
//                   {["info", "invoices", "orders", "notes", "files"].map(tab => (
//                     <button
//                       key={tab}
//                       onClick={() => setActiveTab(tab)}
//                       className={`px-3 py-2 font-medium ${
//                         activeTab === tab
//                           ? 'border-b-2 border-blue-500 text-blue-600'
//                           : 'text-gray-600 hover:text-blue-600'
//                       }`}
//                     >
//                       {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                     </button>
//                   ))}
//                 </nav>
//               </div>
//               <div className="p-4">
//                 {renderTabContent()}
//               </div>
//             </>
//           ) : (
//             <div className="flex items-center justify-center h-full">
//               Select a client to view details.
//             </div>
//           )}
//         </div>
//         {notification && (
//           <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded">
//             {notification}
//           </div>
//         )}
        
//       </div>
//       <button 
//         onClick={() => navigate('/admin/uploads')}
//         className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-3 mt-6"
//       >
//         <div className="p-3 bg-indigo-100 rounded-full">
//           <ImageIcon className="h-6 w-6 text-indigo-600" />
//         </div>
//         <div className="text-left">
//           <h4 className="font-medium">Clients' Uploaded Images</h4>
//           <p className="text-sm text-gray-500">Manage user & visitor uploads</p>
//         </div>
//       </button>
//     </div>
//   );
// };

// export default ClientsManagement;
