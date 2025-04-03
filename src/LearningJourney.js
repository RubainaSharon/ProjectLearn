import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Navbar from "./navbar";

const LearningJourney = ({ username }) => {
  const { skill } = useParams();
  const [learningJourney, setLearningJourney] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLearningJourney = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/user-data/${username}`);
        const skillData = response.data.skills.find((s) => s.skill.toLowerCase() === skill.toLowerCase());
        if (skillData && skillData.learning_journey) {
          setLearningJourney(skillData.learning_journey);
        } else {
          setError("Learning journey not found for this skill.");
        }
      } catch (error) {
        setError("Failed to fetch learning journey.");
      }
    };
    if (username && skill) {
      fetchLearningJourney();
    }
  }, [username, skill]);

  const handleProgressUpdate = async (chapterIndex, completed) => {
    try {
      await axios.post("http://localhost:8000/update-progress", {
        username,
        skill,
        chapter_index: chapterIndex,
        completed,
      });
      setLearningJourney({
        ...learningJourney,
        chapters: learningJourney.chapters.map((ch, i) =>
          i === chapterIndex ? { ...ch, completed } : ch
        ),
      });
    } catch (error) {
      setError("Failed to update progress.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl w-full mx-auto p-6 bg-gray-900 shadow-lg rounded-lg">
          {error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : learningJourney ? (
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">
                Your Learning Journey: {learningJourney.level} ({skill})
              </h3>
              <div className="space-y-6">
                {learningJourney.chapters.map((chapter, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 p-4 rounded-md shadow-md transition-all hover:bg-gray-700"
                  >
                    <h4 className="text-lg font-bold text-blue-400">
                      Chapter {chapter.chapter}: {chapter.title}
                    </h4>
                    <p className="mt-2">
                      <strong>Description:</strong> {chapter.description}
                    </p>
                    <p className="mt-1">
                      <strong>Topics:</strong> {chapter.topics.join(", ")}
                    </p>
                    <p className="mt-1">
                      <strong>Resources:</strong>{" "}
                      {chapter.resources.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline mr-2"
                        >
                          {resource}
                        </a>
                      ))}
                    </p>
                    <p className="mt-1">
                      <strong>Summary:</strong> {chapter.summary}
                    </p>
                    <button
                      className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                      onClick={() =>
                        handleProgressUpdate(index, !chapter.completed)
                      }
                    >
                      {chapter.completed
                        ? "Mark as Incomplete"
                        : "Mark as Completed"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningJourney;