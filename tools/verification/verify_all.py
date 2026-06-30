import os
import re

FRONTEND_SRC = 'frontend/src'
BACKEND_SRC = 'backend/src'

print("=== Starting Analysis ===")

# 1. Find all frontend API calls
print("\n--- Frontend API Calls ---")
frontend_api_calls = []
for root, _, files in os.walk(FRONTEND_SRC):
    for f in files:
        if f.endswith('.js') or f.endswith('.jsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                matches = re.findall(r'api\.(get|post|put|patch|delete|upload|download)\([\'"`](.*?)[\'"`]', content)
                if matches:
                    for method, endpoint in matches:
                        print(f"{path.replace(FRONTEND_SRC, '')}: {method.upper()} {endpoint}")
                        frontend_api_calls.append((method.upper(), endpoint))

# 2. Find all backend routes
print("\n--- Backend Routes ---")
backend_routes = []
for root, _, files in os.walk(BACKEND_SRC + '/routes'):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            prefix = f.replace('.routes.js', '')
            if prefix == 'index': continue
            
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                matches = re.findall(r'router\.(get|post|put|patch|delete)\([\'"`](.*?)[\'"`]', content)
                for method, endpoint in matches:
                    full_endpoint = f"/{prefix}{endpoint if endpoint != '/' else ''}"
                    if full_endpoint.endswith('/') and len(full_endpoint) > 1:
                        full_endpoint = full_endpoint[:-1]
                    print(f"{path.replace(BACKEND_SRC, '')}: {method.upper()} {full_endpoint}")
                    backend_routes.append((method.upper(), full_endpoint))

print("\n--- Unmatched Frontend Calls ---")
for f_method, f_endpoint in frontend_api_calls:
    # basic matching logic
    # f_endpoint might be something like `/course` or `/auth/login`
    matched = False
    for b_method, b_endpoint in backend_routes:
        # naive match
        if b_method == f_method and (f_endpoint == b_endpoint or f_endpoint.startswith(b_endpoint + '/')):
            matched = True
            break
        # handle dynamic routes like /course/:id
        if re.sub(r':[^/]+', '', b_endpoint) in f_endpoint:
            matched = True
            break
            
    if not matched:
        print(f"MISSING BACKEND ROUTE FOR: {f_method} {f_endpoint}")

print("\n--- Analysis Complete ---")
