import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Frontpage.css";
import canva from "../Sections/canva.png";
import blackboard from "../Sections/blackboard.png";
import msteams from "../Sections/msteams.png";

export default function Frontpage() {
  const navigate = useNavigate();
  const [showTips, setShowTips] = React.useState(true); 
  const [tipIndex, setTipIndex] = React.useState(0);

  const tips = [
    "Welcome! This interface adapts based on how you interact through scroll, hover and click. this simulation project implemented this behaviors only on the dashboard and inside the contents of each courses/classes for now which aims to reduce the visual overload of contents on Learning Platforms faced by students.",
    "Slow Scroll Speed (<30 px/s): For example, you tend to do a slow reading or navigating inside the platform to properly check everything, The UI will then expand by removing the sidebar to help you prioritize the main content of the page.",
    "Hover Duration (<3s): Example for this is too many courses/classes enrolled on the platform. Hovering or pointing your mouse cursor for less than 3 seconds over courses, assignments, lessons/modules triggers Focus Mode to help you prioritize what you only want to click",
    "Click Error Rate (>15%): Example scenario where you are frustrated on so many activities and dont know where to start so you fast click on the empty parts or white spaces of the page to ease your frustration. This will then be counted as wrong clicks and when you reach 15% and above you will not be able to click anything on the sidebar helping you to focus more on the main content area.",
    "Dim Mode activates if you stay active for too long and not doing anything to help reduce visual fatigue.",
    "You can check this behavior indicators on the tracking panel on the lower right side of each LMS (Learning Management Systems)",
    "Please kindly don't forget to answer our NASA TLX evaluation form after you have finished the testing. Thank you so much!",
    "Refresh this page to open the tips again."
  ];

  const handleNext = () => {
    if (tipIndex < tips.length - 1) {
      setTipIndex(tipIndex + 1);
    } else {
      setShowTips(false);
      setTipIndex(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("participantId");
    localStorage.removeItem("userEmail");
    navigate("/login"); 
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
      {showTips && (
        <div className="tips-overlay">
          <div className="tips-modal">
            <h2>Tips and Behavior Guide:</h2>
            <h4 style={{ marginTop: "2px"}}>(Important Please Read)</h4>
            <p>{tips[tipIndex]}</p>

            <div className="tips-buttons">
              <button onClick={handleNext} className="next-btn">
                {tipIndex === tips.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
