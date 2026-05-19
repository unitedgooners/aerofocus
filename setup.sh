#!/bin/bash

# FlightFocus - Project Setup Script
# Run this from inside your flightfocus folder:
# bash setup.sh

echo "🛫 Setting up FlightFocus project structure..."

# ── Directories ───────────────────────────────────────────────────────────────
mkdir -p src/api
mkdir -p src/components
mkdir -p src/screens
mkdir -p src/store
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/types
mkdir -p supabase/migrations
mkdir -p docs

echo "✅ Directories created"

# ── .env ──────────────────────────────────────────────────────────────────────
cat > .env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_OPENSKY_CLIENT_ID=
EXPO_PUBLIC_OPENSKY_CLIENT_SECRET=
EXPO_PUBLIC_ADSBEXCHANGE_KEY=
EOF

# ── .gitignore ────────────────────────────────────────────────────────────────
cat > .gitignore << 'EOF'
node_modules/
.expo/
dist/
.env
*.log
.DS_Store
EOF

# ── tsconfig.json ─────────────────────────────────────────────────────────────
cat > tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
EOF

# ── Placeholder files (so VS Code shows the full tree) ───────────────────────

touch src/api/supabase.ts
touch src/api/flightApi.ts
touch src/api/flightCache.ts
touch src/api/sessionApi.ts
touch src/api/userApi.ts

touch src/hooks/usePomodoro.ts
touch src/hooks/useSession.ts
touch src/hooks/useFlightPool.ts
touch src/hooks/useCrew.ts

touch src/screens/LoginScreen.tsx
touch src/screens/SignupScreen.tsx
touch src/screens/HomeScreen.tsx
touch src/screens/LiveSessionScreen.tsx
touch src/screens/ShareCardScreen.tsx
touch src/screens/CrewScreen.tsx
touch src/screens/AirportPickerScreen.tsx
touch src/screens/LogbookScreen.tsx

touch src/components/FlightCard.tsx
touch src/components/StreakBar.tsx
touch src/components/FlightMap.tsx
touch src/components/PomodoroChips.tsx
touch src/components/TimerDisplay.tsx
touch src/components/BoardingPassCard.tsx
touch src/components/CrewMemberRow.tsx
touch src/components/DeparturesBoard.tsx
touch src/components/PassportMap.tsx

touch src/store/authStore.ts
touch src/store/sessionStore.ts

touch src/utils/config.ts
touch src/utils/airports.ts
touch src/utils/shareCard.ts
touch src/utils/formatters.ts

touch src/types/index.ts

touch supabase/migrations/001_schema.sql
touch supabase/migrations/002_triggers.sql

touch docs/ARCHITECTURE.md

echo "✅ All files created"
echo ""
echo "📁 Structure:"
find . -not -path './node_modules/*' -not -path './.expo/*' -not -path './.git/*' | sort | sed 's|[^/]*/|  |g'
echo ""
echo "🔑 Next: fill in your .env file with Supabase + OpenSky keys"
echo "📦 Then run: npx create-expo-app . --template blank-typescript"
echo "🚀 Then paste the module code into each file"

