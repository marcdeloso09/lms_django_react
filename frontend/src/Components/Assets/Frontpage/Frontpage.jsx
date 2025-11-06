import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Frontpage.css";
import canva from "../Sections/canva.png";
import blackboard from "../Sections/blackboard.png";
import msteams from "../Sections/msteams.png";

export default function Frontpage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("participantId");
    localStorage.removeItem("userEmail");
    navigate("/login"); // or your login route
  };

  return (
    <div className="frontpage-container">
      {/* 🔹 Logout Button */}
      <div className="logout-container">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="login-boxes">
        <div className="boxes">
          <div className="box-1">
            <div className="box-logo">
              <img src={canva} alt="" />
              <p>Canva Room</p>
            </div>
            <Link to={"/canvas"} style={{ textDecoration: "none" }}>
              <div className="box-content">
                <button className="button">Enter</button>
              </div>
            </Link>
          </div>

          <div className="box-2">
            <div className="box-logo">
              <img src={blackboard} alt="" />
              <p>Ease Room</p>
            </div>
            <Link to={"/classroom"} style={{ textDecoration: "none" }}>
              <div className="box-content">
                <button className="button">Enter</button>
              </div>
            </Link>
          </div>

          <div className="box-3">
            <div className="box-logo">
              <img src={msteams} style={{ marginTop: "15px" }} alt="" />
              <p style={{ marginTop: "40px" }}>Teams Room</p>
            </div>
            <Link to={"/msteams"}>
              <div className="box-content">
                <button className="button">Enter</button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
