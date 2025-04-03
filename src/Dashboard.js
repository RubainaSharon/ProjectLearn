import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Dashboard = ({ username }) => {
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/user-data/${username}`);
        setSkills(response.data.skills);
      } catch (error) {
        setError("Failed to fetch user data.");
      }
    };
    if (username) {
      fetchUserData();
    }
  }, [username]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {skills.length > 0 ? (
        <div className="space-y-4">
          {skills.map((skill, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-md shadow-md">
              <h2 className="text-xl font-semibold">{skill.skill}</h2>
              <p>Score: {skill.score}</p>
              <p>Level: {skill.learning_journey.level}</p>
              <p>Progress: {skill.progress.toFixed(2)}%</p>
              <Link
                to={`/learning-journey/${skill.skill}`} // Updated to point to the new route
                className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Continue Learning
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p>No skills found.</p>
      )}
    </div>
  );
};

export default Dashboard;