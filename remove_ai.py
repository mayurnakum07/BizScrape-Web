import os
import re

ROOT_DIR = r"E:\BizScrape Web"

REPLACEMENTS = {
    "—": "-",
    ":-": ":",
}

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    ".next",
    ".venv",
    "__pycache__",
    "build",
    "dist",
    ".pytest_cache",
}

EXCLUDE_EXTS = {
    ".pyc",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".db",
    ".csv",
}

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return

    original_content = content
    
    for pattern, replacement in REPLACEMENTS.items():
        content = content.replace(pattern, replacement)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

def main():
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in EXCLUDE_EXTS:
                continue
                
            filepath = os.path.join(root, file)
            if os.path.basename(filepath) in ("replace_global.py", "remove_ai.py"):
                continue
                
            process_file(filepath)

if __name__ == "__main__":
    main()
