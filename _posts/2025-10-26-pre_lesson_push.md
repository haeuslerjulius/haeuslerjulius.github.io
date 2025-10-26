---
layout: post
title: "Pre-lesson push notification with last-lesson recap"
tags: [builds]
result: "On time nudges before class; faster context recall"
---

**Problem:**  
I arrived at classes without context from previous lessons.

  
**Data**
- Timetable in Google sheets
- Class notes from Google docs

  
**Worklow**
1) Check Timetable -> what class is next (day/time)? -> subject  
2) Fetch entrie with latest date in that doc  
3) send notes to ChatGPT -> summarize in short bullet points  
4) send notification to my iPad  

  
**Output**  
- One push notification: subject + last-lesson bullet points
- clickable link in push

  
**Conclusion**
Time to recall drasticlly reduced, success-rate: 0%, Api tokes used per week: ~250.
