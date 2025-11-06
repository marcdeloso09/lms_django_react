import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignupLogin.css"; // optional styling

export default function SignupLogin() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api/";

    const endpoint = isLogin
      ? `${API_BASE}login/`
      : `${API_BASE}signup/`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.");
        return;
      }

      if (isLogin) {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("userEmail", data.user.email);

        // Fetch participant ID before redirecting
        const pidResponse = await fetch(`${API_BASE}participant-id/`, {
          headers: { Authorization: `Bearer ${data.access}` },
        });

        const pidData = await pidResponse.json();

        if (pidData.participant_id) {
          localStorage.setItem("participantId", pidData.participant_id);
        }

        setMessage("✅ Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }else {
        setMessage("✅ Account created! You can now log in.");
        setIsLogin(true);
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Server error, please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
        </form>

        <p className="switch-text">
          {isLogin ? "No account yet?" : "Already have an account?"}{" "}
          <span className="switch-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign up" : "Login"}
          </span>
        </p>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  );
}
