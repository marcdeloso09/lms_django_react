import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Frontpage.css";
import canva from "../Sections/canva.png";
import blackboard from "../Sections/blackboard.png";
import msteams from "../Sections/msteams.png";
import tutorialVideo from '../Sections/tutorial.mp4'

export default function Frontpage() {
  const navigate = useNavigate();

  const [showTips, setShowTips] = React.useState(true);
  const [hasFinishedBefore, setHasFinishedBefore] = React.useState(false);
  const [videoFinished, setVideoFinished] = React.useState(false);
  const VIDEO_DURATION = 253;

  React.useEffect(() => {
    const done = localStorage.getItem("tipsFinished");
    if (done === "true") {
      setHasFinishedBefore(true);
    }
  }, []);

  React.useEffect(() => {
    let timer;
    if (showTips && !hasFinishedBefore) {
      timer = setTimeout(() => {
        setVideoFinished(true);
      }, VIDEO_DURATION * 1000);
    }
    return () => clearTimeout(timer);
  }, [showTips, hasFinishedBefore]);

  const handleFinish = () => {
    localStorage.setItem("tipsFinished", "true");
    setHasFinishedBefore(true);
    setShowTips(false);
  };


  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("participantId");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <div className="frontpage-container">
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
            <h2>Tutorial & Behavior Guide</h2>

            {/* ------- VIDEO PLAYER ------- */}
            <video
              width="100%"
              controls
              onEnded={() => setVideoFinished(true)}
              style={{ borderRadius: "10px", marginTop: "10px" }}
            >
              <source src={tutorialVideo} type="video/mp4" />
              Your browser does not support video playback.
            </video>

            <div className="tips-buttons" style={{ marginTop: "15px" }}>
              
              {hasFinishedBefore && (
                <button
                  onClick={() => setShowTips(false)}
                  className="skip-btn"
                  style={{ marginRight: "10px" }}
                >
                  Skip
                </button>
              )}

              {videoFinished && (
                <button
                  onClick={handleFinish}
                  className="next-btn"
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
