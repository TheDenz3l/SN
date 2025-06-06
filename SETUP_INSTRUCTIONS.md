# 🚀 SwiftNotes Setup Instructions

## ❌ Current Issue: AI Features Not Working

The preview generation and note generation are failing because the **Google AI API Key is missing**.

## ✅ Quick Fix (2 minutes)

### Step 1: Get Google AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key" 
3. Copy the generated API key (starts with `AIza...`)

### Step 2: Add API Key to Environment
1. Open the file: `backend/.env`
2. Find the line: `GOOGLE_AI_API_KEY=your-google-ai-api-key-here`
3. Replace `your-google-ai-api-key-here` with your actual API key
4. Save the file

### Step 3: Restart Server
1. Stop the current server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. Test the AI features

## 🔧 Example Configuration

Your `backend/.env` should look like this:
```
GOOGLE_AI_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## ✅ Verification

After setup, both features should work:
- ✅ Preview Enhanced button
- ✅ Generate Note button

## 🆘 Need Help?

If you're still having issues:
1. Run: `node fix-ai-generation.js` (diagnostic tool)
2. Check the server logs for error messages
3. Ensure your API key is valid and has quota

## 🔒 Security Note

- Never commit your API key to version control
- Keep your `.env` files private
- The API key gives access to Google AI services
