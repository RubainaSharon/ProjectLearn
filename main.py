from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from database import SessionLocal, engine
import models
from schemas import QuestionList, UserScoreCreate, UpdateProgress, Question
from pydantic import BaseModel
from typing import List
from openai import OpenAI
import json
from datetime import date, datetime
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize OpenRouter client
api_key = os.getenv("OPENROUTER_API_KEY")
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key
)

# Helper functions
def has_taken_quiz_today(db: Session, username: str, skill: str):
    today = date.today()
    user_skill = db.query(models.UserSkill).filter(
        models.UserSkill.username.ilike(username),
        models.UserSkill.skill.ilike(skill)
    ).first()
    return user_skill and user_skill.last_attempt_date == today

def get_api_calls_today(db: Session):
    today = date.today()
    count = db.query(models.ApiCall).filter(models.ApiCall.timestamp >= today).count()
    return count

def generate_and_store_journey(db: Session, username: str, skill: str, score: int):
    try:
        prompt = (
            f"Create a personalized learning journey for a {skill} learner with a quiz score of {score} out of 20. "
            f"Based on this score, determine their skill level (Beginner: 0-10, Intermediate: 11-15, Advanced: 16-20) "
            f"and create a 10-chapter learning journey tailored to their level. "
            f"Each chapter should include: a chapter number, a title, a brief description of the content, "
            f"specific topics to cover, online resources (with URLs) for learning, and a summary of key takeaways. "
            f"Return the response in JSON format with 'level' (string) and 'chapters' (list of 10 chapters, each with "
            f"'chapter', 'title', 'description', 'topics', 'resources', and 'summary')."
        )
        response = client.chat.completions.create(
            model="deepseek/deepseek-r1:free",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.7,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "QuizApp"
            }
        )
        journey_text = response.choices[0].message.content.strip()
        journey = json.loads(journey_text)
        for chapter in journey["chapters"]:
            chapter["completed"] = False

        api_call = models.ApiCall(timestamp=datetime.now())
        db.add(api_call)
        db.commit()

        return journey
    except Exception as e:
        print(f"OpenRouter API Error: {e}")
        level = "Beginner" if score <= 10 else "Intermediate" if score <= 15 else "Advanced"
        journey = {
            "level": level,
            "chapters": [
                {
                    "chapter": i + 1,
                    "title": f"{skill} Chapter {i + 1}",
                    "description": f"Learn key concepts of {skill}.",
                    "topics": ["Basics"],
                    "resources": ["https://example.com"],
                    "summary": "Key takeaways.",
                    "completed": False
                } for i in range(10)
            ]
        }
        return journey

# Endpoints
@app.get("/check-username/{username}")
def check_username(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username.ilike(username)).first()
    return {"exists": bool(user)}

@app.get("/can-take-quiz/{username}/{skill}")
def can_take_quiz(username: str, skill: str, db: Session = Depends(get_db)):
    if has_taken_quiz_today(db, username, skill):
        return {"can_take": False, "message": "You have already taken the quiz for this skill today. Taking it again will overwrite your previous learning journey."}
    if get_api_calls_today(db) >= 200:
        return {"can_take": False, "message": "Sorry we are a growing website with low budget implementation hence we are using a free tier AI for this website. And so the limit of taking the number of quiz per day is 200. Unfortunately you are the 201th member. But I request you to come back tomorrow to try our website again. Thank you <3"}
    return {"can_take": True}

@app.post("/submit-score")
def submit_score(score_data: UserScoreCreate, db: Session = Depends(get_db)):
    username = score_data.username
    skill = score_data.skill
    score = score_data.score
    today = date.today()

    user = db.query(models.User).filter(models.User.username.ilike(username)).first()
    if not user:
        db.add(models.User(username=username))
        db.commit()

    user_skill = db.query(models.UserSkill).filter(
        models.UserSkill.username.ilike(username),
        models.UserSkill.skill.ilike(skill)
    ).first()
    journey = generate_and_store_journey(db, username, skill, score)
    if user_skill:
        user_skill.score = score
        user_skill.learning_journey = journey
        user_skill.progress = 0.0
        user_skill.last_attempt_date = today
        flag_modified(user_skill, "learning_journey")
    else:
        user_skill = models.UserSkill(
            username=username,
            skill=skill,
            score=score,
            learning_journey=journey,
            progress=0.0,
            last_attempt_date=today
        )
        db.add(user_skill)
    db.commit()
    return {"message": "Score and journey updated", "journey": journey}

@app.get("/user-data/{username}")
def get_user_data(username: str, db: Session = Depends(get_db)):
    user_skills = db.query(models.UserSkill).filter(models.UserSkill.username.ilike(username)).all()
    skills_data = [
        {
            "skill": skill.skill,
            "score": skill.score,
            "learning_journey": skill.learning_journey,
            "progress": skill.progress,
            "last_attempt_date": skill.last_attempt_date
        } for skill in user_skills
    ]
    return {"skills": skills_data}

@app.post("/update-progress")
def update_progress(data: UpdateProgress, db: Session = Depends(get_db)):
    print(f"Received request: {data}")
    user_skill = db.query(models.UserSkill).filter(
        models.UserSkill.username.ilike(data.username),
        models.UserSkill.skill.ilike(data.skill)
    ).first()
    if not user_skill:
        print(f"User skill not found for username: {data.username}, skill: {data.skill}")
        raise HTTPException(status_code=404, detail="User skill not found")
    print(f"Found user_skill: {user_skill.username}, {user_skill.skill}")
    journey = user_skill.learning_journey
    print(f"Current learning_journey: {journey}")
    if 0 <= data.chapter_index < len(journey["chapters"]):
        journey["chapters"][data.chapter_index]["completed"] = data.completed
        completed_count = sum(1 for ch in journey["chapters"] if ch["completed"])
        user_skill.progress = (completed_count / len(journey["chapters"])) * 100
        user_skill.learning_journey = journey
        flag_modified(user_skill, "learning_journey")  # Force SQLAlchemy to detect the change
        print(f"Updated learning_journey: {user_skill.learning_journey}")
        print(f"Updated progress: {user_skill.progress}")
        db.commit()
        print("Changes committed to database")
        return {"message": "Progress updated"}
    print(f"Invalid chapter index: {data.chapter_index}")
    raise HTTPException(status_code=400, detail="Invalid chapter index")

@app.get("/questions/{skill}")
def get_questions(skill: str, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(models.Question.skill.ilike(skill)).all()
    result = []
    for q in questions:
        try:
            options = json.loads(q.options)
            result.append({
                "type": q.type,
                "question": q.question,
                "options": options,
                "correct_answer": q.correct_answer,
                "skill": q.skill
            })
        except json.JSONDecodeError as e:
            print(f"Error parsing options for question ID {q.id}: {q.options}, error: {e}")
            continue
    return result

@app.get("/questions")
def get_all_questions(db: Session = Depends(get_db)):
    questions = db.query(models.Question).all()
    result = []
    for q in questions:
        try:
            options = json.loads(q.options)
            result.append({
                "type": q.type,
                "question": q.question,
                "options": options,
                "correct_answer": q.correct_answer,
                "skill": q.skill
            })
        except json.JSONDecodeError as e:
            print(f"Error parsing options for question ID {q.id}: {q.options}, error: {e}")
            continue
    return result

@app.post("/questions")
def add_questions(questions: List[Question], db: Session = Depends(get_db)):
    for question in questions:
        # Convert options list to JSON string for storage
        options_json = json.dumps(question.options)
        db_question = models.Question(
            type=question.type,
            question=question.question,
            options=options_json,
            correct_answer=question.correct_answer,
            skill=question.skill
        )
        db.add(db_question)
    db.commit()
    return {"message": f"Successfully added {len(questions)} questions"}

@app.get("/available-skills")
def get_available_skills(db: Session = Depends(get_db)):
    skills = db.query(models.Question.skill).distinct().all()
    return {"skills": [skill[0] for skill in skills]}