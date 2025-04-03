import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = ({ homeRef, skillsRef, username }) => {
  const location = useLocation();

  const scrollToTop = () => {
    if (location.pathname === "/" && homeRef && homeRef.current) {
      homeRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToSkills = () => {
    if (location.pathname === "/" && skillsRef && skillsRef.current) {
      skillsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="bg-black text-white w-full py-4 fixed top-0 flex justify-center shadow-md z-50">
      <ul className="flex space-x-16 text-3xl font-bold items-center">
        <li className="transition-transform duration-300 ease-in-out hover:scale-110 hover:underline underline-offset-8">
          <Link to="/" onClick={scrollToTop}>
            Home
          </Link>
        </li>
        <li className="transition-transform duration-300 ease-in-out hover:scale-110 hover:underline underline-offset-8">
          <Link
            to={{ pathname: "/", state: { scrollToSkills: true } }}
            onClick={scrollToSkills}
          >
            Skills
          </Link>
        </li>
        <li className="transition-transform duration-300 ease-in-out hover:scale-110 hover:underline underline-offset-8">
          <Link to="/about">About</Link>
        </li>
        <li className="transition-transform duration-300 ease-in-out hover:scale-110 hover:underline underline-offset-8">
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li className="ml-4">
          <Link to="/profile" title="Profile">
            <svg
              className="w-8 h-8 text-white hover:text-blue-400 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;