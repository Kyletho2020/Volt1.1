# Supabase Setup Guide

## ✅ Your Supabase Connection is Now Configured!

Your Volt1.1 project is now connected to your Supabase database.

## 📊 Database Details

- **Project:** Supbase project
- **Project ID:** `oorgoezqxexsewcwasvh`
- **Region:** us-west-1
- **Status:** ✅ ACTIVE_HEALTHY
- **Database Host:** `db.oorgoezqxexsewcwasvh.supabase.co`

## 📋 Your Tables

1. **quotes** - ✅ 43 rows (112 KB)
   - Schema: `id`, `quote_number`, `project_name`, `company_name`, `contact_name`, `site_phone`, `shop_location`, `site_address`, `scope_of_work`, `logistics_data`, `equipment_requirements`, `email_template`, `scope_template`, `created_at`, `updated_at`, `logistics_shipment`, `logistics_storage`

2. **temp_quote_data** - 19 rows
3. **focus_sessions** - 16 rows
4. **api_key_storage** - 2 rows
5. **activities** - 0 rows
5. **goals** - 0 rows

## 🚀 How to Use

### 1. Development (Local)

The `.env` file has been created in your repository with your Supabase credentials.

**To run locally on your computer:**

1. Clone the repository:
   ```bash
   git clone https://github.com/Kyletho2020/Volt1.1.git
   cd Volt1.1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. The `.env` file already exists with your credentials!

   – **Important:** The `.env` file is git-ignored for security. If you need to clone to another machine, pull the `.env` file directly or copy from `.env.example`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to http://localhost:5173

### 2. Production (Netlify/Vertel/etc.)

For production deployments, add these environment variables in your hosting platform's dashboard:

```env
VITE_SUPABASE_URL=https://oorgoezqxexsewcwasvh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcmdvZXpxeGV4c2V3Y3dhc3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTU0NzUsImV4cCI6MjA2ODI5MTQ3NX0.PLGUswNkjeNbbOOEsD7MpLuCY0HSwUMAGO3Q-IPAfjw
```

## 🍐 Security Notes

1. **➠️ Keep `.env` Private:** The `.env` file contains your API keys and is already in `.gitignore`. Never commit it to public repositories.

2. **✅ Anon Key is Safe:** The `VITE_SUPABASE_ANON_KEY` is safe to use in frontend code – it only allows operations that respect your Row Level Security policies.

3. **⚠️ Service Role Key:** The `VITE_SUPABASE_MANUAL_KEY` (service_role) should **never** be exposed in frontend code. Use it only in secure backend/server functions.

## 🛠️ Troubleshooting

### Error: "Could not find the table 'public.quotes' in the schema cache"

**Solution:**

1. **Restart your development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Clear browser cache and localStorage:**
   - Open browser developer console (F12)
   - Type: `localStorage.clear()` and press Enter
   - Refresh the page (Ctrl+Shift+R)

3. **Verify environment variables are loading:**
   - Open browser developer console
   - Type: `console.log(import.meta.env.VITE_SUPABASE_URL)`
   - You should see: `https://oorgoezqxexsewcwasvh.supabase.co`

4+��**Check Row Level Security (RLS):**
   - Your `quotes` table has RLS disabled (ideal for development)
   - Verify in Supabase dashboard: Database → Tables → quotes → "RLS enabled" should be OFF

## 💃 What You Can Do Now

- *✅ Save quotes** to the `quotes` table
- *✅ Load quote history** (your 43 existing quotes)
- *✅ Search quotes** by quote number
- *✅ Update existing quotes**
- *✅ Delete quotes**

## 📚 Useful Links

- [Supabase Dashboard](https://supabase.co/dashboard/project/oorgoezqxexsewcwasvh)
- [Supabase Table Editor](https://supabase.co/dashboard/project/oorgoezqxexsewcwasvh/editor/)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Repository](https://github.com/Kyletho2020/Volt1.1)

---

© 2025 Volt1.1 - Created on October 30, 2025
