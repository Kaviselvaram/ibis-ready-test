filepath = "frontend/src/main.jsx"
with open(filepath, "r") as f:
    code = f.read()

# Fix the broken Checkout
code = code.replace('import\n  out from "./components/auth/\n  out";', 'import Checkout from "./components/auth/Checkout";')
code = code.replace('<\\n  out />', '<Checkout />')
code = code.replace('<\\n  out', '<Checkout')
code = code.replace('< \n  out', '<Checkout')
code = code.replace('<\n  out', '<Checkout')

with open(filepath, "w") as f:
    f.write(code)

