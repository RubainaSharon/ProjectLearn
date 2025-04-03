import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./home";
import Quiz from "./Quiz";
import About from "./about";
import Navbar from "./navbar";
import Profile from "./Profile";
import Dashboard from "./Dashboard";
import UsernamePrompt from "./UsernamePrompt";
import LearningJourney from "./LearningJourney"; // Import the new component
import "./index.css";

function App() {
  const [username, setUsername] = useState(localStorage.getItem("username"));

  return (
    <Router>
      {!username && <UsernamePrompt setUsername={setUsername} />}
      <Routes>
        <Route path="/" element={<Home username={username} />} />
        <Route path="/quiz/:skill" element={<Quiz username={username} />} />
        <Route path="/learning-journey/:skill" element={<LearningJourney username={username} />} /> {/* New route */}
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<Profile username={username} />} />
        <Route path="/dashboard" element={<Dashboard username={username} />} />
      </Routes>
    </Router>
  );
}

export default App;