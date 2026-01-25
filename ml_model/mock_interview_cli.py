import sys
import os
import json
import re
import argparse
import pdfplumber
import spacy
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Predefined Skill Keywords (Same as Notebook)
SKILL_KEYWORDS = {
    "python", "java", "c++", "javascript", "typescript", "react", "angular", "vue",
    "node.js", "django", "flask", "fastapi", "sql", "nosql", "mongodb", "postgresql",
    "aws", "azure", "gcp", "docker", "kubernetes", "git", "machine learning",
    "deep learning", "nlp", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "html", "css", "sass", "rest api", "graphql", "ci/cd", "agile", "scrum", "linux"
}

def load_spacy_model():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        # Silently try to download if missing, or warn
        print("Warning: 'en_core_web_sm' not found. NLP extraction reduced.", file=sys.stderr)
        return None

nlp = load_spacy_model()

def extract_resume_text(file_path):
    if not os.path.exists(file_path):
        return json.dumps({"error": f"File not found: {file_path}"})

    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        return json.dumps({"error": f"Error parsing PDF: {str(e)}"})
    
    clean_text = re.sub(r'\s+', ' ', text).strip()
    return json.dumps({"success": True, "text": clean_text, "length": len(clean_text)})

def extract_skills(text):
    text_lower = text.lower()
    found_skills = set()

    # 1. Keyword Matching
    for skill in SKILL_KEYWORDS:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found_skills.add(skill)

    # 2. NLP Extraction
    if nlp:
        doc = nlp(text)
        for ent in doc.ents:
             if ent.label_ in {"ORG", "PRODUCT", "WORK_OF_ART"}:
                candidate = ent.text.lower().strip()
                if candidate in SKILL_KEYWORDS:
                     found_skills.add(candidate)

    return list(found_skills)

def generate_questions(resume_text, position, yoe, total_questions=5):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return json.dumps({"error": "GEMINI_API_KEY not set"})

    skills = extract_skills(resume_text)
    
    technical_count = max(1, int(total_questions * 0.6))
    project_count = max(1, int(total_questions * 0.25))
    behavioral_count = total_questions - technical_count - project_count
    
    prompt = f"""
    You are a Senior Technical Interviewer. Generate a mock interview.
    
    **Candidate:**
    - Position: {position}
    - Experience: {yoe} Years
    - Detected Skills: {', '.join(skills)}
    - Full Resume Context: {resume_text[:2000]}... (truncated)

    **Task:**
    Generate exactly {total_questions} questions:
    1. Technical ({technical_count}): Based on skills/role. Difficulty: {yoe} YOE.
    2. Project ({project_count}): Practical scenario.
    3. Behavioral ({behavioral_count}): Culture fit.

    **Output (Strict JSON)**:
    {{
      "questions": [
        "Question 1 string",
        "Question 2 string",
        ...
      ]
    }}
    Do not use markdown blocks. Return ONLY JSON.
    """

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro')
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text)
        return json.dumps({"success": True, "skills": skills, "questions": data.get("questions", [])})
        
    except Exception as e:
        return json.dumps({"error": str(e)})

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['parse_resume', 'generate_questions'])
    parser.add_argument('--file', help='Path to resume PDF')
    parser.add_argument('--text', help='Resume text content')
    parser.add_argument('--position', help='Job position')
    parser.add_argument('--yoe', type=str, default='3', help='Years of experience')
    parser.add_argument('--count', type=int, default=5, help='Number of questions')
    
    args = parser.parse_args()
    
    if args.mode == 'parse_resume':
        if not args.file:
            print(json.dumps({"error": "Missing --file argument"}))
        else:
            print(extract_resume_text(args.file))
            
    elif args.mode == 'generate_questions':
        if not args.text or not args.position:
            print(json.dumps({"error": "Missing --text or --position argument"}))
        else:
            print(generate_questions(args.text, args.position, args.yoe, args.count))

if __name__ == "__main__":
    main()
