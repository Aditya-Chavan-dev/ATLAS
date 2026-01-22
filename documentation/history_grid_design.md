# Design: Interactive Attendance Grid

## Problem
The current vertical list requires users to scroll through 30+ cards to find information, which is tedious and "tiring".

## Solution: The "Holographic Grid"
Instead of a list, we will visualize the month as a highly interactive, compact **Calendar Grid**.

### 1. The Visuals (Heads-Up Display)
*   **The Grid:** A cleaner, modern 7-column grid (Mon-Sun).
*   **The Cells:**
    *   **✅ Present:** Bright Emerald rounded square.
    *   **❌ Rejected:** Red hollow square with a dot.
    *   **⏳ Pending:** Amber dashed border.
    *   **⚪ Absent:** Faint slate dot (minimal noise).
*   **No Scrolling:** The entire month fits on one screen.

### 2. Interaction (Touch to Reveal)
*   **Default State:** You see the "Pattern" of your attendance (Greens and Reds).
*   **Action:** Tap any day on the grid.
*   **Reaction:** A **"Detail Card"** slides up/appears below the grid showing:
    *   Big Date: "Mon, 07 Jan"
    *   Time: "09:30 AM"
    *   Location: "Office (HQ)"
    *   Status: "Approved"

### 3. "Stats at a Glance"
Above the grid, 3 floating bubbles summarize the month:
*   `22` Present
*   `01` Rejected
*   `00` Pending

## Why it's Better
1.  **Zero Scrolling:** Full month visibility in a single glance.
2.  **Pattern Recognition:** Instantly spot the "Red" day without hunting.
### Visual Mockup
![Interactive Grid UI](/attendance_grid_mockup_1767789272877.png)
