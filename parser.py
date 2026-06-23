import re
import json
import os

def parse_jds(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    parts = re.split(r'## \*\*Day (\d+)\*\*', content)
    
    jds = []
    for i in range(1, len(parts), 2):
        day_num = int(parts[i])
        section = parts[i+1]

        def extract(pattern, text):
            match = re.search(pattern, text, re.DOTALL)
            return match.group(1).strip() if match else ""

        company = extract(r'\*\*Company:\*\* (.*?)(?=\s+\*\*About Us:\*\*)', section)
        about_us = extract(r'\*\*About Us:\*\* (.*?)(?=\s+\*\*Position:\*\*)', section)
        position = extract(r'\*\*Position:\*\* (.*?)(?=\s+\*\*Experience:\*\*)', section)
        experience = extract(r'\*\*Experience:\*\* (.*?)(?=\s+\*\*Location:\*\*)', section)
        location = extract(r'\*\*Location:\*\* (.*?)(?=\s+\*\*Notice Period:\*\*)', section)
        notice_period = extract(r'\*\*Notice Period:\*\* (.*?)(?=\s+\*\*Qualification:\*\*)', section)
        qualification = extract(r'\*\*Qualification:\*\* (.*?)(?=\s+\*\*Industry Preference:\*\*)', section)
        industry_pref = extract(r'\*\*Industry Preference:\*\* (.*?)(?=\n\n### \*\*Job Summary\*\*)', section)

        job_summary = extract(r'### \*\*Job Summary\*\*\n(.*?)(?=\n\n### \*\*Key Responsibilities\*\*)', section)
        key_responsibilities = extract(r'### \*\*Key Responsibilities\*\*\n(.*?)(?=\n\n### \*\*Required Skills\*\*)', section)
        required_skills = extract(r'### \*\*Required Skills\*\*\n(.*?)(?=\n\n### \*\*Preferred Candidate Profile\*\*)', section)
        preferred_profile = extract(r'### \*\*Preferred Candidate Profile\*\*\n(.*?)(?=\n\n### \*\*Why Join Us\?\*\*)', section)
        why_join = extract(r'### \*\*Why Join Us\?\*\*\n(.*?)(?=\n\n## \*\*Day|\Z)', section)

        full_text = f"Company: {company}\nAbout Us: {about_us}\nPosition: {position}\nExperience: {experience}\nLocation: {location}\n\nJob Summary:\n{job_summary}\n\nKey Responsibilities:\n{key_responsibilities}\n\nRequired Skills:\n{required_skills}\n\nPreferred Profile:\n{preferred_profile}\n\nWhy Join Us:\n{why_join}"

        jds.append({
            "day_number": day_num,
            "role": position,
            "description": full_text,
            "metadata": {
                "company": company,
                "experience": experience,
                "location": location,
                "industry_preference": industry_pref
            }
        })

    return jds

if __name__ == "__main__":
    jds = parse_jds('jd_samples.md')
    with open('jds_output.json', 'w', encoding='utf-8') as f:
        json.dump(jds, f, indent=2, ensure_ascii=False)
    print(f"Successfully parsed {len(jds)} JDs and saved to jds_output.json")
