import re
import json

def parse_llm_response(response_text):
    # 1. Extract the section between tags more reliably
    ui_part = ""
    voice_part = ""
    
    if "[UI_SYNC]" in response_text:
        # Find start of UI_SYNC
        start_idx = response_text.find("[UI_SYNC]") + len("[UI_SYNC]")
        # End is either start of [VOICE_TEXT] or end of string
        end_idx = response_text.find("[VOICE_TEXT]")
        if end_idx == -1:
            ui_part = response_text[start_idx:]
        else:
            ui_part = response_text[start_idx:end_idx]
            voice_part = response_text[end_idx + len("[VOICE_TEXT]"):]
    else:
        # If no tag, assume everything might be JSON or split by some other logic
        ui_part = response_text
        
    # 2. Extract JSON from the UI part
    ui_config = {}
    json_match = re.search(r"(\{.*\})", ui_part, re.DOTALL)
    if json_match:
        try:
            json_str = json_match.group(1).strip()
            ui_config = json.loads(json_str)
        except json.JSONDecodeError:
            print(f"Failed to parse [UI_SYNC] JSON. Raw string: {json_match.group(1)}")
            ui_config = {"error": "Invalid UI state from LLM"}
    
    # 3. Handle Voice part
    voice_script = voice_part.strip()
    if not voice_script:
        # Fallback: if voice part is empty, try to find [VOICE_TEXT] anywhere
        voice_match = re.search(r"\[VOICE_TEXT\]\s*(.*)", response_text, re.DOTALL)
        if voice_match:
            voice_script = voice_match.group(1).strip()
        else:
            # Final fallback: anything that's not the JSON we found
            voice_script = re.sub(r"\{.*\}", "", response_text, flags=re.DOTALL).strip()
            voice_script = voice_script.replace("[UI_SYNC]", "").replace("[VOICE_TEXT]", "").strip()

    if not voice_script:
        voice_script = "I'm ready to begin the interview."

    return ui_config, voice_script
