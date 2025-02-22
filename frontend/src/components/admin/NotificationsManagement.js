// src/components/admin/NotificationsManagement.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";


// Default HTML layout for the email content.
// This layout is automatically loaded into the textarea when "Email" is selected.
const defaultEmailLayout = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Email Layout</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f9f9f9;">
  <div style="max-width:600px; margin:auto; border-radius:6px; overflow:hidden; border:1px solid #ddd; background-color:#fff;">
    <div style="background-color:#0044cc; padding:20px; text-align:center;">
      <h1 style="color:#fff; margin:0;">Reset Your Password</h1>
    </div>
    <div style="padding:20px;">
      <h2>Forgot your password? It happens to the best of us.</h2>
      <p>To reset your password, click the button below. The link will self-destruct after five days.</p>
      <div style="text-align:center; margin:20px 0;">
        <a href="#" style="padding:12px 20px; background-color:#0044cc; color:#fff; text-decoration:none; border-radius:4px;">Reset your password</a>
      </div>
      <p>If you do not want to change your password or didn't request a reset, you can ignore and delete this email.</p>
    </div>
    <div style="background-color:#f1f1f1; text-align:center; padding:10px;">
      <p style="margin:0; color:#666;">© 2025 Your Company Name. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const NotificationsManagement = () => {
  // --- Sending Notification States ---
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" or "custom"
  const [channels, setChannels] = useState({
    email: false,
    sms: false,
    inApp: false,
  });
  const [messageContent, setMessageContent] = useState({
    email: "",
    sms: "",
    inApp: "",
  });
  const [status, setStatus] = useState("");

  // --- Admin-Created Notifications List with Pagination ---
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [listStatus, setListStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // If Email channel is selected and no content yet, load the default HTML layout
  useEffect(() => {
    if (channels.email && messageContent.email.trim() === "") {
      setMessageContent((prev) => ({ ...prev, email: defaultEmailLayout }));
    }
  }, [channels.email, messageContent.email]);

  // Fetch users for custom selection
  useEffect(() => {
    if (filter === "custom") {
      const token = localStorage.getItem("token");
      axios
        .get("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Fetched users:", res.data);
          setUsers(res.data.users || res.data);
        })
        .catch((err) => {
          console.error("Error fetching users:", err);
          setStatus("Error fetching user list.");
        });
    }
  }, [filter]);

  // Fetch admin-created notifications for management with pagination
  const fetchAdminNotifications = async (currentPage = page) => {
    setListStatus("Loading notifications...");
    const token = localStorage.getItem("token");
    try {
      console.log("Fetching admin notifications with page", currentPage);
      const res = await axios.get(
        `/api/admin/notifications/created?page=${currentPage}&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Fetched notifications:", res.data);
      setAdminNotifications(res.data.notifications);
      setTotalPages(res.data.totalPages);
      setPage(res.data.currentPage);
      setListStatus("");
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      setListStatus("Error fetching notifications: " + error.message);
    }
  };

  useEffect(() => {
    fetchAdminNotifications();
  }, []);

  const handleUserSelection = (userId, isSelected) => {
    if (isSelected) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSend = async () => {
    setStatus("Sending...");
    const token = localStorage.getItem("token");
    try {
      console.log("Sending notification with payload:", {
        selectedUsers: filter === "custom" ? selectedUsers : [],
        filter,
        channels,
        messageContent,
      });
      await axios.post(
        "/api/admin/notifications/send",
        {
          selectedUsers: filter === "custom" ? selectedUsers : [],
          filter,
          channels,
          messageContent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStatus("Notifications sent successfully!");
      // Refresh the admin notifications list after sending
      fetchAdminNotifications();
    } catch (error) {
      console.error("Error sending notifications:", error);
      setStatus(
        "Error sending notifications: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  // Toggle (enable/disable) a notification's active status
  const toggleNotification = async (notificationId, currentStatus) => {
    const token = localStorage.getItem("token");
    try {
      console.log(
        `Toggling notification ${notificationId} from active=${currentStatus} to active=${!currentStatus}`
      );
      await axios.put(
        `/api/admin/notifications/${notificationId}`,
        { active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state
      setAdminNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, active: !currentStatus } : notif
        )
      );
    } catch (error) {
      console.error("Error updating notification status:", error);
      setListStatus("Error updating notification status: " + error.message);
    }
  };

  // Remove a notification
  const removeNotification = async (notificationId) => {
    const token = localStorage.getItem("token");
    try {
      console.log(`Removing notification ${notificationId}`);
      await axios.delete(`/api/admin/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update local state: remove the deleted notification
      setAdminNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
      setListStatus("Error deleting notification: " + error.message);
    }
  };

  // Pagination controls
  const handlePrevPage = () => {
    if (page > 1) {
      fetchAdminNotifications(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      fetchAdminNotifications(page + 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg">
      {/* --- Section 1: Send Notification --- */}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Newsletter / Notification
      </h2>

      {/* User Selection */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          User Selection
        </h3>
        <div className="flex flex-col sm:flex-row sm:space-x-6">
          <label className="inline-flex items-center mb-2 sm:mb-0">
            <input
              type="radio"
              value="all"
              checked={filter === "all"}
              onChange={() => setFilter("all")}
              className="form-radio text-blue-600"
            />
            <span className="ml-2">All Users</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="custom"
              checked={filter === "custom"}
              onChange={() => setFilter("custom")}
              className="form-radio text-blue-600"
            />
            <span className="ml-2">Custom Selection</span>
          </label>
        </div>
      </div>

      {filter === "custom" && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            Select Users
          </h4>
          {users.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto border p-4 rounded">
              {users.map((user) => (
                <label key={user._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={user._id}
                    onChange={(e) =>
                      handleUserSelection(user._id, e.target.checked)
                    }
                    className="form-checkbox text-blue-600"
                  />
                  <span className="text-gray-600">{user.email}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No users available for selection.</p>
          )}
        </div>
      )}

      {/* Channel Selection */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Select Channels
        </h3>
        <div className="flex flex-col sm:flex-row sm:space-x-6">
          <label className="inline-flex items-center mb-2 sm:mb-0">
            <input
              type="checkbox"
              checked={channels.email}
              onChange={(e) =>
                setChannels({ ...channels, email: e.target.checked })
              }
              className="form-checkbox text-blue-600"
            />
            <span className="ml-2">Email</span>
          </label>
          <label className="inline-flex items-center mb-2 sm:mb-0">
          <input
            type="checkbox"
            checked={channels.sms}
            onChange={(e) =>
              setChannels({ ...channels, sms: e.target.checked })
            }
            className="form-checkbox text-blue-600"
          />
            <span className="ml-2">SMS</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={channels.inApp}
              onChange={(e) =>
                setChannels({ ...channels, inApp: e.target.checked })
              }
              className="form-checkbox text-blue-600"
            />
            <span className="ml-2">In-App Notification</span>
          </label>
        </div>
      </div>

      {/* Message Composer */}
      <div className="mb-6">
        {channels.email && (
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Email Content
            </h3>
            <SunEditor
              setOptions={{
                height: 300,
                buttonList: [
                  ['undo', 'redo'],
                  ['bold', 'underline', 'italic', 'strike'],
                  ['fontColor', 'hiliteColor'],
                  ['align', 'list', 'indent'],
                  ['table', 'link', 'image', 'video'],
                  ['fullScreen', 'showBlocks', 'codeView']
                ],
              }}
              defaultValue={messageContent.email}
              onChange={(content) =>
                setMessageContent({ ...messageContent, email: content })
              }
            />
          </div>
        )}

        {channels.sms && (
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              SMS Content
            </h3>
            <textarea
              rows="3"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Compose your SMS message here..."
              value={messageContent.sms}
              onChange={(e) =>
                setMessageContent({ ...messageContent, sms: e.target.value })
              }
            />
          </div>
        )}
        {channels.inApp && (
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              In-App Notification Content
            </h3>
            <textarea
              rows="3"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Compose your in-app notification here..."
              value={messageContent.inApp}
              onChange={(e) =>
                setMessageContent({ ...messageContent, inApp: e.target.value })
              }
            />
          </div>
        )}
      </div>

      {/* Send Button & Status */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-10">
        <button
          onClick={handleSend}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Send Notification
        </button>
        {status && (
          <span className="text-lg font-medium text-gray-700">{status}</span>
        )}
      </div>

      {/* --- Section 2: Manage Created Notifications --- */}
      <h2 className="text-3xl font-bold mb-4 text-gray-800">
        Manage Created Notifications
      </h2>
      {listStatus && <div className="mb-4 text-red-600">{listStatus}</div>}
      {adminNotifications.length === 0 ? (
        <p className="text-gray-500">No notifications created yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Message</th>
                <th className="py-2 px-4 border-b">Type</th>
                <th className="py-2 px-4 border-b">Created At</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminNotifications.map((notif) => (
                <tr key={notif._id} className="text-center">
                  <td className="py-2 px-4 border-b">{notif.message}</td>
                  <td className="py-2 px-4 border-b">{notif.type}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(notif.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {notif.active ? "Active" : "Disabled"}
                  </td>
                  <td className="py-2 px-4 border-b flex flex-col sm:flex-row sm:justify-center sm:space-x-2">
                    <button
                      onClick={() =>
                        toggleNotification(notif._id, notif.active)
                      }
                      className={`px-3 py-1 rounded ${
                        notif.active
                          ? "bg-red-500 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {notif.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => removeNotification(notif._id)}
                      className="mt-2 sm:mt-0 px-3 py-1 rounded bg-gray-500 text-white hover:bg-gray-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-700">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default NotificationsManagement;









// // simple version
// // src/components/admin/NotificationsManagement.js
// import React, { useState, useEffect } from "react";
// import axios from "axios";

// const NotificationsManagement = () => {
//   // --- Sending Notification States ---
//   const [users, setUsers] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [filter, setFilter] = useState("all"); // "all" or "custom"
//   const [channels, setChannels] = useState({
//     email: false,
//     sms: false,
//     inApp: false,
//   });
//   const [messageContent, setMessageContent] = useState({
//     email: "",
//     sms: "",
//     inApp: "",
//   });
//   const [status, setStatus] = useState("");

//   // --- Admin-Created Notifications List with Pagination ---
//   const [adminNotifications, setAdminNotifications] = useState([]);
//   const [listStatus, setListStatus] = useState("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(0);

//   // Fetch users for custom selection
//   useEffect(() => {
//     if (filter === "custom") {
//       const token = localStorage.getItem("token");
//       axios
//         .get("/api/admin/users", {
//           headers: { Authorization: `Bearer ${token}` },
//         })
//         .then((res) => {
//           console.log("Fetched users:", res.data);
//           setUsers(res.data.users || res.data);
//         })
//         .catch((err) => {
//           console.error("Error fetching users:", err);
//           setStatus("Error fetching user list.");
//         });
//     }
//   }, [filter]);

//   // Fetch admin-created notifications for management with pagination
//   const fetchAdminNotifications = async (currentPage = page) => {
//     setListStatus("Loading notifications...");
//     const token = localStorage.getItem("token");
//     try {
//       console.log("Fetching admin notifications with page", currentPage);
//       const res = await axios.get(
//         `/api/admin/notifications/created?page=${currentPage}&limit=20`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       console.log("Fetched notifications:", res.data);
//       setAdminNotifications(res.data.notifications);
//       setTotalPages(res.data.totalPages);
//       setPage(res.data.currentPage);
//       setListStatus("");
//     } catch (error) {
//       console.error("Error fetching admin notifications:", error);
//       setListStatus("Error fetching notifications: " + error.message);
//     }
//   };

//   useEffect(() => {
//     fetchAdminNotifications();
//   }, []);

//   const handleUserSelection = (userId, isSelected) => {
//     if (isSelected) {
//       setSelectedUsers((prev) => [...prev, userId]);
//     } else {
//       setSelectedUsers((prev) => prev.filter((id) => id !== userId));
//     }
//   };

//   const handleSend = async () => {
//     setStatus("Sending...");
//     const token = localStorage.getItem("token");
//     try {
//       console.log("Sending notification with payload:", {
//         selectedUsers: filter === "custom" ? selectedUsers : [],
//         filter,
//         channels,
//         messageContent,
//       });
//       await axios.post(
//         "/api/admin/notifications/send",
//         {
//           selectedUsers: filter === "custom" ? selectedUsers : [],
//           filter,
//           channels,
//           messageContent,
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setStatus("Notifications sent successfully!");
//       // Refresh the admin notifications list after sending
//       fetchAdminNotifications();
//     } catch (error) {
//       console.error("Error sending notifications:", error);
//       setStatus(
//         "Error sending notifications: " +
//           (error.response?.data?.error || error.message)
//       );
//     }
//   };

//   // Toggle (enable/disable) a notification's active status
//   const toggleNotification = async (notificationId, currentStatus) => {
//     const token = localStorage.getItem("token");
//     try {
//       console.log(
//         `Toggling notification ${notificationId} from active=${currentStatus} to active=${!currentStatus}`
//       );
//       await axios.put(
//         `/api/admin/notifications/${notificationId}`,
//         { active: !currentStatus },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       // Update local state
//       setAdminNotifications((prev) =>
//         prev.map((notif) =>
//           notif._id === notificationId ? { ...notif, active: !currentStatus } : notif
//         )
//       );
//     } catch (error) {
//       console.error("Error updating notification status:", error);
//       setListStatus("Error updating notification status: " + error.message);
//     }
//   };

//   // Remove a notification
//   const removeNotification = async (notificationId) => {
//     const token = localStorage.getItem("token");
//     try {
//       console.log(`Removing notification ${notificationId}`);
//       await axios.delete(`/api/admin/notifications/${notificationId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       // Update local state: remove the deleted notification
//       setAdminNotifications((prev) =>
//         prev.filter((notif) => notif._id !== notificationId)
//       );
//     } catch (error) {
//       console.error("Error deleting notification:", error);
//       setListStatus("Error deleting notification: " + error.message);
//     }
//   };

//   // Pagination controls
//   const handlePrevPage = () => {
//     if (page > 1) {
//       fetchAdminNotifications(page - 1);
//     }
//   };

//   const handleNextPage = () => {
//     if (page < totalPages) {
//       fetchAdminNotifications(page + 1);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
//       {/* --- Section 1: Send Notification --- */}
//       <h2 className="text-3xl font-bold mb-6 text-gray-800">
//         Newsletter / Notification
//       </h2>

//       {/* User Selection */}
//       <div className="mb-6">
//         <h3 className="text-xl font-semibold text-gray-700 mb-2">
//           User Selection
//         </h3>
//         <div className="flex space-x-6">
//           <label className="inline-flex items-center">
//             <input
//               type="radio"
//               value="all"
//               checked={filter === "all"}
//               onChange={() => setFilter("all")}
//               className="form-radio text-blue-600"
//             />
//             <span className="ml-2">All Users</span>
//           </label>
//           <label className="inline-flex items-center">
//             <input
//               type="radio"
//               value="custom"
//               checked={filter === "custom"}
//               onChange={() => setFilter("custom")}
//               className="form-radio text-blue-600"
//             />
//             <span className="ml-2">Custom Selection</span>
//           </label>
//         </div>
//       </div>

//       {filter === "custom" && (
//         <div className="mb-6">
//           <h4 className="text-lg font-semibold text-gray-700 mb-2">
//             Select Users
//           </h4>
//           {users.length > 0 ? (
//             <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto border p-4 rounded">
//               {users.map((user) => (
//                 <label key={user._id} className="flex items-center space-x-2">
//                   <input
//                     type="checkbox"
//                     value={user._id}
//                     onChange={(e) =>
//                       handleUserSelection(user._id, e.target.checked)
//                     }
//                     className="form-checkbox text-blue-600"
//                   />
//                   <span className="text-gray-600">{user.email}</span>
//                 </label>
//               ))}
//             </div>
//           ) : (
//             <p className="text-gray-500">No users available for selection.</p>
//           )}
//         </div>
//       )}

//       {/* Channel Selection */}
//       <div className="mb-6">
//         <h3 className="text-xl font-semibold text-gray-700 mb-2">
//           Select Channels
//         </h3>
//         <div className="flex space-x-6">
//           <label className="inline-flex items-center">
//             <input
//               type="checkbox"
//               checked={channels.email}
//               onChange={(e) =>
//                 setChannels({ ...channels, email: e.target.checked })
//               }
//               className="form-checkbox text-blue-600"
//             />
//             <span className="ml-2">Email</span>
//           </label>
//           <label className="inline-flex items-center">
//             <input
//               type="checkbox"
//               checked={channels.sms}
//               onChange={(e) =>
//                 setChannels({ ...channels, sms: e.target.checked })
//               }
//               className="form-checkbox text-blue-600"
//             />
//             <span className="ml-2">SMS</span>
//           </label>
//           <label className="inline-flex items-center">
//             <input
//               type="checkbox"
//               checked={channels.inApp}
//               onChange={(e) =>
//                 setChannels({ ...channels, inApp: e.target.checked })
//               }
//               className="form-checkbox text-blue-600"
//             />
//             <span className="ml-2">In-App Notification</span>
//           </label>
//         </div>
//       </div>

//       {/* Message Composer */}
//       <div className="mb-6">
//         {channels.email && (
//           <div className="mb-4">
//             <h3 className="text-xl font-semibold text-gray-700 mb-2">
//               Email Content
//             </h3>
//             <textarea
//               rows="5"
//               className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//               placeholder="Compose your email message here..."
//               value={messageContent.email}
//               onChange={(e) =>
//                 setMessageContent({ ...messageContent, email: e.target.value })
//               }
//             />
//           </div>
//         )}
//         {channels.sms && (
//           <div className="mb-4">
//             <h3 className="text-xl font-semibold text-gray-700 mb-2">
//               SMS Content
//             </h3>
//             <textarea
//               rows="3"
//               className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//               placeholder="Compose your SMS message here..."
//               value={messageContent.sms}
//               onChange={(e) =>
//                 setMessageContent({ ...messageContent, sms: e.target.value })
//               }
//             />
//           </div>
//         )}
//         {channels.inApp && (
//           <div className="mb-4">
//             <h3 className="text-xl font-semibold text-gray-700 mb-2">
//               In-App Notification Content
//             </h3>
//             <textarea
//               rows="3"
//               className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//               placeholder="Compose your in-app notification here..."
//               value={messageContent.inApp}
//               onChange={(e) =>
//                 setMessageContent({ ...messageContent, inApp: e.target.value })
//               }
//             />
//           </div>
//         )}
//       </div>

//       {/* Send Button & Status */}
//       <div className="flex items-center space-x-4 mb-10">
//         <button
//           onClick={handleSend}
//           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//         >
//           Send Notification
//         </button>
//         {status && (
//           <span className="text-lg font-medium text-gray-700">{status}</span>
//         )}
//       </div>

//       {/* --- Section 2: Manage Created Notifications --- */}
//       <h2 className="text-3xl font-bold mb-4 text-gray-800">
//         Manage Created Notifications
//       </h2>
//       {listStatus && <div className="mb-4 text-red-600">{listStatus}</div>}
//       {adminNotifications.length === 0 ? (
//         <p className="text-gray-500">No notifications created yet.</p>
//       ) : (
//         <>
//           <table className="min-w-full bg-white shadow-md rounded-lg">
//             <thead>
//               <tr>
//                 <th className="py-2 px-4 border-b">Message</th>
//                 <th className="py-2 px-4 border-b">Type</th>
//                 <th className="py-2 px-4 border-b">Created At</th>
//                 <th className="py-2 px-4 border-b">Status</th>
//                 <th className="py-2 px-4 border-b">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {adminNotifications.map((notif) => (
//                 <tr key={notif._id} className="text-center">
//                   <td className="py-2 px-4 border-b">{notif.message}</td>
//                   <td className="py-2 px-4 border-b">{notif.type}</td>
//                   <td className="py-2 px-4 border-b">
//                     {new Date(notif.createdAt).toLocaleString()}
//                   </td>
//                   <td className="py-2 px-4 border-b">
//                     {notif.active ? "Active" : "Disabled"}
//                   </td>
//                   <td className="py-2 px-4 border-b flex justify-center space-x-2">
//                     <button
//                       onClick={() =>
//                         toggleNotification(notif._id, notif.active)
//                       }
//                       className={`px-3 py-1 rounded ${
//                         notif.active
//                           ? "bg-red-500 text-white"
//                           : "bg-green-500 text-white"
//                       }`}
//                     >
//                       {notif.active ? "Disable" : "Enable"}
//                     </button>
//                     <button
//                       onClick={() => removeNotification(notif._id)}
//                       className="px-3 py-1 rounded bg-gray-500 text-white hover:bg-gray-600"
//                     >
//                       Remove
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {/* Pagination Controls */}
//           <div className="flex justify-between items-center mt-4">
//             <button
//               onClick={handlePrevPage}
//               disabled={page === 1}
//               className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
//             >
//               Previous
//             </button>
//             <span className="text-gray-700">
//               Page {page} of {totalPages}
//             </span>
//             <button
//               onClick={handleNextPage}
//               disabled={page === totalPages}
//               className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
//             >
//               Next
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default NotificationsManagement;


