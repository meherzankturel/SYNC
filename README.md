# Private Couples App

A hyper-private, emotionally resonant iOS app for two partners in a long-distance relationship.

## Architecture

- **Platform**: iOS (SwiftUI, MVVM)
- **Backend**: Firebase (Auth, Firestore, Functions, FCM)
- **Modules**:
  - `Core`: Shared models, logic, and DI.
  - `DesignSystem`: UI components, fonts, colors.
  - `Features/*`: Independent feature modules (Mood, DateNight, etc.)

## Directory Structure

```
CouplesApp/
├── App/                # Main App entry point and assembly
├── Core/               # Foundation code
├── DesignSystem/       # Reusable UI
├── Features/           # Functional modules
│   ├── Auth/
│   ├── Mood/
│   └── DateNight/
├── functions/          # Firebase Cloud Functions (TypeScript)
└── firestore.rules     # Security Rules
```

## Setup

1. **Firebase**:
   - Create a project.
   - Enable Auth (Email/Link), Firestore, Functions.
   - Deploy rules: `firebase deploy --only firestore:rules`
   - Deploy functions: `cd functions && npm install && npm run deploy`

2. **iOS**:
   - Open Packages.
   - `Core` and `DesignSystem` are dependencies of Feature modules.
   - `App` depends on all Features.

## Key Features

- **Moods**: Share detailed emotional state with encryption.
- **Presence**: Subtle real-time status when partner is "thinking of you".
- **Date Night**: Scheduled events with Calendar and Facetime deep links.
- **SOS**: One-tap emergency contact protocol.
