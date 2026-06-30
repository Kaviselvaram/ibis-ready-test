import re

filepath = "frontend/src/hooks/useAuthenticationController.js"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace("""  const initializeSession = async () => {
    setLoading(true);
    const activeUser = await AuthenticationRepository.refreshSession();
    setUser(activeUser);
    setLoading(false);
  };""", """  let sessionAttempted = false;
  const initializeSession = async () => {
    if (sessionAttempted) return;
    sessionAttempted = true;
    setLoading(true);
    const activeUser = await AuthenticationRepository.refreshSession();
    setUser(activeUser);
    setLoading(false);
  };""")

# We need to make sure the state is scoped locally or to a ref, wait, if sessionAttempted is outside the component (module scope), it works across mounts.
# Yes, `let sessionAttempted = false;` in the file scope will ensure it runs once per application load!
# We can put it outside the hook.
code = code.replace("  let sessionAttempted = false;", "")
code = 'let sessionAttempted = false;\n\n' + code

with open(filepath, "w") as f:
    f.write(code)

