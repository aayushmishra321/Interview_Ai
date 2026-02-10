# Quick Test Guide - Interview Flow

## 🚀 Quick Start

### 1. Open the Application
Open your browser and go to: **http://localhost:5175**

### 2. Login
```
Email: test@example.com
Password: Test@1234
```

### 3. Create an Interview

1. Click on "Start Interview" or navigate to Interview Setup
2. **Select Interview Type:** Click on "Behavioral Interview"
3. **Enter Target Role:** Type "Software Engineer"
4. **Select Difficulty:** Choose "Medium"
5. **Set Duration:** Use slider to set 30 minutes
6. **Click "Start Interview"**

### 4. What Should Happen

✅ **Success Message:** "Interview created successfully!"

✅ **Automatic Redirect:** You should be redirected to the interview room

✅ **URL Check:** The URL should look like:
```
http://localhost:5175/interview-room?id=698b352c9463e0ac73b072f9
```
(The ID will be different each time)

✅ **Interview Room Loads:** You should see:
- AI Interviewer avatar on the left
- Your camera preview in the center (or error message if camera unavailable)
- Answer input area on the right
- First question displayed

### 5. Handle Camera Permission

**If Camera Permission Prompt Appears:**
- Click "Allow" to enable camera
- OR Click "Block" to continue without camera

**If Camera Error Appears:**
- Read the error message
- Click "Retry Camera Access" if you want to try again
- OR Continue without camera (interview will work fine)

**Common Camera Issues:**
- **"Camera is already in use"** → Close other apps using camera (Zoom, Teams, etc.)
- **"Camera permission denied"** → Allow camera in browser settings
- **"No camera found"** → Connect a camera or continue without video

### 6. Start the Interview

1. **Click "Start Interview" button** (green button in the center)
2. **First question appears** in the blue box on the left
3. **Timer starts** at the top
4. **Status changes to "Live"** (green badge)

### 7. Answer Questions

**Method 1: Type Your Answer**
- Type directly in the "Your Answer" text area on the right
- Watch character and word count update

**Method 2: Speak Your Answer** (if microphone available)
- Click microphone button to start listening
- Speak your answer
- Your speech will be transcribed to text
- Click microphone button again to stop

**Example Answer:**
```
I have been working as a Software Engineer for 3 years. My key 
responsibilities include designing and developing web applications, 
collaborating with cross-functional teams, writing clean and 
maintainable code, conducting code reviews, and mentoring junior 
developers. I focus on creating scalable solutions and following 
best practices.
```

### 8. Submit Answer and Continue

1. **Click "Next Question"** button
2. **Your answer is submitted** and analyzed
3. **Next question appears** automatically
4. **Question counter updates** (e.g., "Question 2 of 6")
5. **Repeat** for all questions

### 9. End the Interview

**Option 1: Answer All Questions**
- After the last question, you'll see "No more questions available"
- Click "End Interview" button

**Option 2: End Early**
- Click the red "End Interview" button at any time
- Confirm you want to end

### 10. View Feedback

✅ **Automatic Redirect:** You should be redirected to the feedback page

✅ **URL Check:** The URL should look like:
```
http://localhost:5175/feedback?id=698b352c9463e0ac73b072f9
```

✅ **Feedback Displayed:** You should see:
- **Overall Rating** (e.g., 75/100)
- **Strengths** (3-5 points)
- **Areas for Improvement** (3-5 points)
- **Recommendations** (3-5 actionable items)
- **Detailed Feedback** (comprehensive analysis)

## 🔍 What to Check

### ✅ Interview Creation
- [ ] Interview type selection works
- [ ] Role input accepts text
- [ ] Difficulty selection works
- [ ] Duration slider works
- [ ] "Start Interview" button creates interview
- [ ] Success message appears
- [ ] Redirects to interview room

### ✅ Interview Room
- [ ] URL contains interview ID
- [ ] Page loads without errors
- [ ] First question appears
- [ ] Camera preview shows (or error message)
- [ ] Timer starts
- [ ] Status shows "Live"
- [ ] Answer input area works

### ✅ Question Flow
- [ ] Can type answers
- [ ] Character/word count updates
- [ ] "Next Question" button works
- [ ] Next question appears
- [ ] Question counter updates
- [ ] Can navigate through all questions

### ✅ Interview Completion
- [ ] "End Interview" button works
- [ ] Redirects to feedback page
- [ ] URL contains interview ID
- [ ] Feedback displays correctly

### ✅ Feedback Page
- [ ] Overall rating shown
- [ ] Strengths listed
- [ ] Improvements listed
- [ ] Recommendations provided
- [ ] Detailed feedback text shown

## 🐛 Common Issues and Solutions

### Issue 1: "No interview ID provided" Error
**What it means:** Interview ID wasn't passed to the interview room

**Solution:**
1. Check browser console (F12) for errors
2. Look for the interview creation response
3. Verify the interview was created successfully
4. If issue persists, refresh and try again

**This should NOT happen anymore** - the fix ensures ID is always passed

### Issue 2: Camera Not Working
**What it means:** Camera is unavailable or permission denied

**Solutions:**
1. **Close other apps** using camera (Zoom, Teams, Skype)
2. **Close other browser tabs** using camera
3. **Grant permission** when browser asks
4. **Check browser settings** → Privacy → Camera
5. **Continue without camera** - interview works fine without video

### Issue 3: Questions Not Loading
**What it means:** Backend connection issue

**Solutions:**
1. Check backend server is running: http://localhost:5001/health
2. Check browser console for API errors
3. Verify you're logged in
4. Refresh the page

### Issue 4: Can't Submit Answer
**What it means:** Answer is empty or API error

**Solutions:**
1. Type at least a few words in the answer box
2. Check browser console for errors
3. Verify backend is running
4. Try again

## 📊 Expected Console Output

### During Interview Creation:
```
=== INTERVIEW CREATION DEBUG ===
Selected Type: behavioral
Selected Role: Software Engineer
Selected Difficulty: medium
Duration: 30
Payload to be sent: { type: "behavioral", settings: {...} }
Calling createInterview...
Interview created successfully!
Created interview ID: 698b352c9463e0ac73b072f9
Navigating to interview room with ID: 698b352c9463e0ac73b072f9
```

### During Interview Room Load:
```
=== INTERVIEW ROOM INITIALIZATION ===
Interview ID from URL: 698b352c9463e0ac73b072f9
=== STARTING INTERVIEW ===
Interview ID: 698b352c9463e0ac73b072f9
Starting interview session...
Interview session started successfully
Getting first question...
Next question received: { id: "q_...", text: "Tell me about..." }
```

### During Answer Submission:
```
Submitting response for interview: 698b352c9463e0ac73b072f9
Response submitted successfully
Getting next question for interview: 698b352c9463e0ac73b072f9
Next question received: { id: "q_...", text: "Describe a..." }
```

## 🎯 Success Criteria

Your test is successful if:

1. ✅ Interview creates without errors
2. ✅ Redirects to interview room with ID in URL
3. ✅ Interview room loads and shows first question
4. ✅ Can answer questions and submit
5. ✅ Can navigate through multiple questions
6. ✅ Can end interview
7. ✅ Redirects to feedback page with ID in URL
8. ✅ Feedback displays with ratings and recommendations

## 📝 Test Checklist

- [ ] Logged in successfully
- [ ] Created interview successfully
- [ ] Redirected to interview room with ID
- [ ] Interview room loaded without errors
- [ ] First question appeared
- [ ] Answered at least 2 questions
- [ ] Submitted answers successfully
- [ ] Ended interview
- [ ] Redirected to feedback page
- [ ] Feedback displayed correctly

## 🎉 If Everything Works

Congratulations! The interview flow is working perfectly. You can now:

1. **Take multiple interviews** to practice
2. **Try different interview types** (Technical, Coding, System Design)
3. **Experiment with difficulty levels**
4. **Review your feedback** to improve
5. **Track your progress** over time

## 📞 If You Encounter Issues

1. **Check browser console** (F12 → Console tab)
2. **Check backend logs** (backend/logs/combined.log)
3. **Verify servers are running:**
   - Frontend: http://localhost:5175
   - Backend: http://localhost:5001/health
4. **Review the error messages** - they're designed to be helpful
5. **Try the troubleshooting steps** above

---

**Happy Testing! 🚀**

The interview platform is ready to help you ace your next interview!
