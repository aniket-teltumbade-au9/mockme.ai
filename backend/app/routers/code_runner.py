import subprocess
import tempfile
import os
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/code", tags=["code_runner"])

# Map language names to file extensions and run commands
LANGUAGE_CONFIG: dict[str, dict] = {
    "javascript": {"ext": "js",  "cmd": ["node"]},
    "typescript": {"ext": "ts",  "cmd": ["npx", "ts-node", "--skip-project"]},
    "python":     {"ext": "py",  "cmd": ["python3"]},
    "java":       {"ext": "java","cmd": None},   # handled specially
    "cpp":        {"ext": "cpp", "cmd": None},   # handled specially
}

TIMEOUT_SECONDS = 10


class RunCodeRequest(BaseModel):
    code: str
    language: str


@router.post("/run")
async def run_code(request: RunCodeRequest):
    lang = request.language.lower()
    config = LANGUAGE_CONFIG.get(lang)

    if not config:
        return {"stdout": "", "stderr": f"Unsupported language: {lang}", "exit_code": 1}

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            ext = config["ext"]
            file_path = os.path.join(tmpdir, f"solution.{ext}")

            with open(file_path, "w") as f:
                f.write(request.code)

            if lang == "java":
                # Compile first
                compile_result = subprocess.run(
                    ["javac", file_path],
                    capture_output=True, text=True, timeout=TIMEOUT_SECONDS, cwd=tmpdir
                )
                if compile_result.returncode != 0:
                    return {"stdout": "", "stderr": compile_result.stderr, "exit_code": compile_result.returncode}
                cmd = ["java", "-cp", tmpdir, "solution"]

            elif lang == "cpp":
                out_path = os.path.join(tmpdir, "solution")
                compile_result = subprocess.run(
                    ["g++", file_path, "-o", out_path],
                    capture_output=True, text=True, timeout=TIMEOUT_SECONDS
                )
                if compile_result.returncode != 0:
                    return {"stdout": "", "stderr": compile_result.stderr, "exit_code": compile_result.returncode}
                cmd = [out_path]

            else:
                cmd = config["cmd"] + [file_path]

            result = subprocess.run(
                cmd,
                capture_output=True, text=True,
                timeout=TIMEOUT_SECONDS,
                cwd=tmpdir
            )

            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
            }

    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"Execution timed out after {TIMEOUT_SECONDS}s", "exit_code": 124}
    except FileNotFoundError as e:
        return {"stdout": "", "stderr": f"Runtime not found: {e}", "exit_code": 127}
    except Exception as e:
        return {"stdout": "", "stderr": f"Execution error: {str(e)}", "exit_code": 1}
