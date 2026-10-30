# E2E Test Infra: SlideVault Mobile & Tablet UI

## Test Philosophy
- Opaque-box, requirement-driven derived directly from `ORIGINAL_REQUEST.md` and user acceptance criteria.
- No dependency on internal implementation design; evaluates rendered DOM, layout geometry, computed CSS, scroll behaviors, touch event dispatching, and cryptographic hashes.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory Mapping
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|----------------------|:------:|:------:|:------:|
| 1 | Remove/Suppress Thanh Số 3 & Floating Pills | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Spatial Feature Isolation to phone.html | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Dual-Layer Modal Suppression | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Bottom Content Clearance & Dialog Sizing | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Scroll-Driven Hiding & Restoration Engine | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | Scroll Stop & Touch End Auto-Restoration | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | Apple VisionOS Spring Motion Symmetry | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | 60fps Native Inertial Sidebar Scroll | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 9 | Gesture Hijacking Elimination & Swipe-Close | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 10 | Mobile Sidebar Header & Touch Targets (>=48px)| ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 11 | Complete 3-Dots Button Eradication | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 12 | Horizontal Overflow Elimination | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 13 | Multi-device Viewport Compatibility | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 14 | Invariance Parity (SHA-256 Byte-for-Byte) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Node.js / Playwright / Headless Chromium or Cheerio/JSDOM automated test runner in `tests/e2e/runner.js`.
- Invariance verification: Native cryptographic hash check (`Get-FileHash` / crypto SHA-256) and binary difference tool (`fc.exe /b`).
- Directory layout:
  `tests/e2e/tier1_features.test.js`
  `tests/e2e/tier2_boundaries.test.js`
  `tests/e2e/tier3_pairwise.test.js`
  `tests/e2e/tier4_realworld.test.js`
  `tests/e2e/runner.js`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | iPhone 15 Pro Browse & Download Slide Template | F1, F3, F4, F5, F6, F7, F12, F13 | High |
| 2 | Tablet (iPad Air 820px) Sidebar Navigation & Template Selection | F8, F9, F10, F11, F13 | Medium |
| 3 | Mobile AI Prompt Chat Session with Keyboard Open | F1, F3, F4, F12, F13 | High |
| 4 | Rapid Scroll Down, Sudden Stop, Modal Checkout Flow | F3, F5, F6, F7, F13 | High |
| 5 | SlideVault Vision Remote (phone.html) Remote Control Session | F1, F2, F13 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature across 14 features = ≥70 tests
- Tier 2: ≥5 per feature across 14 features = ≥70 tests
- Tier 3: Pairwise combinations across major features = ≥14 tests
- Tier 4: ≥5 realistic application scenarios
- Total Target: ≥159 test cases
