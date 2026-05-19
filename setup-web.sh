#!/bin/bash

# FlightFocus Web - Setup Script
# Run from inside your flightfocus folder: bash setup-web.sh

echo "🛫 Setting up FlightFocus web app..."

# ── Directories ───────────────────────────────────────────────────────────────
mkdir -p src/screens
mkdir -p src/components
mkdir -p src/store
mkdir -p src/hooks
mkdir -p src/mock
mkdir -p src/utils
mkdir -p src/types
mkdir -p public

# ── package.json ──────────────────────────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "flightfocus",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "zustand": "^4.5.2"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version"]
  }
}
EOF

# ── public/index.html ─────────────────────────────────────────────────────────
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FlightFocus</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #0a1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

# ── tsconfig.json ─────────────────────────────────────────────────────────────
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es6",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
EOF

# ── Placeholder source files ───────────────────────────────────────────────────
touch src/index.tsx
touch src/App.tsx
touch src/types/index.ts
touch src/utils/config.ts
touch src/mock/data.ts
touch src/store/authStore.ts
touch src/store/sessionStore.ts
touch src/hooks/usePomodoro.ts
touch src/screens/LoginScreen.tsx
touch src/screens/HomeScreen.tsx
touch src/screens/LiveSessionScreen.tsx
touch src/screens/ShareCardScreen.tsx
touch src/screens/CrewScreen.tsx

echo "✅ Done"
echo ""
echo "Next steps:"
echo "  1. Paste the code into each src/ file"
echo "  2. npm install"
echo "  3. npm start"
echo "  4. Open http://localhost:3000"