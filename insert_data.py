import os
import json
import re

SUPABASE_URL = "https://gzttstbutwwdctenitfi.supabase.co"

folder = "cbse_worksheets"  # e.g. worksheets or wherever PDFs are

rows = []

for file in os.listdir(folder):

    if not file.endswith(".pdf"):
        continue

    name = file.replace(".pdf", "")

    try:
        # Match pattern: Class_8_Social Science_Hard_Set_A
        match = re.match(
            r"Class_(\d+)_(.+)_(Easy|Medium|Hard)_Set_([A-Z])",
            name
        )

        if not match:
            print("Skipping:", file)
            continue

        cls = int(match.group(1))
        subject = match.group(2)
        difficulty = match.group(3)
        set_name = match.group(4)

        chapter = "General"  # since not present in filename

    except Exception as e:
        print("Skipping:", file, e)
        continue

    url = f"{SUPABASE_URL}/storage/v1/object/public/worksheets/{file}"

    rows.append({
        "class": cls,
        "subject": subject,
        "chapter": chapter,
        "difficulty": difficulty,
        "set": set_name,
        "title": f"{subject} – {difficulty} (Set {set_name})",
        "question_count": 25,
        "pages": 3,
        "has_answer_key": True,
        "pdf_url": url
    })

# Save to JSON
with open("data.json", "w") as f:
    json.dump(rows, f, indent=2)

print("✅ data.json created with", len(rows), "records")
sql_lines = []

for row in rows:
    sql = f"""
    INSERT INTO worksheets (class, subject, chapter, difficulty, set, title, question_count, pages, has_answer_key, pdf_url)
    VALUES (
        {row['class']},
        '{row['subject']}',
        '{row['chapter']}',
        '{row['difficulty']}',
        '{row['set']}',
        '{row['title']}',
        {row['question_count']},
        {row['pages']},
        {str(row['has_answer_key']).lower()},
        '{row['pdf_url']}'
    );
    """
    sql_lines.append(sql)

with open("insert.sql", "w") as f:
    f.write("\n".join(sql_lines))

print("✅ insert.sql created")