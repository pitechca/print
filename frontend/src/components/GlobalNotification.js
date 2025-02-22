// src/components/GlobalNotification.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const GlobalNotification = () => {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return; // Don't fetch if not logged in
        }
        
        const res = await axios.get("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data && res.data.length > 0) {
          // Filter for active notifications
          const activeNotifications = res.data.filter(note => note.active !== false);
          
          if (activeNotifications.length > 0) {
            // Use the most recent notification
            setNotification(activeNotifications[0]);
            setVisible(true);
          }
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Handle disabling the notification
  const disableNotification = async () => {
    if (!notification) return;
    
    setVisible(false); // Hide immediately for better UX
    
    try {
      const token = localStorage.getItem("token");
      
      // Call the endpoint to disable the notification
      await axios.put(
        `/api/notifications/${notification._id}`, 
        { active: false },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Notification disabled");
    } catch (err) {
      console.error("Error disabling notification:", err);
      // Even if there's an error, we keep it hidden for the current session
    }
  };

  if (loading || !notification || !visible) return null;

  return (
    <div className="w-full bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <span className="text-lg">{notification.message}</span>
      <button
        onClick={disableNotification}
        className="text-gray-400 hover:text-gray-200 focus:outline-none text-2xl"
        aria-label="Disable notification"
      >
        &times;
      </button>
    </div>
  );
};

export default GlobalNotification;