---
layout: post
title: "Pre-lesson push notification with last-lesson recap"
tags: [builds]
result: "On time nudges before class; faster context recall"
---

**Problem:**
I arrived at classes without context from previous lessons. <br><br>

**Data**
- Timetable in Google sheets
- Class notes from Google docs <br><br>

**Worklow** <br>
1) Check Timetable -> what class is next (day/time)? -> subject <br>
2) Fetch entrie with latest date in that doc <br>
3) send notes to ChatGPT -> summarize in short bullet points <br>
4) send notification to my iPad. <br><br>



**Output**
- One push notification: subject + last-lesson bullet points
- clickable link in push <br><br>

  
**Conclusion** <br>
- Time to recall drasticlly reced, success-rate: 98%
- Ai Api tokes used per week: ~250.
