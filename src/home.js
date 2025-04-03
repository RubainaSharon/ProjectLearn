import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "./navbar";

const Home = ({ username }) => {
  const [activeSkill, setActiveSkill] = useState(null);
  const [isSkillsVisible, setIsSkillsVisible] = useState(false);
  const skillsRef = useRef(null);
  const homeRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsSkillsVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    if (skillsRef.current) observer.observe(skillsRef.current);
    return () => observer.disconnect();
  }, []);

  const skillData = {
    Programming: ["C", "C++", "Python", "SQL", "Java", "JavaScript", "HTML", "CSS"],
    Technology: [
      "Data Analysis",
      "Machine Learning & Artificial Intelligence",
      "Cloud Computing",
      "Cybersecurity",
      "Blockchain Technology",
      "Docker",
      "Kubernetes",
    ],
    "Business Skills": ["Stock Marketing", "Digital Marketing"],
    "Soft Skills": ["Communication Skills", "Leadership", "Time Management", "Resilience", "Adaptability"],
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center">
      <Navbar homeRef={homeRef} skillsRef={skillsRef} username={username} />
      <div ref={homeRef} id="home" className="flex items-center justify-center h-screen">
        <h1 className="text-9xl font-bold text-center">Learn</h1>
      </div>
      <div
        id="skills"
        ref={skillsRef}
        className={`flex flex-col items-center justify-center min-h-screen text-center pb-32 transition-opacity duration-[2000ms] ${
          isSkillsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="text-6xl font-extrabold mb-16">What do you yearn to learn?</h2>
        <ul className="text-4xl space-y-10 font-bold">
          {Object.keys(skillData).map((skill) => (
            <li key={skill} className="flex flex-col items-center">
              <div
                className={`cursor-pointer border border-white p-4 transition-all duration-300 hover:scale-105 ${
                  activeSkill === skill ? "border-2" : ""
                }`}
                onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}
              >
                {skill}
              </div>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  activeSkill === skill ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <ul className="text-3xl space-y-3 mt-4">
                  {skillData[skill].map((item) => (
                    <li key={item} className="cursor-pointer hover:underline">
                      <Link to={`/quiz/${item}`}>{item}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;