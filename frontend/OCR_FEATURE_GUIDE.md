# 🎯 OCR Feature Access Guide - SwiftNotes

## 📍 WHERE TO FIND THE OCR FEATURE

The OCR feature is located in the **Setup Process** during the **ISP Tasks step (Step 3)**.

## 🚀 STEP-BY-STEP ACCESS GUIDE

### Step 1: Navigate to Setup
1. Open your browser: `http://localhost:5173`
2. Login to your SwiftNotes account
3. Go to the Setup page: `http://localhost:5173/setup`

### Step 2: Complete Prerequisites
1. **Database Setup** (Step 1) - Click "Continue"
2. **Writing Style** (Step 2) - Enter writing sample, click "Continue to ISP Tasks"

### Step 3: Access OCR Feature (ISP Tasks Step)
You should see a **blue box** that looks like this:

```
┌─────────────────────────────────────────────────────────┐
│ 📷 Extract Tasks from Screenshot                        │
│                                                         │
│ Have a screenshot of your ISP task list? Upload it     │
│ and we'll automatically extract the tasks for you.     │
│                                                         │
│ [📷 Upload Screenshot]                                  │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Use OCR Feature
1. **Click "Upload Screenshot"** button
2. **Upload Process:**
   - Drag & drop your image file, OR
   - Click to browse and select file
   - Supported formats: JPEG, PNG, WebP, TIFF
   - Max size: 10MB

3. **Processing:**
   - OCR will automatically process your image
   - You'll see a loading spinner
   - Processing takes 5-15 seconds

4. **Review Results:**
   - Extracted tasks will appear with confidence scores
   - Edit any tasks that need correction
   - Add or remove tasks as needed

5. **Save Tasks:**
   - Click "Add X Tasks to Profile" button
   - Tasks will be added to your ISP task list

## 🔍 TROUBLESHOOTING

### Issue: "I don't see the OCR option"

**Possible Causes:**
1. **Not on the right step** - OCR only appears in Step 3 (ISP Tasks)
2. **Already completed setup** - If setup is done, OCR won't show
3. **Component not loading** - Check browser console for errors

**Solutions:**
1. **Navigate directly:** `http://localhost:5173/setup`
2. **Clear setup status** and start over
3. **Check browser console** for JavaScript errors

### Issue: "Upload Screenshot button doesn't work"

**Check:**
1. **Backend is running** on port 3001
2. **Frontend is running** on port 5173
3. **No console errors** in browser developer tools

### Issue: "OCR processing fails"

**Common Causes:**
1. **Image too large** (>10MB)
2. **Unsupported format**
3. **Backend OCR service not running**
4. **No credits available**

## 🧪 TESTING THE FEATURE

### Quick Test:
1. Go to: `http://localhost:5173/setup`
2. Complete steps 1-2
3. Look for the blue OCR box in step 3
4. Try uploading a test image

### Test Image Requirements:
- **Clear text** - ISP tasks should be readable
- **Good contrast** - Dark text on light background
- **Standard format** - JPEG, PNG preferred
- **Reasonable size** - Under 10MB

## 📱 WHAT YOU SHOULD SEE

### Before Upload:
```
Extract ISP Tasks from Screenshot
Upload a screenshot of your ISP task list and we'll automatically 
extract the tasks for you.

[Drag & drop area or click to upload]

Tips for better OCR results:
• Ensure the image is clear and well-lit
• Make sure text is not blurry or distorted
• Higher resolution images work better
```

### During Processing:
```
Processing Image
Extracting text and identifying ISP tasks...
This may take a few moments
[Spinning loader]
```

### After Processing:
```
OCR Processing Results
High Confidence (85%)  3 tasks found

Extracted ISP Tasks:
1. Individual will demonstrate improved communication skills... [Edit] [Remove]
2. Participant will complete daily living activities... [Edit] [Remove]
3. Client will engage in social interaction activities... [Edit] [Remove]

[Add 3 Tasks to Profile] [Start Over]
```

## 🆘 STILL CAN'T FIND IT?

If you still can't see the OCR feature:

1. **Check URL:** Make sure you're at `http://localhost:5173/setup`
2. **Check Step:** Must be on Step 3 (ISP Tasks)
3. **Check Console:** Open browser dev tools, look for errors
4. **Restart Services:** Restart both frontend and backend
5. **Clear Cache:** Clear browser cache and reload

## 📞 NEED HELP?

The OCR feature should be clearly visible as a blue box with a camera icon in the ISP Tasks step of the setup process. If it's not there, there may be a technical issue that needs debugging.
