# Phone Support — NZ Market Research

*Market: New Zealand, August 2026. Inferred from brand share, current sales, and typical upgrade cycles — no published data exists on phone models by age group.*

---

## NZ Platform Split (Statcounter, Aug 2026)

| Platform | Share |
|---|---|
| iOS | 55.8% |
| Android | 44.2% |

**By brand:** Apple 55.8% · Samsung 28.8% · Oppo 4.0% · Motorola 1.2% · Xiaomi 1.0%

---

## Likely Devices by Age

| Age | Likely phones | Why |
|---|---|---|
| 12–15 | Older iPhones (11–14, SE) handed down or bought used; cheap Samsung Galaxy A and Oppo A models | Teens lean heavily to iPhone: 87% of US teens own one (Piper Sandler, Oct 2025). At this age the phone is often a family hand-me-down or budget model — expect older hardware and small screens. |
| 16–24 | iPhone 13–17 (mostly standard models, some Pro); Galaxy A series | Peak iPhone age: 79% of US Gen Z prefer iPhone (Bloomberg Intelligence). The standard iPhone 17 was the top seller in the US, UK and other markets in Q2 2026 (Counterpoint). Android users here are mostly on Galaxy A. |
| 25–35 | iPhone 15–17 including Pro and Pro Max; Galaxy S24–S26; Galaxy A; some Pixel and Oppo | Higher incomes mean more flagships. Globally, Galaxy A series (18%) and iPhone 17 series (16%) were the top-selling lineups in Q2 2026 (Smart Analytics Global). |

---

## Devices to Test the PWA On

| Device | CSS pixels | Notes |
|---|---|---|
| iPhone SE / 8 | 375 × 667 | Smallest screen you'll realistically see — common among younger teens |
| iPhone 13 / 14 | 390 × 844 | Bulk of iPhones in use |
| iPhone 15 / 16 | 393 × 852 | Bulk of iPhones in use |
| iPhone 17 | 402 × 874 | Current best-seller |
| iPhone 16 / 17 Pro Max | 440 × 956 | Largest iOS screen |
| Galaxy A series | 360–384 wide | Typical Android — also test on a low-end device, these are much slower than iPhones (matters most for 12–15s) |

---

## PWA Implications

- **iOS is the platform to get right.** 74% of NZ iOS users are on iOS 26.5 or 26.6 — target recent Safari. ~9% still on iOS 18, ~2% on iOS 16.
- **Push notifications on iPhone require installation first.** They only work once the PWA has been added to the Home Screen (iOS 16.4+). The "Add to Home Screen" prompt must be part of onboarding.
- **Design at 360–375 px wide first**, then scale up.

---

## If the Market Isn't NZ

The US skews even more to iPhone. Asia, Latin America and Africa are mostly Android (Samsung A, Xiaomi Redmi, Oppo). Adjust the table to the target market.

---

## Sources

- [Statcounter NZ OS share](https://gs.statcounter.com/os-market-share/mobile/new-zealand)
- [Statcounter NZ vendor share](https://gs.statcounter.com/vendor-market-share/mobile/new-zealand)
- [Statcounter NZ iOS versions](https://gs.statcounter.com/ios-version-market-share/mobile/new-zealand)
- Piper Sandler 50th Teen Survey (Oct 2025)
- Bloomberg Intelligence Gen Z study
- PhoneArena, Q2 2026 best-sellers (Counterpoint)
- Android Headlines, Q2 2026 lineups (Smart Analytics Global)
