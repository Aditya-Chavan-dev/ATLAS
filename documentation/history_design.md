# Employee History Section Design

## 1. Visual Layout (Timeline Card Style)
We have designed a clean, vertical timeline where each day is a distinct card. This avoids complex tables on mobile devices.

### **The Card Elements:**
*   **Left (Date Badge):** A square badge showing the **Day** (e.g., "07") in bold and **Month** (e.g., "Jan"). This makes scanning for a specific date instant.
*   **Center (Context):**
    *   **Status Label:** Large colored text (e.g., "Present", "Rejected").
    *   **Time:** A small pill badge showing the exact check-in time (e.g., `09:30 AM`).
    *   **Location:** Icon + Name (e.g., 🏢 Office or 📍 Site A).
*   **Right (Status Icon):** A visual indicator on desktop (Green Check, Red X) for quick status recognition.

## 2. Status Logic
The history automatically handles 4 states:

1.  **✅ Approved (Green):**
    *   Shows: "Present"
    *   Details: Confirmed Time & Location.
    *   Meaning: The MD has signed off on this day.

2.  **⏳ Pending (Amber):**
    *   Shows: "Pending"
    *   Meaning: You have marked it, but the MD hasn't clicked "Approve" yet.

3.  **❌ Rejected (Red):**
    *   Shows: "Rejected"
    *   **Critical Feature:** Displays the **Rejection Reason** (e.g., "Reason: Late arrival") directly on the card so the employee knows *why*.

4.  **⚪ Absent (Gray):**
    *   Shows: "Absent"
    *   Meaning: No record found for this past date.

## 3. Data Scope (The "Rolling 30")
*   **Range:** The system automatically fetches the **Last 30 Days** from today.
*   **Why?** This covers the current payroll cycle without overwhelming the phone with years of data.

---

### **Visual Preview (Markdown)**

`[ JAN 07 ]` **✅ Present** `09:30 AM`
               🏢 Office

`[ JAN 06 ]` **⏳ Pending** `09:45 AM`
               📍 Site: Basement

`[ JAN 05 ]` **❌ Rejected** `11:00 AM`
               ⚠️ Reason: Too late

### **Visual Mockup**

![Employee History UI Mockup](/employee_history_ui_mockup_1767786919754.png)
