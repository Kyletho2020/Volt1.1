# Volt1.1 - Local Setup Guide

## 🚀 Quick Start

The Volt1.1 application is now set up to run locally for faster performance and easier editing!

### Running the Application

You have **three ways** to launch Volt1.1:

#### **Option 1: Batch File (Recommended for Windows)**
Double-click on:
```
Start Volt1.1.bat
```
This will:
- Check if dependencies are installed
- Install them if needed
- Start the dev server on `http://localhost:5175`
- Automatically open your browser

#### **Option 2: Desktop Shortcut**
1. Copy `Desktop Launcher.bat` to your Desktop
2. Double-click it whenever you want to launch Volt1.1
3. The application will start in a new command window

#### **Option 3: Chrome Browser Bookmark**
1. Open `Chrome Launcher.html` in Chrome
2. Press `Ctrl+D` to bookmark it
3. Rename the bookmark to "🚀 Volt1.1" or whatever you prefer
4. Click the bookmark anytime to access Volt1.1 (make sure the server is running first!)

### Manual Start (Command Line)

If you prefer to use the command line:

```bash
cd "c:\Users\kylet\Documents\Antigravity\Volt1.1"
npm run dev
```

## 📝 Configuration

### Port Settings
The application is configured to run on **port 5175** by default.
- **Local URL**: http://localhost:5175
- You can change this in `vite.config.ts` if needed

### Environment Variables
The `.env` file has been created from `.env.example`. Update it with your actual API keys:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_SUPABASE_MANUAL_KEY` - Your Supabase service role key
- `VITE_OPENAI_API_KEY` - Your OpenAI API key

## 🛠️ Development

### Available Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### File Structure

```
Volt1.1/
├── src/                    # Source code
├── public/                 # Static assets
├── Start Volt1.1.bat      # Main launcher
├── Desktop Launcher.bat   # Desktop shortcut
├── Chrome Launcher.html   # Browser bookmark page
└── .env                   # Environment variables
```

## 🎯 Benefits of Running Locally

✅ **Faster performance** - No network latency
✅ **Hot Module Replacement (HMR)** - Instant updates when you edit code
✅ **Full debugging** - Access to browser dev tools with source maps
✅ **Offline development** - Work without internet connection
✅ **Easy testing** - Test changes immediately

## 🔧 Troubleshooting

### Server won't start
1. Make sure Node.js is installed: `node --version`
2. Delete `node_modules` folder and run `npm install` again
3. Check if port 5175 is available

### Changes not appearing
1. Make sure the dev server is running
2. Clear browser cache (Ctrl+Shift+R)
3. Check the terminal for any compilation errors

### Environment variables not working
1. Make sure `.env` file exists in the root directory
2. Restart the dev server after changing `.env`
3. Variables must start with `VITE_` to be accessible in the browser

## 📞 Support

For more information, check:
- `README.md` - General project information
- `SUPABASE_SETUP.md` - Database setup guide
- `docs/` - Additional documentation

---

**Happy Coding! 🎉**
