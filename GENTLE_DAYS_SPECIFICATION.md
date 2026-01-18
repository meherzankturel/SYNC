# Gentle Days — Complete Implementation Specification

**Feature:** Optional period-support experience for long-distance relationships  
**Platform:** iOS (SwiftUI) + Firebase (Firestore, Cloud Functions, FCM)  
**Approach:** Privacy-first, consent-based, emotionally intelligent  
**Status:** Specification Document — Ready for Implementation

---

## 1. Product Summary

Gentle Days is an optional, privacy-first feature designed to help long-distance partners offer emotional care and support during sensitive times. The experience centers around a simple daily check-in—"How are you feeling today?"—where users can optionally share their emotional state through carefully chosen chips (e.g., "tender", "needing space", "extra love today"). When sharing is enabled, partners receive gentle, human-friendly messages (never raw data) and can respond with care actions like sending a text, scheduling a FaceTime call, or sending a virtual hug. An optional manual period calendar allows partners to be notified once when sharing begins, but no predictions, analytics, or tracking language is used. Everything defaults to private; all sharing is opt-in, reversible, and editable. The feature avoids gamification, streaks, and pressure—prioritizing emotional safety, consent, and genuine connection over engagement metrics.

---

## 2. Priority Implementation Checklist (MVP Scope)

### Sprint 1: Foundation & Data Layer (Week 1)
**Goal:** Backend infrastructure, security rules, and basic data models

#### Tasks:

**2.1 Firestore Schema Design & Security Rules** (Medium - 1 day)
- Create collections: `gentleDaysSettings`, `gentleDaysStatus`, `periodCalendar`, `careActions`, `visibilityPreferences`
- Write security rules enforcing couple-level access and field-level privacy
- Test rules with Firebase Emulator
- **Acceptance Criteria:**
  - Rules prevent users from reading other couples' data
  - Partner can only read derived messages, not raw status chips
  - Period calendar data only readable by owner unless explicitly shared
  - All writes validated for correct `pairId` and `userId`

**2.2 Swift Data Models & Service Layer** (Medium - 1 day)
- Create Swift structs: `GentleDaysSettings`, `GentleDaysStatus`, `PeriodCalendar`, `CareAction`
- Implement `GentleDaysService` with methods: `updateStatus()`, `getPartnerStatus()`, `updateSettings()`, `sendCareAction()`
- Add local persistence layer (UserDefaults/CoreData for offline-first)
- **Acceptance Criteria:**
  - Models match Firestore schema exactly
  - Service methods handle offline scenarios gracefully
  - All Firestore writes use `serverTimestamp()` for consistency

**2.3 Chip-to-Partner-Message Mapping Logic** (Small - 4 hours)
- Implement deterministic mapping algorithm (Swift + Cloud Function)
- Create message templates for 10+ chip combinations
- Add Cloud Function to generate partner-facing messages on status write
- **Acceptance Criteria:**
  - Messages are warm, human, never clinical
  - Multiple chips combine into coherent sentences
  - Single chips produce simple, clear messages

**2.4 Cloud Functions: Notification Throttling & SOS** (Medium - 1 day)
- Implement notification throttling (max 1-2 per day)
- Create SOS notification handler (high priority, gentle tone)
- Set up FCM token management
- **Acceptance Criteria:**
  - Throttling logic prevents notification spam
  - SOS notifications bypass throttling but respect rate limits
  - All notifications use warm, human copy (see Copy Style Guide)

### Sprint 2: Onboarding & Settings (Week 1-2)
**Goal:** User can discover, enable, and configure Gentle Days

#### Tasks:

**2.5 Onboarding Flow UI** (Large - 2 days)
- Create 3-screen onboarding sequence (intro, permissions, completion)
- Implement toggle-based permission screen (all defaults OFF)
- Add "Skip for now" option at every step
- **Acceptance Criteria:**
  - Copy follows style guide (warm, non-clinical)
  - All toggles default to OFF (nothing shared by default)
  - User can complete onboarding without enabling anything
  - Edge case: User declines everything → feature remains accessible but inactive

**2.6 Settings Screen** (Medium - 1 day)
- Build settings UI with all toggles (status sharing, calendar sharing, notifications)
- Add "Edit Later" persistence
- Implement real-time sync of settings changes
- **Acceptance Criteria:**
  - Settings reflect current Firestore state
  - Changes save immediately with visual feedback
  - User can revoke sharing at any time (reversible)

**2.7 Feature Flag & Staged Rollout** (Small - 4 hours)
- Add feature flag to app config
- Implement A/B test capability (optional, for later)
- Add remote config support for gradual rollout
- **Acceptance Criteria:**
  - Feature can be toggled remotely without app update
  - Existing users see feature as optional (not forced)

### Sprint 3: Core Experience — Status Check-In (Week 2)
**Goal:** User can optionally share "How are you feeling today?"

#### Tasks:

**2.8 Primary Check-In Screen** (Large - 2 days)
- Build "How are you feeling today?" screen with chip selector
- Implement multi-select chip UI (SwiftUI `LazyVGrid` or custom)
- Add "Skip" and "Save" buttons (both valid choices)
- Implement local-first persistence (save locally, sync to Firestore when online)
- **Acceptance Criteria:**
  - Chips are visually distinct, accessible (VoiceOver, contrast)
  - No forced check-ins (user can skip indefinitely)
  - Multi-select works intuitively
  - Status saves locally immediately, syncs when online

**2.9 Status History View (Optional)** (Small - 4 hours)
- Create simple list view of user's own status history (private, not shared)
- Allow deletion of past statuses
- **Acceptance Criteria:**
  - Only user sees their own history
  - User can delete any past status
  - No analytics or patterns shown

**2.10 Partner Status View** (Medium - 1 day)
- Build partner-facing screen showing derived message (not raw chips)
- Add "Show Care" primary CTA
- Implement real-time updates when partner updates status
- **Acceptance Criteria:**
  - Partner never sees raw chips or medical data
  - Message updates automatically when partner changes status
  - Screen is hidden if partner hasn't shared (no empty states with pressure)

### Sprint 4: Care Actions & SOS (Week 2-3)
**Goal:** Partner can respond with care actions; user can trigger SOS

#### Tasks:

**2.11 Care Actions UI & Logic** (Large - 2 days)
- Build "Show Care" screen with 4 actions: Text, Voice Note, FaceTime Schedule, Virtual Hug
- Implement action sending (write to Firestore, trigger notification)
- Create action receipt UI (gentle notification, in-app display)
- **Acceptance Criteria:**
  - All actions are optional (no pressure)
  - Actions feel personal, not transactional
  - Voice notes use native iOS recording (AVFoundation)
  - FaceTime links use native `facetime://` URL scheme

**2.12 Comfort SOS Feature** (Medium - 1 day)
- Build SOS button (subtle, accessible but not alarming)
- Implement high-priority notification (bypasses throttling)
- Add optional FaceTime link to SOS notification
- Implement rate limiting (max 3 SOS per 24 hours)
- **Acceptance Criteria:**
  - SOS feels urgent but not panicked (no red alarms, loud sounds)
  - Notification delivers immediately to partner
  - Rate limiting prevents abuse
  - User can cancel SOS within 30 seconds

**2.13 Notification System Integration** (Medium - 1 day)
- Integrate FCM push notifications
- Implement local notification scheduling for gentle reminders (if enabled)
- Create notification handler to deep-link to relevant screens
- **Acceptance Criteria:**
  - Notifications respect user preferences
  - Deep links work correctly
  - Local notifications can be disabled in settings

### Sprint 5: Period Calendar (Optional) (Week 3)
**Goal:** Optional manual period calendar with one-time sharing notification

#### Tasks:

**2.14 Period Calendar UI** (Medium - 1 day)
- Build minimal calendar input screen (manual date/time entry only)
- Add "Share with Partner" toggle (default OFF)
- Implement single notification when sharing is enabled
- **Acceptance Criteria:**
  - No automatic predictions or suggestions
  - User manually enters start date/time
  - Sharing sends one notification, then silent
  - User can disable sharing anytime

**2.15 Calendar Data Model & Sharing Logic** (Small - 4 hours)
- Implement Firestore schema for period calendar
- Create Cloud Function for sharing notification (one-time, gentle)
- Add privacy rules (partner only sees "started sharing" notification, not dates)
- **Acceptance Criteria:**
  - Calendar data only readable by owner
  - Sharing notification is human-friendly, not clinical
  - Partner cannot see future dates or patterns

### Sprint 6: Gentle Days Mode & Polish (Week 3)
**Goal:** Mood-aware UI tweaks and final polish

#### Tasks:

**2.16 Gentle Days Mode (Mood-Aware UI)** (Medium - 1 day)
- Implement subtle color overlay (when status indicates need for care)
- Reduce animation intensity in sensitive states
- Add accessibility enhancements (larger touch targets, higher contrast)
- **Acceptance Criteria:**
  - Changes are subtle, not jarring
  - Mode can be disabled in settings
  - Accessibility improvements benefit all users

**2.17 Localization Prep** (Small - 4 hours)
- Extract all UI strings to Localizable.strings
- Create sample translations for 2-3 languages (Spanish, French)
- Test string formatting with long translations
- **Acceptance Criteria:**
  - All user-facing text is localizable
  - No hardcoded strings in Swift code
  - Translations maintain warm tone

**2.18 QA & Edge Case Handling** (Large - 2 days)
- Test all privacy scenarios (decline, revoke, partner not in app)
- Test offline behavior (local persistence, sync on reconnect)
- Test notification throttling and rate limiting
- Test accessibility (VoiceOver, Dynamic Type, contrast)
- **Acceptance Criteria:**
  - All edge cases handled gracefully
  - No crashes or data loss in offline scenarios
  - Privacy rules enforced correctly
  - Accessibility standards met (WCAG AA)

### Summary Estimates:
- **Total Sprint Duration:** 2-3 weeks (assuming 1-2 iOS engineers, 1 backend engineer, 1 designer)
- **Total Story Points:** ~35-40 points (using Fibonacci: Tiny=1, Small=2, Medium=5, Large=8)
- **Assumptions:**
  - Team familiar with SwiftUI, Firebase, Cloud Functions
  - Existing app infrastructure (auth, pairs, notifications) in place
  - Designer available for onboarding screens and primary check-in UI
  - CI/CD pipeline exists for testing and deployment

---

## 3. Onboarding & Permission Flow (First-Launch UX)

### 3.1 Onboarding Screen Sequence

**Screen 1: Introduction (Optional Feature Discovery)**
- **Wireframe Description:**
  - Centered illustration/icon (soft, warm style—no medical imagery)
  - Headline: "Gentle Days" (large, friendly font)
  - Body text (2-3 sentences, see Copy Style Guide)
  - Primary CTA: "Learn More" (leads to next screen)
  - Secondary CTA: "Skip for now" (dismisses, feature remains accessible)
- **State Examples:**
  - Default: Both buttons visible
  - After "Skip": Feature accessible via Settings, no onboarding shown again
  - After "Learn More": Proceed to Screen 2
- **Copy:**
  - Headline: "Gentle Days"
  - Body: "An optional way to share how you're feeling and receive care from your partner. Everything is private by default, and you choose what to share. No pressure, no tracking—just connection when you need it."
  - Primary: "Learn More"
  - Secondary: "Skip for now"

**Screen 2: Permissions & Choices**
- **Wireframe Description:**
  - Section header: "What would you like to share?"
  - Toggle 1: "Share how I'm feeling" (default: OFF)
    - Subtext: "Your partner will see a gentle message when you check in"
  - Toggle 2: "Share period calendar" (default: OFF)
    - Subtext: "Partner gets one notification when you start sharing"
  - Toggle 3: "Gentle reminders" (default: OFF)
    - Subtext: "Optional daily reminder to check in (only if you want)"
  - Info text: "You can change these anytime in Settings"
  - Primary CTA: "Done" (saves preferences, completes onboarding)
  - Secondary CTA: "Skip for now" (saves all OFF, completes onboarding)
- **State Examples:**
  - All toggles OFF by default
  - User can toggle any combination ON/OFF
  - "Done" saves current state to Firestore
  - "Skip for now" saves all OFF, no error state
- **Copy:**
  - Header: "What would you like to share?"
  - Toggle 1 label: "Share how I'm feeling"
  - Toggle 1 subtext: "Your partner will see a gentle message when you check in"
  - Toggle 2 label: "Share period calendar"
  - Toggle 2 subtext: "Partner gets one notification when you start sharing"
  - Toggle 3 label: "Gentle reminders"
  - Toggle 3 subtext: "Optional daily reminder to check in (only if you want)"
  - Info: "You can change these anytime in Settings"
  - Primary: "Done"
  - Secondary: "Skip for now"

**Screen 3: Completion (Optional, shown only if user enabled something)**
- **Wireframe Description:**
  - Checkmark icon or gentle animation
  - Headline: "You're all set"
  - Body text: "Gentle Days is ready when you need it. Check in anytime, or skip—it's up to you."
  - Primary CTA: "Get Started" (dismisses onboarding, opens main app)
- **State Examples:**
  - Only shown if user enabled at least one toggle
  - If user skipped everything, go directly to main app (no completion screen)
- **Copy:**
  - Headline: "You're all set"
  - Body: "Gentle Days is ready when you need it. Check in anytime, or skip—it's up to you."
  - Primary: "Get Started"

### 3.2 Behavior Rules & Edge Cases

**Defaults (All OFF):**
- Status sharing: OFF
- Calendar sharing: OFF
- Notifications: OFF
- Partner visibility: Nothing shared

**User Declines Everything:**
- Onboarding completes successfully
- Feature remains accessible via Settings
- No error states or pressure to enable
- User can enable later with same onboarding flow

**User Revokes Sharing Later:**
- Settings screen: Toggle OFF → Immediate Firestore update
- Partner's view: Status/calendar disappears (no notification about revocation)
- User's data: Remains in Firestore (user-owned), just not visible to partner
- User can re-enable anytime (no cooldown or restrictions)

**Partner Not in App:**
- If partner hasn't accepted pair invitation:
  - User can still enable Gentle Days settings
  - Status updates save locally and to Firestore
  - When partner joins, they see current state (if sharing enabled)
  - No errors or blocking states

**Partner Disables Feature:**
- If partner disables Gentle Days:
  - User's sharing continues to work (one-way is fine)
  - User won't receive care actions (partner can't send)
  - No notifications or alerts about partner's status

---

## 4. Primary Screen: "How are you feeling today?"

### 4.1 UI Layout & Microcopy

**Screen Structure:**
```
┌─────────────────────────────┐
│  [Back]        Gentle Days  │
├─────────────────────────────┤
│                             │
│   How are you               │
│   feeling today?            │
│                             │
│   ┌─────┐ ┌─────┐ ┌─────┐  │
│   │tender│ │calm │ │tired│  │
│   └─────┘ └─────┘ └─────┘  │
│                             │
│   ┌─────────┐ ┌─────────┐  │
│   │needing  │ │extra    │  │
│   │space    │ │love     │  │
│   └─────────┘ └─────────┘  │
│                             │
│   [Selected: tender, calm]  │
│                             │
│   ┌─────────────────────┐  │
│   │     Save            │  │
│   └─────────────────────┘  │
│                             │
│   [Skip]                    │
│                             │
└─────────────────────────────┘
```

**Chip Options (Complete List):**
1. "tender"
2. "calm"
3. "tired"
4. "needing space"
5. "extra love today"
6. "fragile"
7. "grateful"
8. "anxious"
9. "peaceful"
10. "sensitive"
11. "content"
12. "overwhelmed"

**Microcopy:**
- Screen title: "Gentle Days"
- Question: "How are you feeling today?"
- Selected indicator: "Selected: [chip1], [chip2]" (shown only when chips selected)
- Save button: "Save" (or "Update" if status exists today)
- Skip button: "Skip" (always available, no pressure)
- Empty state (if no selection): "No selection" (shown only when viewing, not required)

### 4.2 Rules & Behavior

**Selection Rules:**
- Optional: User can skip entirely (no forced check-ins)
- Multi-select: User can select 0, 1, or multiple chips
- No streaks: No badges, rewards, or "X day streak" messaging
- No reminders unless explicitly enabled in settings
- Daily: User can update status multiple times per day (latest overwrites)

**State Management:**
- Local-first: Selection saved to UserDefaults immediately
- Firestore sync: Writes to Firestore when online (background sync)
- Offline: Works offline, syncs when connection restored
- Today's status: Only one status document per user per day (overwrites previous)

**Partner Visibility:**
- If sharing enabled: Partner sees derived message (see Section 5)
- If sharing disabled: Partner sees nothing (screen hidden or shows "Partner hasn't shared")
- Real-time: Partner's view updates automatically when status changes

### 4.3 SwiftUI Components & Property Structs

**Status Chip Model:**
```swift
struct FeelingChip: Identifiable, Hashable {
    let id: String
    let label: String
    let emoji: String? // Optional emoji for visual clarity
    
    static let allChips: [FeelingChip] = [
        FeelingChip(id: "tender", label: "tender", emoji: "💜"),
        FeelingChip(id: "calm", label: "calm", emoji: "☁️"),
        FeelingChip(id: "tired", label: "tired", emoji: "😴"),
        FeelingChip(id: "needing_space", label: "needing space", emoji: "🌙"),
        FeelingChip(id: "extra_love", label: "extra love today", emoji: "💕"),
        FeelingChip(id: "fragile", label: "fragile", emoji: "🦋"),
        FeelingChip(id: "grateful", label: "grateful", emoji: "🙏"),
        FeelingChip(id: "anxious", label: "anxious", emoji: "🌀"),
        FeelingChip(id: "peaceful", label: "peaceful", emoji: "🕊️"),
        FeelingChip(id: "sensitive", label: "sensitive", emoji: "🌺"),
        FeelingChip(id: "content", label: "content", emoji: "✨"),
        FeelingChip(id: "overwhelmed", label: "overwhelmed", emoji: "🌊")
    ]
}
```

**Status Model:**
```swift
struct GentleDaysStatus: Codable, Identifiable {
    let id: String?
    let userId: String
    let pairId: String
    let selectedChips: [String] // Array of chip IDs
    let timestamp: Date
    let createdAt: Date?
    let updatedAt: Date?
    
    init(userId: String, pairId: String, selectedChips: [String], timestamp: Date = Date()) {
        self.id = nil
        self.userId = userId
        self.pairId = pairId
        self.selectedChips = selectedChips
        self.timestamp = timestamp
        self.createdAt = nil
        self.updatedAt = nil
    }
}
```

**Chip Selector View (SwiftUI):**
```swift
struct FeelingChipSelector: View {
    @Binding var selectedChipIds: Set<String>
    let chips: [FeelingChip]
    
    private let columns = [
        GridItem(.adaptive(minimum: 100), spacing: 12)
    ]
    
    var body: some View {
        LazyVGrid(columns: columns, spacing: 16) {
            ForEach(chips) { chip in
                ChipView(
                    chip: chip,
                    isSelected: selectedChipIds.contains(chip.id)
                )
                .onTapGesture {
                    if selectedChipIds.contains(chip.id) {
                        selectedChipIds.remove(chip.id)
                    } else {
                        selectedChipIds.insert(chip.id)
                    }
                }
            }
        }
    }
}

struct ChipView: View {
    let chip: FeelingChip
    let isSelected: Bool
    
    var body: some View {
        HStack(spacing: 6) {
            if let emoji = chip.emoji {
                Text(emoji)
            }
            Text(chip.label)
                .font(.system(size: 15, weight: .medium))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(isSelected ? Color.accentColor : Color.gray.opacity(0.1))
        .foregroundColor(isSelected ? .white : .primary)
        .cornerRadius(20)
        .accessibilityLabel(chip.label)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}
```

**Main Check-In View (Simplified):**
```swift
struct GentleDaysCheckInView: View {
    @StateObject private var viewModel: GentleDaysCheckInViewModel
    @State private var selectedChipIds: Set<String> = []
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("How are you feeling today?")
                    .font(.title2)
                    .multilineTextAlignment(.center)
                    .padding(.top, 32)
                
                FeelingChipSelector(
                    selectedChipIds: $selectedChipIds,
                    chips: FeelingChip.allChips
                )
                .padding(.horizontal)
                
                if !selectedChipIds.isEmpty {
                    Text("Selected: \(selectedChipIds.map { FeelingChip.allChips.first { $0.id == $1 }?.label ?? $1 }.joined(separator: ", "))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(spacing: 12) {
                    Button("Save") {
                        viewModel.saveStatus(chipIds: Array(selectedChipIds))
                        dismiss()
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(selectedChipIds.isEmpty)
                    
                    Button("Skip") {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                }
                .padding()
            }
            .navigationTitle("Gentle Days")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
```

### 4.4 Local Persistence + Firestore Write Pattern

**Service Layer (Simplified):**
```swift
class GentleDaysService {
    private let db = Firestore.firestore()
    private let userId: String
    private let pairId: String
    
    func saveStatus(chipIds: [String]) async throws {
        // 1. Save locally first (UserDefaults for immediate feedback)
        let status = GentleDaysStatus(
            userId: userId,
            pairId: pairId,
            selectedChips: chipIds
        )
        
        let encoder = JSONEncoder()
        if let data = try? encoder.encode(status) {
            UserDefaults.standard.set(data, forKey: "gentleDays_status_\(userId)_\(Date().startOfDay)")
        }
        
        // 2. Write to Firestore (with error handling)
        let statusRef = db.collection("gentleDaysStatus")
            .document("\(pairId)_\(userId)_\(Date().startOfDay)")
        
        try await statusRef.setData([
            "userId": userId,
            "pairId": pairId,
            "selectedChips": chipIds,
            "timestamp": Timestamp(date: Date()),
            "updatedAt": FieldValue.serverTimestamp()
        ], merge: true)
        
        // 3. Trigger Cloud Function to generate partner message (via trigger)
        // Cloud Function listens to gentleDaysStatus writes and creates partner message
    }
    
    func getTodayStatus() async throws -> GentleDaysStatus? {
        // Try Firestore first, fallback to local
        let statusRef = db.collection("gentleDaysStatus")
            .document("\(pairId)_\(userId)_\(Date().startOfDay)")
        
        let snapshot = try await statusRef.getDocument()
        if let data = snapshot.data() {
            // Parse and return
            return try parseStatus(from: data)
        }
        
        // Fallback to local
        if let localData = UserDefaults.standard.data(forKey: "gentleDays_status_\(userId)_\(Date().startOfDay)") {
            return try JSONDecoder().decode(GentleDaysStatus.self, from: localData)
        }
        
        return nil
    }
}
```

**Local Persistence Helper:**
```swift
extension Date {
    var startOfDay: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: self)
    }
}
```

---

## 5. Partner View & Privacy Mapping

### 5.1 What Partner Sees and Does NOT See

**Partner CAN See (if sharing enabled):**
- Derived message: Human-friendly sentence generated from chips (e.g., "Feeling tender and needing a bit of space today")
- Timestamp: When status was last updated (relative time: "2 hours ago")
- Care Actions: Ability to send text, voice note, FaceTime link, virtual hug

**Partner CANNOT See:**
- Raw chip IDs or labels (e.g., "tender", "needing_space")
- Medical or clinical data
- Period calendar dates or patterns
- Status history (only current/active status)
- User's settings or preferences
- Whether user enabled/disabled sharing (no revocation notifications)

**Privacy Guarantee:**
- Partner view is read-only (cannot modify user's status)
- Partner messages are derived strings, not raw data
- If user revokes sharing, partner view disappears silently (no notification)

### 5.2 Mapping Logic Table: Chips → Partner Message

**Algorithm:**
1. Sort chips by priority (emotional weight: fragile > anxious > tender > calm, etc.)
2. If single chip: Use simple message template
3. If multiple chips: Combine into natural sentence (use conjunction rules)
4. Apply tone rules (warm, human, never clinical)

**Example Mappings (10+ Examples):**

| Selected Chips | Partner Message |
|----------------|-----------------|
| `["tender"]` | "Feeling tender today" |
| `["tired", "calm"]` | "Feeling tired but calm" |
| `["fragile", "needing_space"]` | "Feeling fragile and needing some space" |
| `["anxious", "overwhelmed"]` | "Feeling anxious and a bit overwhelmed" |
| `["extra_love", "grateful"]` | "Feeling grateful and could use extra love today" |
| `["peaceful", "content"]` | "Feeling peaceful and content" |
| `["sensitive", "tender"]` | "Feeling sensitive and tender" |
| `["calm", "grateful", "content"]` | "Feeling calm, grateful, and content" |
| `["tired", "needing_space"]` | "Feeling tired and needing some space" |
| `["fragile"]` | "Feeling fragile today" |
| `["overwhelmed", "anxious", "tired"]` | "Feeling overwhelmed, anxious, and tired" |

**Cloud Function Implementation (TypeScript):**
```typescript
function generatePartnerMessage(chipIds: string[]): string {
    const chipLabels: Record<string, string> = {
        "tender": "tender",
        "calm": "calm",
        "tired": "tired",
        "needing_space": "needing some space",
        "extra_love": "could use extra love",
        "fragile": "fragile",
        "grateful": "grateful",
        "anxious": "anxious",
        "peaceful": "peaceful",
        "sensitive": "sensitive",
        "content": "content",
        "overwhelmed": "overwhelmed"
    };
    
    const priorityOrder = ["fragile", "overwhelmed", "anxious", "needing_space", "tired", "sensitive", "tender", "extra_love", "grateful", "calm", "peaceful", "content"];
    
    // Sort by priority
    const sorted = chipIds.sort((a, b) => {
        const aIdx = priorityOrder.indexOf(a);
        const bIdx = priorityOrder.indexOf(b);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
    
    const labels = sorted.map(id => chipLabels[id] || id).filter(Boolean);
    
    if (labels.length === 0) return "Shared how they're feeling";
    if (labels.length === 1) return `Feeling ${labels[0]} today`;
    if (labels.length === 2) {
        // Special conjunctions
        if (labels[0].includes("overwhelmed") || labels[0].includes("anxious")) {
            return `Feeling ${labels[0]} and ${labels[1]}`;
        }
        return `Feeling ${labels[0]} and ${labels[1]}`;
    }
    
    // 3+ chips: Use commas and "and"
    const last = labels.pop();
    return `Feeling ${labels.join(", ")}, and ${last}`;
}
```

### 5.3 Partner-Side "Show Care" CTA and Options

**Screen Layout:**
```
┌─────────────────────────────┐
│  [Back]        Gentle Days  │
├─────────────────────────────┤
│                             │
│   Your partner is           │
│   feeling tender and        │
│   needing some space        │
│                             │
│   Updated 2 hours ago       │
│                             │
│   ┌─────────────────────┐  │
│   │   Show Care         │  │
│   └─────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**"Show Care" Actions Menu:**
```
┌─────────────────────────────┐
│        Show Care            │
├─────────────────────────────┤
│                             │
│   💬 Send a Message         │
│                             │
│   🎤 Send a Voice Note      │
│                             │
│   📞 Schedule FaceTime      │
│                             │
│   🤗 Send Virtual Hug       │
│                             │
│   [Cancel]                  │
│                             │
└─────────────────────────────┘
```

**Example UX Flow:**
1. Partner sees derived message
2. Taps "Show Care"
3. Action sheet appears with 4 options
4. Partner selects action (e.g., "Send a Message")
5. UI opens appropriate interface (text input, recording, calendar picker, confirmation)
6. Action sends → User receives notification (if enabled) and in-app notification
7. User can view/reply to action

**Copy for Actions:**
- Primary CTA: "Show Care"
- Action 1: "Send a Message"
- Action 2: "Send a Voice Note"
- Action 3: "Schedule FaceTime"
- Action 4: "Send Virtual Hug"
- Cancel: "Cancel"

---

## 6. Notifications & Cloud Functions

### 6.1 Notification Strategy

**General Rules:**
- Max 1-2 gentle notifications per day (throttled)
- Notifications use warm, human tone (see Copy Style Guide)
- No urgent/alarming language (except SOS, which is urgent but gentle)
- User can disable all notifications in settings

**Notification Types:**
1. **Status Update Notification** (to partner)
   - Trigger: User updates status (if sharing enabled)
   - Throttle: Max 1 per day per user
   - Priority: Normal
   - Example: "Your partner shared how they're feeling today"

2. **Care Action Notification** (to user)
   - Trigger: Partner sends care action
   - Throttle: None (immediate, but max 5 per hour per partner)
   - Priority: Normal
   - Example: "Your partner sent you a virtual hug 💜"

3. **SOS Notification** (to partner)
   - Trigger: User triggers SOS
   - Throttle: Bypasses throttling, but rate-limited (max 3 per 24 hours)
   - Priority: High (but gentle tone)
   - Example: "Your partner needs you right now"

4. **Calendar Sharing Notification** (to partner, one-time)
   - Trigger: User enables calendar sharing
   - Throttle: One-time only (never repeats)
   - Priority: Normal
   - Example: "Your partner started sharing their calendar"

**Example Payloads (FCM):**
```typescript
// Status Update
{
    notification: {
        title: "Gentle Days",
        body: "Your partner shared how they're feeling today"
    },
    data: {
        type: "gentleDays_status",
        pairId: "pair_123",
        userId: "user_456",
        deepLink: "gentledays://partner-status"
    },
    apns: {
        payload: {
            aps: {
                sound: "default",
                badge: 1
            }
        }
    }
}

// SOS
{
    notification: {
        title: "Your partner needs you",
        body: "They're reaching out for comfort right now"
    },
    data: {
        type: "gentleDays_sos",
        pairId: "pair_123",
        userId: "user_456",
        deepLink: "gentledays://sos",
        facetimeLink: "facetime://user@example.com" // Optional
    },
    apns: {
        payload: {
            aps: {
                sound: "default",
                badge: 1,
                priority: 10 // High priority
            }
        }
    }
}
```

### 6.2 Throttling Logic (Cloud Function)

**Implementation:**
```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface NotificationLog {
    userId: string;
    pairId: string;
    type: "status" | "care" | "sos" | "calendar";
    timestamp: admin.firestore.Timestamp;
    sent: boolean;
}

async function shouldThrottle(
    userId: string,
    pairId: string,
    type: "status" | "care" | "sos" | "calendar"
): Promise<boolean> {
    const now = admin.firestore.Timestamp.now();
    const oneDayAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);
    
    // SOS: Rate limit to 3 per 24 hours (but don't throttle immediate sends)
    if (type === "sos") {
        const sosLogs = await db.collection("notificationLogs")
            .where("userId", "==", userId)
            .where("pairId", "==", pairId)
            .where("type", "==", "sos")
            .where("timestamp", ">", oneDayAgo)
            .get();
        
        return sosLogs.size >= 3;
    }
    
    // Status: Max 1 per day
    if (type === "status") {
        const statusLogs = await db.collection("notificationLogs")
            .where("userId", "==", userId)
            .where("pairId", "==", pairId)
            .where("type", "==", "status")
            .where("timestamp", ">", oneDayAgo)
            .get();
        
        return statusLogs.size >= 1;
    }
    
    // Care actions: Max 5 per hour (but allow immediate, throttle only bursts)
    if (type === "care") {
        const oneHourAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 60 * 60 * 1000);
        const careLogs = await db.collection("notificationLogs")
            .where("userId", "==", userId)
            .where("pairId", "==", pairId)
            .where("type", "==", "care")
            .where("timestamp", ">", oneHourAgo)
            .get();
        
        return careLogs.size >= 5;
    }
    
    // Calendar: One-time only (check if already sent)
    if (type === "calendar") {
        const calendarLogs = await db.collection("notificationLogs")
            .where("userId", "==", userId)
            .where("pairId", "==", pairId)
            .where("type", "==", "calendar")
            .get();
        
        return calendarLogs.size >= 1;
    }
    
    return false;
}

async function logNotification(
    userId: string,
    pairId: string,
    type: "status" | "care" | "sos" | "calendar",
    sent: boolean
): Promise<void> {
    await db.collection("notificationLogs").add({
        userId,
        pairId,
        type,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        sent
    } as NotificationLog);
}

// Cloud Function: Triggered on status write
export const onGentleDaysStatusUpdate = functions.firestore
    .document("gentleDaysStatus/{statusId}")
    .onWrite(async (change, context) => {
        const statusData = change.after.data();
        if (!statusData) return; // Deleted
        
        const userId = statusData.userId;
        const pairId = statusData.pairId;
        
        // Get partner ID
        const pairDoc = await db.collection("pairs").doc(pairId).get();
        const pair = pairDoc.data();
        if (!pair) return;
        
        const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
        if (!partnerId) return;
        
        // Check if sharing is enabled
        const settingsDoc = await db.collection("gentleDaysSettings")
            .doc(`${pairId}_${userId}`)
            .get();
        const settings = settingsDoc.data();
        if (!settings || !settings.shareStatus) return;
        
        // Generate partner message
        const chips = statusData.selectedChips || [];
        const partnerMessage = generatePartnerMessage(chips);
        
        // Save partner message (partner can read this)
        await db.collection("gentleDaysPartnerMessages")
            .doc(`${pairId}_${partnerId}`)
            .set({
                partnerUserId: userId,
                message: partnerMessage,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        
        // Check throttling
        const shouldThrottleNotif = await shouldThrottle(userId, pairId, "status");
        if (!shouldThrottleNotif) {
            // Send notification
            const partnerFCMToken = await getFCMToken(partnerId);
            if (partnerFCMToken) {
                await admin.messaging().send({
                    token: partnerFCMToken,
                    notification: {
                        title: "Gentle Days",
                        body: "Your partner shared how they're feeling today"
                    },
                    data: {
                        type: "gentleDays_status",
                        pairId,
                        userId,
                        deepLink: "gentledays://partner-status"
                    }
                });
                
                await logNotification(userId, pairId, "status", true);
            }
        } else {
            await logNotification(userId, pairId, "status", false);
        }
    });
```

### 6.3 Trigger Points

**Cloud Function Triggers:**
1. `onGentleDaysStatusUpdate` — Triggered on write to `gentleDaysStatus/{statusId}`
   - Generates partner message
   - Sends notification (if throttling allows)
   - Updates `gentleDaysPartnerMessages` collection

2. `onCareActionSent` — Triggered on write to `careActions/{actionId}`
   - Sends notification to recipient
   - Logs notification

3. `onSOSTriggered` — Triggered on write to `gentleDaysStatus/{statusId}` where `sos: true`
   - Sends high-priority notification
   - Bypasses throttling (but respects rate limits)

4. `onCalendarSharingEnabled` — Triggered on write to `gentleDaysSettings/{settingsId}` where `shareCalendar: true` (first time)
   - Sends one-time notification to partner
   - Marks as sent (prevents duplicates)

### 6.4 Priority and Text Templates

**Notification Templates (Gentle Tone):**

**Status Update:**
- Title: "Gentle Days"
- Body: "Your partner shared how they're feeling today"

**Care Action (Text):**
- Title: "Gentle Days"
- Body: "Your partner sent you a message 💜"

**Care Action (Voice Note):**
- Title: "Gentle Days"
- Body: "Your partner sent you a voice note 💜"

**Care Action (FaceTime):**
- Title: "Gentle Days"
- Body: "Your partner wants to schedule a FaceTime call 💜"

**Care Action (Virtual Hug):**
- Title: "Gentle Days"
- Body: "Your partner sent you a virtual hug 💜"

**SOS:**
- Title: "Your partner needs you"
- Body: "They're reaching out for comfort right now"

**Calendar Sharing:**
- Title: "Gentle Days"
- Body: "Your partner started sharing their calendar"

---

## 7. Care Actions (Partner-Side UI)

### 7.1 Primary CTA and Available Actions

**Primary CTA: "Show Care"**
- Location: Partner status view (see Section 5.3)
- Style: Primary button (prominent, accessible)
- Behavior: Opens action sheet with 4 options

**Available Actions:**
1. **Send a Message** — Text message sent to user
2. **Send a Voice Note** — Audio recording sent to user
3. **Schedule FaceTime** — Calendar invitation with FaceTime link
4. **Send Virtual Hug** — Simple gesture/notification

### 7.2 Sample UI Flow for Each Action

**Send a Message:**
```
1. Partner taps "Show Care" → Action sheet appears
2. Partner selects "Send a Message"
3. Text input modal appears (with character limit: 500 chars)
4. Partner types message, taps "Send"
5. Message writes to Firestore: careActions/{actionId}
6. User receives notification (if enabled)
7. User can view message in-app (gentle notification banner)
```

**Send a Voice Note:**
```
1. Partner taps "Send a Voice Note"
2. Recording UI appears (record button, timer, stop button)
3. Partner records (max 60 seconds)
4. Recording saves to Firebase Storage (path: careActions/{actionId}/voice.m4a)
5. Firestore document created with audio URL
6. User receives notification with playback UI
7. User can play voice note in-app
```

**Schedule FaceTime:**
```
1. Partner taps "Schedule FaceTime"
2. Date/time picker appears (future dates only)
3. Partner selects date/time, taps "Schedule"
4. Firestore document created with FaceTime link (facetime:// URL)
5. User receives notification with calendar deep link
6. User can add to calendar or open FaceTime directly
```

**Send Virtual Hug:**
```
1. Partner taps "Send Virtual Hug"
2. Confirmation: "Send a virtual hug?" (optional, can auto-send)
3. Firestore document created (type: "virtual_hug")
4. User receives gentle notification: "Your partner sent you a virtual hug 💜"
5. Optional: Gentle animation in-app (subtle, not jarring)
```

### 7.3 Example Short Copy for Each Action

**Send a Message:**
- Button: "Send a Message"
- Input placeholder: "Share your care..."
- Send button: "Send"
- Success: "Message sent"

**Send a Voice Note:**
- Button: "Send a Voice Note"
- Recording prompt: "Tap to record (up to 60 seconds)"
- Stop button: "Stop"
- Send button: "Send"
- Success: "Voice note sent"

**Schedule FaceTime:**
- Button: "Schedule FaceTime"
- Date picker label: "When would you like to connect?"
- Schedule button: "Schedule"
- Success: "FaceTime scheduled"

**Send Virtual Hug:**
- Button: "Send Virtual Hug"
- Confirmation (optional): "Send a virtual hug?"
- Send button: "Send"
- Success: "Virtual hug sent"

### 7.4 Minimal Firestore Writes

**Care Action Document Structure:**
```typescript
{
    id: string; // Auto-generated
    pairId: string;
    fromUserId: string; // Partner who sent
    toUserId: string; // User who receives
    type: "message" | "voice_note" | "facetime" | "virtual_hug";
    content: string; // Text message OR voice note URL OR FaceTime link OR empty for hug
    metadata?: {
        scheduledDate?: Timestamp; // For FaceTime
        voiceDuration?: number; // For voice note (seconds)
    };
    createdAt: Timestamp;
    readAt?: Timestamp; // When user views it
}
```

**Swift Service Method:**
```swift
func sendCareAction(
    toUserId: String,
    type: CareActionType,
    content: String?,
    metadata: [String: Any]? = nil
) async throws {
    let actionRef = db.collection("careActions").document()
    
    try await actionRef.setData([
        "pairId": pairId,
        "fromUserId": userId,
        "toUserId": toUserId,
        "type": type.rawValue,
        "content": content ?? "",
        "metadata": metadata ?? [:],
        "createdAt": FieldValue.serverTimestamp()
    ])
    
    // Cloud Function triggers notification (see Section 6)
}
```

---

## 8. Gentle Days Mode (Mood-Aware UI Behavior)

### 8.1 Concrete Design Tweaks

**Color Overlays:**
- When status includes "fragile", "overwhelmed", or "sensitive":
  - Subtle warm overlay (5-10% opacity, soft pink/rose)
  - Applied to entire app UI (optional, can be disabled)
  - Smooth fade-in/fade-out (no jarring transitions)

**Reduced Animation Intensity:**
- When status indicates need for care:
  - Reduce spring animation damping (less bouncy)
  - Slow down transition animations (0.3s → 0.5s)
  - Disable haptic feedback on interactions (optional)
  - Reduce parallax effects

**Accessibility Enhancements:**
- Larger touch targets (44pt minimum, increase to 48pt)
- Higher contrast ratios (WCAG AA minimum)
- Reduced motion support (respects iOS "Reduce Motion" setting)
- VoiceOver improvements (clearer labels, better navigation)

### 8.2 Implementation in SwiftUI

**Theme Modifiers:**
```swift
struct GentleDaysTheme: ViewModifier {
    let isActive: Bool
    let overlayOpacity: Double = 0.08
    
    func body(content: Content) -> some View {
        content
            .overlay(
                isActive ? Color.pink.opacity(overlayOpacity) : Color.clear
            )
            .animation(.easeInOut(duration: 0.5), value: isActive)
    }
}

extension View {
    func gentleDaysMode(isActive: Bool) -> some View {
        modifier(GentleDaysTheme(isActive: isActive))
    }
}
```

**Environment Values:**
```swift
struct GentleDaysModeKey: EnvironmentKey {
    static let defaultValue: Bool = false
}

extension EnvironmentValues {
    var gentleDaysMode: Bool {
        get { self[GentleDaysModeKey.self] }
        set { self[GentleDaysModeKey.self] = newValue }
    }
}

// Usage in ViewModel
@Published var isGentleDaysModeActive: Bool = false

// In View
.environment(\.gentleDaysMode, viewModel.isGentleDaysModeActive)
```

**Animation Modifiers:**
```swift
struct ReducedAnimationModifier: ViewModifier {
    @Environment(\.gentleDaysMode) var gentleDaysMode
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    
    func body(content: Content) -> some View {
        content
            .animation(
                (gentleDaysMode || reduceMotion) ? .easeInOut(duration: 0.5) : .spring(response: 0.4, dampingFraction: 0.8),
                value: /* state */
            )
    }
}
```

**Accessibility Improvements:**
```swift
struct GentleDaysAccessibility: ViewModifier {
    func body(content: Content) -> some View {
        content
            .accessibilityLabel(/* improved labels */)
            .accessibilityHint(/* helpful hints */)
            .minimumScaleFactor(0.9) // Better text scaling
    }
}
```

**Settings Toggle:**
- Settings screen: "Gentle Days Mode" toggle (default: ON, user can disable)
- When disabled: No overlays, animations, or accessibility tweaks

---

## 9. Comfort SOS (Private & Immediate)

### 9.1 UX Rules, Copy, and Behavior

**SOS Button:**
- Location: Primary check-in screen (subtle, not prominent)
- Style: Secondary button ("I need you" or "SOS" label, soft color—not red)
- Accessibility: VoiceOver label: "Comfort SOS, tap to reach out to your partner"

**UX Flow:**
```
1. User taps SOS button
2. Confirmation dialog: "Reach out to your partner?" (optional, can auto-send)
3. If confirmed (or auto-send):
   - Firestore document created: gentleDaysStatus/{statusId} with sos: true
   - Cloud Function triggers high-priority notification
   - Partner receives notification immediately (bypasses throttling)
   - User sees confirmation: "Reached out to your partner"
4. Optional: 30-second cancel window (if user changes mind)
```

**Copy:**
- Button label: "I need you" (preferred) or "SOS" (alternative)
- Confirmation: "Reach out to your partner?"
- Send button: "Yes, reach out"
- Cancel button: "Cancel"
- Success: "Reached out to your partner"
- Cancel window: "Tap to cancel" (shown for 30 seconds)

**Behavior Rules:**
- High priority: Notification delivers immediately (no throttling)
- Rate limiting: Max 3 SOS per 24 hours (prevents abuse)
- Gentle tone: Notification uses warm language (not alarming)
- Optional FaceTime link: Include in notification if user's FaceTime is available
- Private: Only partner receives notification (no public alerts)

### 9.2 Implementation Notes: Urgency vs Alarm

**Urgency (High Priority, Gentle Tone):**
- Notification priority: High (delivers immediately)
- Sound: Default iOS notification sound (not loud alarm)
- Visual: Standard notification banner (not red/alert style)
- Tone: "Your partner needs you right now" (warm, not panicked)

**No Panic Colors or Loud Alarms:**
- Button color: Soft purple/pink (not red)
- No flashing or jarring animations
- No loud alarm sounds
- No emergency-style UI

**Rate Limiting Implementation:**
```swift
func triggerSOS() async throws -> Bool {
    // Check rate limit (3 per 24 hours)
    let oneDayAgo = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
    let recentSOS = try await db.collection("gentleDaysStatus")
        .whereField("userId", isEqualTo: userId)
        .whereField("pairId", isEqualTo: pairId)
        .whereField("sos", isEqualTo: true)
        .whereField("timestamp", isGreaterThan: Timestamp(date: oneDayAgo))
        .getDocuments()
    
    if recentSOS.documents.count >= 3 {
        throw GentleDaysError.rateLimitExceeded("Maximum 3 SOS per day")
    }
    
    // Create SOS status
    let sosRef = db.collection("gentleDaysStatus").document()
    try await sosRef.setData([
        "userId": userId,
        "pairId": pairId,
        "sos": true,
        "timestamp": FieldValue.serverTimestamp()
    ])
    
    return true
}
```

### 9.3 Security and Rate-Limit Rules

**Security:**
- Only user can trigger their own SOS (validated via `userId` in Firestore rules)
- Partner cannot trigger SOS on behalf of user
- SOS data is private (only partner receives notification)

**Rate Limits:**
- Max 3 SOS per 24 hours per user (enforced in Cloud Function and client)
- Rate limit error: "You've reached the daily limit. Please wait before sending another SOS."
- Rate limit resets at midnight (user's local time)

**Cloud Function Rate Limit Check:**
```typescript
async function checkSOSRateLimit(userId: string, pairId: string): Promise<boolean> {
    const oneDayAgo = admin.firestore.Timestamp.fromMillis(
        Date.now() - 24 * 60 * 60 * 1000
    );
    
    const sosLogs = await db.collection("gentleDaysStatus")
        .where("userId", "==", userId)
        .where("pairId", "==", pairId)
        .where("sos", "==", true)
        .where("timestamp", ">", oneDayAgo)
        .get();
    
    return sosLogs.size < 3;
}
```

---

## 10. Period Calendar (Optional, Manual)

### 10.1 Minimal UI for Manual Start Date/Time Entry

**Screen Layout:**
```
┌─────────────────────────────┐
│  [Back]    Period Calendar  │
├─────────────────────────────┤
│                             │
│   Start Date                │
│   ┌─────────────────────┐  │
│   │  [Date Picker]      │  │
│   └─────────────────────┘  │
│                             │
│   Start Time (optional)     │
│   ┌─────────────────────┐  │
│   │  [Time Picker]      │  │
│   └─────────────────────┘  │
│                             │
│   ☐ Share with Partner     │
│     (Partner gets one       │
│      notification when      │
│      you start sharing)     │
│                             │
│   ┌─────────────────────┐  │
│   │      Save           │  │
│   └─────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**UI Components:**
- Date picker: Native iOS `DatePicker` (style: `.compact` or `.graphical`)
- Time picker: Optional, native iOS `DatePicker` (mode: `.time`)
- Toggle: "Share with Partner" (default: OFF)
- Info text: "(Partner gets one notification when you start sharing)"
- Save button: Primary button

**Behavior:**
- User manually enters start date/time (no predictions)
- User can enable/disable sharing anytime
- When sharing is enabled for the first time: Partner receives one notification
- When sharing is disabled: Partner view disappears (no notification)
- User can edit/delete entries anytime

### 10.2 Sharing Logic and Single-Notification Behavior

**Sharing Logic:**
- Default: OFF (nothing shared)
- When user enables sharing:
  - Firestore document updated: `gentleDaysSettings/{settingsId}` with `shareCalendar: true`
  - Cloud Function checks if this is the first time (no previous notification)
  - If first time: Sends one notification to partner
  - If not first time: No notification (already sent)
- When user disables sharing:
  - Settings updated: `shareCalendar: false`
  - Partner view disappears (no notification about revocation)

**Single-Notification Implementation:**
```typescript
export const onCalendarSharingEnabled = functions.firestore
    .document("gentleDaysSettings/{settingsId}")
    .onWrite(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();
        
        // Check if sharing was just enabled (changed from false to true)
        if (newData?.shareCalendar === true && oldData?.shareCalendar !== true) {
            const userId = newData.userId;
            const pairId = newData.pairId;
            
            // Get partner ID
            const pairDoc = await db.collection("pairs").doc(pairId).get();
            const pair = pairDoc.data();
            if (!pair) return;
            
            const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
            if (!partnerId) return;
            
            // Check if notification already sent (prevent duplicates)
            const notificationLog = await db.collection("notificationLogs")
                .where("userId", "==", userId)
                .where("pairId", "==", pairId)
                .where("type", "==", "calendar")
                .get();
            
            if (notificationLog.empty) {
                // Send one-time notification
                const partnerFCMToken = await getFCMToken(partnerId);
                if (partnerFCMToken) {
                    await admin.messaging().send({
                        token: partnerFCMToken,
                        notification: {
                            title: "Gentle Days",
                            body: "Your partner started sharing their calendar"
                        },
                        data: {
                            type: "gentleDays_calendar",
                            pairId,
                            userId,
                            deepLink: "gentledays://calendar"
                        }
                    });
                    
                    await logNotification(userId, pairId, "calendar", true);
                }
            }
        }
    });
```

### 10.3 Firestore Schema for periodCalendar

**Collection: `periodCalendar`**

**Document Structure:**
```json
{
    "id": "period_123",
    "userId": "user_456",
    "pairId": "pair_789",
    "startDate": {
        "_seconds": 1704067200,
        "_nanoseconds": 0
    },
    "startTime": {
        "_seconds": 1704067200,
        "_nanoseconds": 0
    },
    "createdAt": {
        "_seconds": 1704067200,
        "_nanoseconds": 0
    },
    "updatedAt": {
        "_seconds": 1704067200,
        "_nanoseconds": 0
    }
}
```

**Swift Model:**
```swift
struct PeriodCalendar: Codable, Identifiable {
    let id: String?
    let userId: String
    let pairId: String
    let startDate: Date
    let startTime: Date? // Optional
    let createdAt: Date?
    let updatedAt: Date?
}
```

**Settings Integration:**
- `gentleDaysSettings/{settingsId}` includes:
  - `shareCalendar: Bool` (default: false)
  - `calendarNotificationSent: Bool` (tracks if one-time notification sent)

---

## 11. Data Model & Firestore Design

### 11.1 Suggested Collections

**Collections:**
1. `gentleDaysSettings` — User preferences and sharing toggles
2. `gentleDaysStatus` — Daily status updates (chips selected)
3. `gentleDaysPartnerMessages` — Derived messages visible to partner (read-only for partner)
4. `periodCalendar` — Manual period calendar entries (private, owner-only)
5. `careActions` — Care actions sent between partners
6. `notificationLogs` — Notification throttling logs (internal, not user-facing)

### 11.2 Example Documents for Each Collection

**Collection: `gentleDaysSettings`**
```
Document ID: {pairId}_{userId}

{
    "userId": "user_123",
    "pairId": "pair_456",
    "shareStatus": true,
    "shareCalendar": false,
    "notificationsEnabled": true,
    "gentleRemindersEnabled": false,
    "gentleDaysModeEnabled": true,
    "createdAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "updatedAt": { "_seconds": 1704067200, "_nanoseconds": 0 }
}
```

**Collection: `gentleDaysStatus`**
```
Document ID: {pairId}_{userId}_{YYYY-MM-DD}

{
    "userId": "user_123",
    "pairId": "pair_456",
    "selectedChips": ["tender", "needing_space"],
    "sos": false,
    "timestamp": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "createdAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "updatedAt": { "_seconds": 1704067200, "_nanoseconds": 0 }
}
```

**Collection: `gentleDaysPartnerMessages`**
```
Document ID: {pairId}_{partnerUserId}

{
    "partnerUserId": "user_123", // The user who shared
    "pairId": "pair_456",
    "message": "Feeling tender and needing some space",
    "timestamp": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "updatedAt": { "_seconds": 1704067200, "_nanoseconds": 0 }
}
```

**Collection: `periodCalendar`**
```
Document ID: {pairId}_{userId}_{entryId}

{
    "userId": "user_123",
    "pairId": "pair_456",
    "startDate": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "startTime": { "_seconds": 1704067200, "_nanoseconds": 0 }, // Optional
    "createdAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "updatedAt": { "_seconds": 1704067200, "_nanoseconds": 0 }
}
```

**Collection: `careActions`**
```
Document ID: {auto-generated}

{
    "pairId": "pair_456",
    "fromUserId": "user_789", // Partner who sent
    "toUserId": "user_123", // User who receives
    "type": "message" | "voice_note" | "facetime" | "virtual_hug",
    "content": "Thinking of you today 💜", // Text, URL, or empty
    "metadata": {
        "scheduledDate": { "_seconds": 1704067200, "_nanoseconds": 0 }, // For FaceTime
        "voiceDuration": 45 // For voice note (seconds)
    },
    "createdAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "readAt": { "_seconds": 1704067200, "_nanoseconds": 0 } // Optional
}
```

**Collection: `notificationLogs`** (Internal, not user-facing)
```
Document ID: {auto-generated}

{
    "userId": "user_123",
    "pairId": "pair_456",
    "type": "status" | "care" | "sos" | "calendar",
    "timestamp": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "sent": true
}
```

### 11.3 Access Rules

**User Access:**
- User can read/write their own `gentleDaysSettings`
- User can read/write their own `gentleDaysStatus`
- User can read/write their own `periodCalendar`
- User can read `gentleDaysPartnerMessages` for their partner (derived message only)
- User can read/write `careActions` where they are sender or recipient

**Partner Access:**
- Partner can read `gentleDaysPartnerMessages` for their user (derived message only)
- Partner CANNOT read raw `gentleDaysStatus` (no chip data)
- Partner CANNOT read `periodCalendar` (private, owner-only)
- Partner can read/write `careActions` where they are sender or recipient

**Privacy Guarantee:**
- Raw data (chips, calendar dates) only accessible by owner
- Partner sees only derived messages (human-friendly strings)
- All sharing is opt-in (default: nothing shared)

---

## 12. Firestore Security Rules

### 12.1 Concrete Security Rules Snippet

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserPairId() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.pairId;
    }
    
    function isInPair(pairId) {
      return getUserPairId() == pairId;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // gentleDaysSettings: User can read/write their own settings
    match /gentleDaysSettings/{settingsId} {
      allow read, write: if isAuthenticated() 
        && isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.pairId == getUserPairId();
    }
    
    // gentleDaysStatus: User can read/write their own status; partner cannot read raw status
    match /gentleDaysStatus/{statusId} {
      allow read, write: if isAuthenticated() 
        && isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.pairId == getUserPairId();
    }
    
    // gentleDaysPartnerMessages: Partner can read derived message (not raw status)
    match /gentleDaysPartnerMessages/{messageId} {
      allow read: if isAuthenticated() 
        && isInPair(resource.data.pairId);
      allow write: if false; // Only Cloud Functions can write
    }
    
    // periodCalendar: User can read/write their own calendar; partner cannot read
    match /periodCalendar/{calendarId} {
      allow read, write: if isAuthenticated() 
        && isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.pairId == getUserPairId();
    }
    
    // careActions: Users can read/write actions where they are sender or recipient
    match /careActions/{actionId} {
      allow read: if isAuthenticated() 
        && (isOwner(resource.data.fromUserId) || isOwner(resource.data.toUserId));
      allow write: if isAuthenticated() 
        && request.resource.data.pairId == getUserPairId()
        && (request.resource.data.fromUserId == request.auth.uid 
            || request.resource.data.toUserId == request.auth.uid);
    }
    
    // notificationLogs: Internal, no user access
    match /notificationLogs/{logId} {
      allow read, write: if false; // Only Cloud Functions can access
    }
  }
}
```

---

## 13. Cloud Functions & Server Logic

### 13.1 Code Examples (TypeScript)

**Creating Partner-Facing Messages from Chips:**
```typescript
function generatePartnerMessage(chipIds: string[]): string {
    const chipLabels: Record<string, string> = {
        "tender": "tender",
        "calm": "calm",
        "tired": "tired",
        "needing_space": "needing some space",
        "extra_love": "could use extra love",
        "fragile": "fragile",
        "grateful": "grateful",
        "anxious": "anxious",
        "peaceful": "peaceful",
        "sensitive": "sensitive",
        "content": "content",
        "overwhelmed": "overwhelmed"
    };
    
    const priorityOrder = [
        "fragile", "overwhelmed", "anxious", "needing_space", 
        "tired", "sensitive", "tender", "extra_love", 
        "grateful", "calm", "peaceful", "content"
    ];
    
    const sorted = chipIds.sort((a, b) => {
        const aIdx = priorityOrder.indexOf(a);
        const bIdx = priorityOrder.indexOf(b);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
    
    const labels = sorted.map(id => chipLabels[id] || id).filter(Boolean);
    
    if (labels.length === 0) return "Shared how they're feeling";
    if (labels.length === 1) return `Feeling ${labels[0]} today`;
    if (labels.length === 2) return `Feeling ${labels[0]} and ${labels[1]}`;
    
    const last = labels.pop();
    return `Feeling ${labels.join(", ")}, and ${last}`;
}
```

**Notification Throttling and Backoff:**
```typescript
async function shouldThrottle(
    userId: string,
    pairId: string,
    type: "status" | "care" | "sos" | "calendar"
): Promise<boolean> {
    const now = admin.firestore.Timestamp.now();
    const oneDayAgo = admin.firestore.Timestamp.fromMillis(
        now.toMillis() - 24 * 60 * 60 * 1000
    );
    
    if (type === "status") {
        const logs = await db.collection("notificationLogs")
            .where("userId", "==", userId)
            .where("pairId", "==", pairId)
            .where("type", "==", "status")
            .where("timestamp", ">", oneDayAgo)
            .get();
        return logs.size >= 1; // Max 1 per day
    }
    
    if (type === "sos") {
        const logs = await db.collection("notificationLogs")
            .where("userId", "==", userId)
            .where("pairId", "==", pairId)
            .where("type", "==", "sos")
            .where("timestamp", ">", oneDayAgo)
            .get();
        return logs.size >= 3; // Max 3 per day (rate limit, not throttle)
    }
    
    // ... other types
    return false;
}
```

**Sending SOS Notifications:**
```typescript
export const onSOSTriggered = functions.firestore
    .document("gentleDaysStatus/{statusId}")
    .onWrite(async (change, context) => {
        const statusData = change.after.data();
        if (!statusData || !statusData.sos) return;
        
        const userId = statusData.userId;
        const pairId = statusData.pairId;
        
        // Get partner
        const pairDoc = await db.collection("pairs").doc(pairId).get();
        const pair = pairDoc.data();
        if (!pair) return;
        
        const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
        if (!partnerId) return;
        
        // Check rate limit (not throttle - SOS bypasses throttling)
        const rateLimited = await checkSOSRateLimit(userId, pairId);
        if (rateLimited) {
            console.log("SOS rate limit exceeded");
            return;
        }
        
        // Send high-priority notification
        const partnerFCMToken = await getFCMToken(partnerId);
        if (partnerFCMToken) {
            await admin.messaging().send({
                token: partnerFCMToken,
                notification: {
                    title: "Your partner needs you",
                    body: "They're reaching out for comfort right now"
                },
                data: {
                    type: "gentleDays_sos",
                    pairId,
                    userId,
                    deepLink: "gentledays://sos"
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default",
                            priority: 10 // High priority
                        }
                    }
                }
            });
            
            await logNotification(userId, pairId, "sos", true);
        }
    });
```

### 13.2 Where to Place Logic

**Cloud Functions Triggers:**
- `functions/src/index.ts` (or separate file: `functions/src/gentleDays.ts`)

**Trigger Points:**
1. `onGentleDaysStatusUpdate` — `firestore.document("gentleDaysStatus/{statusId}").onWrite`
2. `onCareActionSent` — `firestore.document("careActions/{actionId}").onCreate`
3. `onSOSTriggered` — `firestore.document("gentleDaysStatus/{statusId}").onWrite` (filter by `sos: true`)
4. `onCalendarSharingEnabled` — `firestore.document("gentleDaysSettings/{settingsId}").onWrite` (filter by `shareCalendar: true`)

**Scheduled Jobs (Optional):**
- None required for MVP (all triggers are event-based)

---

## 14. Copy Style Guide (Strict)

### 14.1 Allowed Tone / Disallowed Phrases

**Allowed Tone:**
- Warm, human, empathetic
- Choice-based language ("you can", "if you want", "optional")
- Gentle, supportive
- Personal, intimate (appropriate for couples)

**Disallowed Phrases (Never Use):**
- "tracking", "optimization", "hormonal insights", "analytics"
- "data", "metrics", "patterns", "trends"
- "efficient", "productive", "performance"
- Clinical/medical language ("symptoms", "cycles", "irregular")
- Gamification language ("streak", "achievement", "level up", "points")

### 14.2 Example Messages

**Onboarding:**
- "An optional way to share how you're feeling and receive care from your partner. Everything is private by default, and you choose what to share. No pressure, no tracking—just connection when you need it."

**Chips:**
- "tender", "calm", "tired", "needing space", "extra love today", "fragile", "grateful", "anxious", "peaceful", "sensitive", "content", "overwhelmed"

**Partner Messages:**
- "Feeling tender and needing some space"
- "Feeling calm and content"
- "Feeling fragile today"

**Notifications:**
- "Your partner shared how they're feeling today"
- "Your partner sent you a virtual hug 💜"
- "Your partner needs you right now"

**SOS:**
- "Your partner needs you"
- "They're reaching out for comfort right now"

**Calendar Notification:**
- "Your partner started sharing their calendar"

---

## 15. Accessibility, Privacy & Localization

### 15.1 Accessibility Considerations

**VoiceOver:**
- All interactive elements have clear labels
- Chip buttons: "tender, button, selected" (or "not selected")
- Status updates: "How are you feeling today, question"
- Care actions: "Show care, button"

**Contrast:**
- Text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Chip colors: High contrast when selected
- Overlays: Subtle (low opacity) to not interfere with readability

**Dynamic Type:**
- All text supports iOS Dynamic Type (scales with user settings)
- Chip labels: Minimum font size 15pt (scales up to 34pt)
- Buttons: Minimum 17pt (scales appropriately)

**Reduced Motion:**
- Respects iOS "Reduce Motion" setting
- Animations disabled or simplified when enabled
- No parallax or complex animations

### 15.2 Data Retention and Export Rules

**Data Retention:**
- User data retained until user deletes account or explicitly deletes data
- No automatic deletion (privacy-first: user controls their data)
- Status history: User can delete individual entries anytime

**Data Export:**
- User can export their data (JSON format) via Settings
- Includes: Settings, status history, calendar entries, care actions received
- Does NOT include: Partner's data (only user's own data)

**Deletion:**
- User can delete all Gentle Days data via Settings
- Deletion removes: Settings, status history, calendar entries
- Partner messages: Automatically removed when user deletes data (partner view disappears)

### 15.3 Localization Plan and Sample Keys

**Localization Files:**
- `Localizable.strings` (English)
- `Localizable.strings (Spanish)`
- `Localizable.strings (French)`

**Sample Keys:**
```swift
// English (Localizable.strings)
"gentleDays.title" = "Gentle Days";
"gentleDays.checkIn.question" = "How are you feeling today?";
"gentleDays.chip.tender" = "tender";
"gentleDays.chip.calm" = "calm";
"gentleDays.partner.message.prefix" = "Feeling";
"gentleDays.careActions.showCare" = "Show Care";
"gentleDays.sos.button" = "I need you";
"gentleDays.sos.confirmation" = "Reach out to your partner?";

// Spanish (Localizable.strings)
"gentleDays.title" = "Días Suaves";
"gentleDays.checkIn.question" = "¿Cómo te sientes hoy?";
"gentleDays.chip.tender" = "tierno";
"gentleDays.chip.calm" = "tranquilo";
"gentleDays.partner.message.prefix" = "Sintiéndose";
"gentleDays.careActions.showCare" = "Mostrar Cuidado";
"gentleDays.sos.button" = "Te necesito";
"gentleDays.sos.confirmation" = "¿Llegar a tu pareja?";
```

**Implementation:**
```swift
extension String {
    static func localized(key: String, comment: String = "") -> String {
        return NSLocalizedString(key, comment: comment)
    }
}

// Usage
Text(String.localized(key: "gentleDays.checkIn.question"))
```

---

## 16. QA Checklist & Tests

### 16.1 Unit/Integration Test Suggestions

**Swift Unit Tests:**
```swift
// GentleDaysServiceTests.swift
func testSaveStatus() async throws {
    let service = GentleDaysService(userId: "user1", pairId: "pair1")
    try await service.saveStatus(chipIds: ["tender", "calm"])
    let status = try await service.getTodayStatus()
    XCTAssertEqual(status?.selectedChips, ["tender", "calm"])
}

func testRateLimitSOS() async throws {
    let service = GentleDaysService(userId: "user1", pairId: "pair1")
    // Trigger 3 SOS
    for _ in 0..<3 {
        try await service.triggerSOS()
    }
    // 4th should fail
    XCTAssertThrowsError(try await service.triggerSOS())
}

func testPartnerMessageGeneration() {
    let message = generatePartnerMessage(chipIds: ["tender", "needing_space"])
    XCTAssertEqual(message, "Feeling tender and needing some space")
}
```

**Cloud Functions Integration Tests:**
```typescript
// gentleDays.test.ts
describe("onGentleDaysStatusUpdate", () => {
    it("should generate partner message on status update", async () => {
        // Test Cloud Function trigger
        // Verify partner message created
        // Verify notification sent (if throttling allows)
    });
    
    it("should throttle notifications (max 1 per day)", async () => {
        // Send 2 status updates in same day
        // Verify only 1 notification sent
    });
    
    it("should bypass throttling for SOS", async () => {
        // Send SOS
        // Verify notification sent immediately (if rate limit allows)
    });
});
```

### 16.2 Manual QA Scenarios

**Privacy:**
- [ ] User can enable/disable sharing without partner knowing
- [ ] Partner cannot see raw chips (only derived messages)
- [ ] Partner cannot see period calendar (unless explicitly shared)
- [ ] User can revoke sharing anytime (partner view disappears)
- [ ] User can delete all data (no traces remain)

**Toggles:**
- [ ] All toggles default to OFF
- [ ] Toggles save immediately (no delays)
- [ ] Changes sync across devices (if user has multiple devices)
- [ ] User can disable feature entirely (feature remains accessible but inactive)

**Partner Experience:**
- [ ] Partner sees derived message (not raw chips)
- [ ] Partner can send care actions (all 4 types work)
- [ ] Partner receives notifications (if enabled, throttled correctly)
- [ ] Partner view updates in real-time when user updates status

**Edge Cases:**
- [ ] User declines all permissions → Feature remains accessible
- [ ] Partner not in app → User can still use feature (one-way)
- [ ] Offline → Status saves locally, syncs when online
- [ ] Multiple status updates per day → Latest overwrites previous
- [ ] SOS rate limit → Error message shown, no notification sent
- [ ] Calendar sharing disabled after enabled → Partner view disappears (no notification)

---

## 17. Migration & Rollout Notes

### 17.1 How to Add to Existing App

**Feature Flag:**
```swift
struct AppConfig {
    static var gentleDaysEnabled: Bool {
        // Remote config or build flag
        return RemoteConfig.remoteConfig().configValue(forKey: "gentleDays_enabled").boolValue
    }
}

// Usage
if AppConfig.gentleDaysEnabled {
    // Show Gentle Days feature
}
```

**Staged Rollout:**
1. **Phase 1 (Internal):** Enable for test users (10%)
2. **Phase 2 (Beta):** Enable for beta testers (25%)
3. **Phase 3 (Gradual):** Enable for all users (100%)

**Integration Points:**
- Add "Gentle Days" option to Settings screen
- Add onboarding flow (shown once, can be skipped)
- Add navigation entry (tab or menu item)

### 17.2 Backwards Compatibility

**Database Migration:**
- No migration required (new collections, no changes to existing schema)
- Existing users: Feature appears as optional (not forced)

**App Version Compatibility:**
- Feature works independently (no dependencies on other features)
- Older app versions: Feature not visible (graceful degradation)

**User Data:**
- No existing user data affected
- New users: Onboarding shown (can skip)
- Existing users: Feature accessible via Settings (no onboarding unless user enables)

---

## 18. Deliverables

### 18.1 File List

**Design Mockups:**
- `Design/Onboarding_Screens.png` (3 screens)
- `Design/CheckIn_Screen.png` (primary screen with chips)
- `Design/Partner_View.png` (partner status view)
- `Design/Care_Actions.png` (action sheet and flows)
- `Design/Settings_Screen.png` (all toggles)

**SwiftUI Components:**
- `Features/GentleDays/Sources/GentleDays/Models/GentleDaysModels.swift`
- `Features/GentleDays/Sources/GentleDays/Services/GentleDaysService.swift`
- `Features/GentleDays/Sources/GentleDays/Views/GentleDaysCheckInView.swift`
- `Features/GentleDays/Sources/GentleDays/Views/GentleDaysPartnerView.swift`
- `Features/GentleDays/Sources/GentleDays/Views/GentleDaysSettingsView.swift`
- `Features/GentleDays/Sources/GentleDays/Views/Components/FeelingChipSelector.swift`
- `Features/GentleDays/Sources/GentleDays/Views/Components/CareActionsSheet.swift`
- `Features/GentleDays/Sources/GentleDays/ViewModels/GentleDaysCheckInViewModel.swift`
- `Features/GentleDays/Sources/GentleDays/ViewModels/GentleDaysPartnerViewModel.swift`

**Cloud Functions:**
- `functions/src/gentleDays.ts` (all Cloud Functions)

**Security Rules:**
- `firestore.rules` (updated with Gentle Days rules)

**Product Spec:**
- `GENTLE_DAYS_SPECIFICATION.md` (this document)

**Localization:**
- `Localizable.strings` (English)
- `Localizable.strings (Spanish)`
- `Localizable.strings (French)`

### 18.2 Prioritized Next Steps (First Week)

**Week 1 Priorities:**
1. **Day 1-2:** Firestore schema design + security rules (Task 2.1)
2. **Day 2-3:** Swift data models + service layer (Task 2.2)
3. **Day 3:** Chip-to-message mapping logic (Task 2.3)
4. **Day 4-5:** Cloud Functions for notifications (Task 2.4)
5. **Day 5:** Onboarding flow UI (Task 2.5, start)

**Assumptions:**
- 1-2 iOS engineers, 1 backend engineer available
- Designer available for onboarding screens
- Firebase project set up and accessible
- Existing app infrastructure (auth, pairs) in place

**Dependencies:**
- Firebase project with Firestore enabled
- Cloud Functions environment set up
- FCM tokens managed in user profiles
- Existing pair service for partner ID lookups

---

## Appendix: Quick Reference

### Key Principles
1. **Privacy-first:** Everything defaults to private, all sharing is opt-in
2. **No tracking language:** Never use "tracking", "optimization", "analytics"
3. **Warm, human tone:** All copy is empathetic and supportive
4. **No gamification:** No streaks, rewards, or pressure
5. **Reversible:** Users can enable/disable sharing anytime

### Critical Constraints
- Manual calendar input only (no predictions)
- Partner sees derived messages, not raw data
- Max 1-2 notifications per day (throttled)
- SOS rate-limited to 3 per 24 hours
- All sharing defaults to OFF

### Contact & Questions
For questions about this specification, refer to the product summary (Section 1) and implementation checklist (Section 2).

---

**End of Specification Document**


