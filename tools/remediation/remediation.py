import os
import shutil

# 1. Create errors
os.makedirs("frontend/src/errors", exist_ok=True)
errors = ["ApiError", "RepositoryError", "AuthenticationError", "AuthorizationError", "NotFoundError", "ValidationError"]
for err in errors:
    with open(f"frontend/src/errors/{err}.js", "w") as f:
        f.write(f"""export class {err} extends Error {{
  constructor(message, details = null) {{
    super(message);
    this.name = '{err}';
    this.details = details;
  }}
}}
""")

# 2. utils/token.js
os.makedirs("frontend/src/utils", exist_ok=True)
with open("frontend/src/utils/token.js", "w") as f:
    f.write("""export const parseToken = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (e) {
    return null;
  }
};
""")

# 3. Update ApiClient.js
with open("frontend/src/api/ApiClient.js", "w") as f:
    f.write("""import { ApiError } from '../errors/ApiError';

let memoryToken = null;

export const setToken = (token) => { memoryToken = token; };
export const getToken = () => memoryToken;

export const api = async (endpoint, options = {}) => {
  const url = `/api${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(memoryToken && { 'Authorization': `Bearer ${memoryToken}` }),
    ...options.headers
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
  
  let res;
  try {
    res = await fetch(url, { ...options, headers, signal: controller.signal });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new ApiError("Request timeout");
    throw new ApiError("Network error", error);
  }
  clearTimeout(timeoutId);
  
  if (res.status === 401 && !options._retry) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      if (refreshRes.ok) {
        const { data } = await refreshRes.json();
        setToken(data.access_token);
        headers['Authorization'] = `Bearer ${data.access_token}`;
        res = await fetch(url, { ...options, headers, _retry: true });
      } else {
        throw new ApiError("Session expired", { status: 401 });
      }
    } catch (err) {
      setToken(null);
      throw new ApiError("Session expired", { status: 401 });
    }
  }

  let json = {};
  if (res.headers.get('content-type')?.includes('application/json')) {
    json = await res.json();
  }

  if (!res.ok) {
    throw new ApiError(json.error || json.message || "API request failed", { status: res.status });
  }
  
  return json.data || json;
};

api.get = (endpoint, opts) => api(endpoint, { ...opts, method: 'GET' });
api.post = (endpoint, body, opts) => api(endpoint, { ...opts, method: 'POST', body: JSON.stringify(body) });
api.put = (endpoint, body, opts) => api(endpoint, { ...opts, method: 'PUT', body: JSON.stringify(body) });
api.delete = (endpoint, opts) => api(endpoint, { ...opts, method: 'DELETE' });
""")

# 4. Update AuthenticationRepository
with open("frontend/src/repositories/AuthenticationRepository.js", "w") as f:
    f.write("""import { AuthClient } from '../api/AuthClient';
import { setToken } from '../api/ApiClient';
import { parseToken } from '../utils/token';
import { RepositoryError } from '../errors/RepositoryError';

export const AuthenticationRepository = {
  signIn: async (email, password) => {
    try {
      const payload = await AuthClient.login(email, password);
      const data = payload.data || payload;
      setToken(data.access_token);
      return parseToken(data.access_token);
    } catch (e) {
      throw new RepositoryError("Authentication failed", e);
    }
  },
  signOut: async () => {
    try {
      await AuthClient.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setToken(null);
  },
  refreshSession: async () => {
    try {
      const payload = await AuthClient.refresh();
      const data = payload.data || payload;
      if (data && data.access_token) {
        setToken(data.access_token);
        return parseToken(data.access_token);
      }
      return null;
    } catch (e) {
      setToken(null);
      return null;
    }
  }
};
""")

# 5. Create Mock Data and Repositories
# We'll extract initialChapters from chapters.js
# and initialStudents, initialBatches, studyDataByDay from mockData.js

os.makedirs("frontend/src/repositories/mock", exist_ok=True)

with open("frontend/src/repositories/mock/MockCourseRepository.js", "w") as f:
    f.write("""import { initialChapters } from "../../data/chapters";
import { studyDataByDay } from "../../data/mockData";

export const MockCourseRepository = {
  getChapters: async () => {
    return initialChapters;
  },
  getStudyData: async () => {
    return studyDataByDay;
  }
};
""")

with open("frontend/src/repositories/CourseRepository.js", "w") as f:
    f.write("""export { MockCourseRepository as CourseRepository } from './mock/MockCourseRepository';\n""")

with open("frontend/src/repositories/mock/MockStudentRepository.js", "w") as f:
    f.write("""import { loadStudents, saveStudents } from "../../lib/students";

export const MockStudentRepository = {
  getStudents: async () => {
    return loadStudents();
  },
  saveStudents: async (students) => {
    saveStudents(students);
    return true;
  }
};
""")

with open("frontend/src/repositories/StudentRepository.js", "w") as f:
    f.write("""export { MockStudentRepository as StudentRepository } from './mock/MockStudentRepository';\n""")

with open("frontend/src/repositories/mock/MockBatchRepository.js", "w") as f:
    f.write("""import { initialBatches } from "../../data/mockData";

export const MockBatchRepository = {
  getBatches: async () => {
    return initialBatches;
  },
  saveBatches: async (batches) => {
    // mock save
    return true;
  }
};
""")

with open("frontend/src/repositories/BatchRepository.js", "w") as f:
    f.write("""export { MockBatchRepository as BatchRepository } from './mock/MockBatchRepository';\n""")


