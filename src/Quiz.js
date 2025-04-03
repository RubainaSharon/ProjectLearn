import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // Add useNavigate
import Navbar from "./navbar";

const Quiz = ({ username }) => {
  const { skill } = useParams();
  const navigate = useNavigate(); // For redirecting
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [error, setError] = useState("");
  const [canTakeQuiz, setCanTakeQuiz] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkCanTakeQuiz = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/can-take-quiz/${username}/${skill}`);
        if (!response.data.can_take) {
          setCanTakeQuiz(false);
          setMessage(response.data.message);
        } else {
          const questionsResponse = await axios.get(`http://localhost:8000/questions/${skill}`);
          if (questionsResponse.data.length > 0) {
            setQuestions(questionsResponse.data);
            setUserAnswers(new Array(questionsResponse.data.length).fill(null));
          } else {
            setError("No questions available for this skill.");
          }
        }
      } catch (error) {
        console.error("Error loading quiz:", error.message);
        setError(`Failed to load quiz: ${error.message}`);
      }
    };
    if (username && skill) {
      checkCanTakeQuiz();
    }
  }, [username, skill]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestion] = option;
    setUserAnswers(updatedAnswers);
  };

  const handleNextQuestion = () => {
    if (selectedOption !== null) {
      let isCorrect = selectedOption === questions[currentQuestion].correct_answer;
      setScore((prevScore) => {
        let newScore = isCorrect ? prevScore + 1 : prevScore;
        if (currentQuestion + 1 < questions.length) {
          setCurrentQuestion(currentQuestion + 1);
          setSelectedOption(userAnswers[currentQuestion + 1]);
        } else {
          setShowScore(true);
          submitScore(newScore);
        }
        return newScore;
      });
    } else {
      alert("Please select an option before proceeding.");
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(userAnswers[currentQuestion - 1]);
    }
  };

  const submitScore = async (finalScore) => {
    try {
      await axios.post("http://localhost:8000/submit-score", {
        username,
        skill,
        score: finalScore,
      });
      // Redirect to the learning journey page after submitting the score
      navigate(`/learning-journey/${skill}`);
    } catch (error) {
      setError("Failed to submit score.");
    }
  };

  if (!canTakeQuiz) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-lg">{message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl w-full mx-auto p-6 bg-gray-900 shadow-lg rounded-lg">
          {showScore ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Your Score: {score} / {questions.length}
              </h2>
              <p className="mt-4">Redirecting to your learning journey...This may take few minutes.Please wait.</p>
            </div>
          ) : questions.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Question {currentQuestion + 1}:
              </h2>
              <p className="text-lg">{questions[currentQuestion].question}</p>
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="mt-2">
                  <input
                    type="radio"
                    id={`option${index}`}
                    name="quiz"
                    value={option}
                    checked={selectedOption === option}
                    onChange={() => handleOptionSelect(option)}
                    className="mr-2"
                  />
                  <label htmlFor={`option${index}`} className="cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
              <div className="mt-4 flex justify-between">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md disabled:opacity-50"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                >
                  Back
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={handleNextQuestion}
                >
                  {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <div className="flex justify-center items-center h-screen">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;