import React from "react";
import { Link } from "react-router-dom";

const Profile = ({ username }) => {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p className="mb-2">Username: {username}</p>
      <Link to="/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded-md inline-block">
        Dashboard
      </Link>
    </div>
  );
};

export default Profile;