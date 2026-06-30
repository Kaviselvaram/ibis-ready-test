filepath = "frontend/src/hooks/useAuthenticationController.js"
with open(filepath, "r") as f:
    code = f.read()

# Replace the useEffect with initializeSession
code = code.replace("""  useEffect(() => {
    // Attempt silent refresh on mount
    const initSession = async () => {
      setLoading(true);
      const activeUser = await AuthenticationRepository.refreshSession();
      setUser(activeUser);
      setLoading(false);
    };
    initSession();
  }, [setUser, setLoading]);""", """  const initializeSession = async () => {
    setLoading(true);
    const activeUser = await AuthenticationRepository.refreshSession();
    setUser(activeUser);
    setLoading(false);
  };""")

code = code.replace("signOut", "signOut,\n    initializeSession")
with open(filepath, "w") as f:
    f.write(code)

filepath = "frontend/src/main.jsx"
with open(filepath, "r") as f:
    code = f.read()

# Add useAuthenticationController and useEffect to App
if "useAuthenticationController" not in code:
    code = 'import { useAuthenticationController } from "./hooks/useAuthenticationController";\n' + code

code = code.replace("function App() {", """function App() {
  const { initializeSession } = useAuthenticationController();
  
  useEffect(() => {
    initializeSession();
  }, []);
""")

with open(filepath, "w") as f:
    f.write(code)

