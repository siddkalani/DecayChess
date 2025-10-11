# Chess App - Restructured

## New Folder Structure

The app has been reorganized into a more professional and maintainable structure:

```
app/
├── (auth)/                    # Authentication screens
│   ├── _layout.tsx           # Auth navigation layout
│   ├── index.ts              # Auth exports
│   ├── login.tsx             # Login screen
│   └── signup.tsx            # Signup screen
├── (main)/                   # Main application screens  
│   ├── _layout.tsx           # Main navigation layout
│   ├── index.ts              # Main screens exports
│   ├── choose.tsx            # Game selection screen
│   ├── matchmaking.tsx       # Matchmaking screen
│   ├── tournament.tsx        # Tournament screen
│   ├── leaderboard.tsx       # Leaderboard screen
│   ├── profile.tsx           # User profile screen
│   └── streak-master.tsx     # Streak master game mode
├── (game)/                   # Game-related functionality
│   ├── _layout.tsx           # Game navigation layout
│   ├── time-controls/        # Time control configurations
│   │   ├── index.ts          # Time controls exports
│   │   ├── classic.tsx       # Classic time controls
│   │   └── crazy.tsx         # Crazy time controls
│   └── variants/             # Chess game variants
│       ├── index.ts          # Variants exports
│       ├── classic.tsx       # Classic chess
│       ├── crazy-house.tsx   # Crazy house variant
│       ├── decay.tsx         # Decay variant
│       └── six-pointer.tsx   # Six pointer variant
├── components/               # Reusable UI components
│   ├── index.ts              # Main components export
│   ├── ui/                   # Basic UI components
│   │   ├── index.ts          # UI components exports
│   │   ├── UserAvatar.tsx    # User avatar component
│   │   ├── VariantCard.tsx   # Game variant card
│   │   └── NewsletterIcon.tsx # Newsletter icon
│   ├── layout/               # Layout components  
│   │   ├── index.ts          # Layout components exports
│   │   ├── Layout.tsx        # Main layout wrapper
│   │   ├── BottomBar.tsx     # Bottom navigation
│   │   ├── HeaderBar.tsx     # Header bar
│   │   └── TopNavBar.tsx     # Top navigation
│   └── game/                 # Game-specific components
│       ├── index.ts          # Game components exports
│       ├── GameControls.tsx  # Game control buttons
│       └── chessPieces.tsx   # Chess piece components
├── lib/                      # Shared utilities and types
│   ├── index.ts              # Main lib exports
│   ├── types.ts              # TypeScript type definitions
│   ├── constants.ts          # App constants and configuration
│   └── utils.ts              # Utility functions
├── styles/                   # Global styles
│   └── globals.css           # Global CSS styles
├── _layout.tsx               # Root navigation layout
├── Home.tsx                  # Welcome/landing screen
└── index.tsx                 # App entry point

```

## Key Improvements

### 1. **Route Groups Organization**
- `(auth)`: Authentication flows
- `(main)`: Core application screens
- `(game)`: Game-specific functionality

### 2. **Component Organization**
- `ui/`: Reusable UI components
- `layout/`: Layout and navigation components  
- `game/`: Game-specific components

### 3. **Centralized Utilities**
- `lib/types.ts`: All TypeScript interfaces and types
- `lib/constants.ts`: App constants, routes, colors, variants
- `lib/utils.ts`: Utility functions for storage, validation, etc.

### 4. **Improved Imports**
- Each folder has an `index.ts` file for clean exports
- Consistent import paths throughout the app
- Updated asset import paths to match new structure

### 5. **Naming Conventions**
- Consistent kebab-case for file names where appropriate
- PascalCase for component files
- Descriptive folder and file names

## Updated Import Examples

### Before:
```tsx
import Layout from './components/Layout';
import ChessGame from "./chessboards/classic";
```

### After:
```tsx
import { Layout } from '../components';
import { ClassicChess } from '../(game)/variants';
```

## Route Changes

### Before:
- `/Login` → `/(auth)/login`
- `/Signup` → `/(auth)/signup`
- `/choose` → `/(main)/choose`

### After:
All routes now use the grouped structure for better organization and type safety.

## Benefits

1. **Better Organization**: Related files are grouped together
2. **Scalability**: Easy to add new features without cluttering
3. **Maintainability**: Clear separation of concerns
4. **Type Safety**: Improved import structure with TypeScript
5. **Professional Structure**: Follows modern React Native/Expo conventions
6. **Consistency**: Uniform naming and organization patterns
