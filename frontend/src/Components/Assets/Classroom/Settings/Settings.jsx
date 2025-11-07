import React, { useState, useEffect } from "react";
import "./Settings.css";

export default function Settings() {
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBehaviors = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api/";
        const res = await fetch(`${API_BASE}get-behaviors/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBehaviors(data);
      } catch (err) {
        console.error("Error fetching behaviors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBehaviors();
  }, []);

  if (loading) return <p>Loading user behaviors...</p>;

  return (
    <div className="settings-container">
      <h2>User Behavior Log</h2>

      {behaviors.length === 0 ? (
        <p>No recorded behaviors yet.</p>
      ) : (
        <table className="behavior-table">
          <thead>
            <tr>
              <th>Scroll Velocity</th>
              <th>Hover Duration</th>
              <th>Click Error Rate</th>
              <th>Focus Mode</th>
              <th>Action</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {behaviors.map((b, index) => (
              <tr key={index}>
                <td>{b.scroll_velocity}</td>
                <td>{b.hover_duration}</td>
                <td>{b.click_error_rate}</td>
                <td>{b.focus_mode}</td>
                <td>{b.action}</td>
                <td>{b.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
