import re
import os

# Read data from mockData.js
mockDataPath = "frontend/src/data/mockData.js"
if os.path.exists(mockDataPath):
    with open(mockDataPath, "r") as f:
        mock_data = f.read()
    
    # Extract batches
    batches_match = re.search(r'(export const initialBatches = \[.*?\];)', mock_data, re.DOTALL)
    batches_data = batches_match.group(1) if batches_match else ""
    
    # Extract studyDataByDay
    study_match = re.search(r'(export const studyDataByDay = \{.*?\};)', mock_data, re.DOTALL)
    study_data = study_match.group(1) if study_match else ""

# Read chapters
chaptersPath = "frontend/src/data/chapters.js"
if os.path.exists(chaptersPath):
    with open(chaptersPath, "r") as f:
        chapters_data = f.read()

# Update MockCourseRepository
courseRepo = f"""{chapters_data}

{study_data}

export const MockCourseRepository = {{
  getChapters: async () => {{
    return initialChapters;
  }},
  getStudyData: async () => {{
    return studyDataByDay;
  }}
}};
"""
with open("frontend/src/repositories/mock/MockCourseRepository.js", "w") as f:
    f.write(courseRepo)

# Update MockBatchRepository
batchRepo = f"""{batches_data}

export const MockBatchRepository = {{
  getBatches: async () => {{
    return initialBatches;
  }},
  saveBatches: async (batches) => {{
    return true;
  }}
}};
"""
with open("frontend/src/repositories/mock/MockBatchRepository.js", "w") as f:
    f.write(batchRepo)

# For MockStudentRepository, we'll just copy students.js into it
studentsPath = "frontend/src/lib/students.js"
if os.path.exists(studentsPath):
    with open(studentsPath, "r") as f:
        students_code = f.read()
    
    studentRepo = f"""{students_code}

export const MockStudentRepository = {{
  getStudents: async () => {{
    return loadStudents();
  }},
  saveStudents: async (students) => {{
    saveStudents(students);
    return true;
  }}
}};
"""
    with open("frontend/src/repositories/mock/MockStudentRepository.js", "w") as f:
        f.write(studentRepo)

    # Clean up old files
    os.remove(studentsPath)

if os.path.exists(mockDataPath):
    os.remove(mockDataPath)
if os.path.exists(chaptersPath):
    os.remove(chaptersPath)

