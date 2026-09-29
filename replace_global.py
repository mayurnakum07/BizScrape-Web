import os
import re

ROOT_DIR = r"E:\BizScrape Web"

REPLACEMENTS = {
    r"surat_cafe": "newyork_cafe",
    r"surat_it": "newyork_it",
    r"suratroast": "nycroast",
    r"suratcafe": "nyccafe",
    r"Surat —": "New York —",
    r"(?i)\bsurat\b": "newyork",
    r"\bSurat\b": "New York",
    r"\bsurat\b": "newyork",
    r"\bSURAT\b": "NEWYORK",
    r"\bMumbai\b": "Toronto",
    r"\bmumbai\b": "toronto",
    r"\bAhmedabad\b": "London",
    r"\bahmedabad\b": "london",
    r"\bPune\b": "Sydney",
    r"\bpune\b": "sydney",
    r"\bIndia\b": "USA",
    r"\bindia\b": "usa",
    r"\bINDIA\b": "USA",
    r"\bIndian\b": "Global",
    r"\bindian\b": "global",
    r"\bINDIAN\b": "GLOBAL",
    r"\bGujarat\b": "NY",
    r"\bgujarat\b": "ny",
    r"\bMota Varachha\b": "Manhattan",
    r"\bVesu\b": "Brooklyn",
    r"\bAdajan\b": "Queens",
    r"\bindiamart\b": "yelp",
    r"\btradeindia\b": "yellowpages",
    r"₹": "$",
    r"\bINR\b": "USD",
    r"\+91": "+1",
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
    
    # We should order replacements so that smaller parts don't replace inside bigger parts, 
    # but with word boundaries (\b) it should be mostly fine.
    
    for pattern, replacement in REPLACEMENTS.items():
        content = re.sub(pattern, replacement, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

def main():
    for root, dirs, files in os.walk(ROOT_DIR):
        # modify dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in EXCLUDE_EXTS:
                continue
                
            filepath = os.path.join(root, file)
            # Do not modify this script itself
            if os.path.basename(filepath) == "replace_global.py":
                continue
                
            process_file(filepath)

if __name__ == "__main__":
    main()
