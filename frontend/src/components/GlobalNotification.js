// src/components/GlobalNotification.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const GlobalNotification = () => {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          // Display the most recent notification
          setNotification(res.data[0]);
        }
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err);
      });
  }, []);

  if (!notification || !visible) return null;

  return (
    <div className="w-full bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <span className="text-lg">{notification.message}</span>
      <button
        onClick={() => setVisible(false)}
        className="text-gray-400 hover:text-gray-200 focus:outline-none text-2xl"
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
};

export default GlobalNotification;
