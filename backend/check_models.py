import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("CRITICAL: GEMINI_API_KEY not found in .env")
else:
    genai.configure(api_key=api_key)
    print(f"Checking models for key: {api_key[:10]}...")

    try:
        models = genai.list_models()
        model_list = list(models)
        if not model_list:
            print("No models returned by list_models(). Check your API key permissions.")
        for m in model_list:
            print(f"Found: {m.name} (Methods: {m.supported_generation_methods})")
    except Exception as e:
        print(f"Error during API call: {e}")
