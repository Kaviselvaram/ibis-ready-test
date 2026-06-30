import os
import shutil
import re

# 1. Create directories
os.makedirs("frontend/src/api", exist_ok=True)
os.makedirs("frontend/src/repositories/mock", exist_ok=True)
os.makedirs("frontend/src/contexts", exist_ok=True)
os.makedirs("frontend/src/errors", exist_ok=True)

# 2. Move apiClient.js to api/ApiClient.js
shutil.move("frontend/src/lib/apiClient.js", "frontend/src/api/ApiClient.js")

# 3. Create AuthClient.js
with open("frontend/src/api/AuthClient.js", "w") as f:
    f.write("""import { api } from './ApiClient';

export const AuthClient = {
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password });
  },
  logout: async () => {
    return await api.post('/auth/logout');
  },
  refresh: async () => {
    // using native fetch for silent refresh
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!res.ok) throw new Error("Session expired");
    return res.json();
  }
};
""")

# 4. Create AuthenticationRepository.js
with open("frontend/src/repositories/AuthenticationRepository.js", "w") as f:
    f.write("""import { AuthClient } from '../api/AuthClient';
import { setToken, parseToken } from '../api/ApiClient';

export const AuthenticationRepository = {
  signIn: async (email, password) => {
    const payload = await AuthClient.login(email, password);
    const data = payload.data || payload;
    setToken(data.access_token);
    return parseToken(data.access_token);
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

# 5. Move QuestionBankRepository.js to mock/MockQuestionBankRepository.js
shutil.move("frontend/src/repositories/QuestionBankRepository.js", "frontend/src/repositories/mock/MockQuestionBankRepository.js")

# 6. Re-export QuestionBankRepository.js
with open("frontend/src/repositories/QuestionBankRepository.js", "w") as f:
    f.write("""export { loadBank, saveBank, DIFFICULTIES, BLOOM_LEVELS } from './mock/MockQuestionBankRepository';\n""")

# 7. Create AuthContext.jsx
with open("frontend/src/contexts/AuthContext.jsx", "w") as f:
    f.write("""import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const value = {
    user,
    setUser,
    loading,
    setLoading,
    isSignedIn: Boolean(user),
    isConfigured: true
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within <AuthProvider>");
  return ctx;
}
""")

# Remove the old auth.jsx
if os.path.exists("frontend/src/lib/auth.jsx"):
    os.remove("frontend/src/lib/auth.jsx")

