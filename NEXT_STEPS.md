# Next Steps: Complete Supabase Integration

Follow these steps in order to complete your Supabase setup:

## ✅ Step 1: Verify Your API Key

The API key you provided starts with `sb_publishable_`, but Supabase anon keys typically start with `eyJ` (they're JWT tokens).

**To get the correct key:**
1. Go to your Supabase Dashboard: https://xyuwmgmvpshsjskimapy.supabase.co
2. Navigate to **Settings** → **API**
3. Find the **"anon public"** key (it should start with `eyJ...`)
4. Copy it and update your `.env` file:

```env
VITE_SUPABASE_URL=https://xyuwmgmvpshsjskimapy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-actual-anon-key-here
```

## ✅ Step 2: Create the Database Table

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of `supabase/create_kv_table.sql`
4. Click **Run** (or press Ctrl+Enter)
5. You should see a success message

This creates the `kv` table that stores your recipes, shopping lists, and categories.

## ✅ Step 3: Set Up Row Level Security (RLS) Policies

**Important:** This ensures users can only access their own data.

1. In the **SQL Editor**, create a new query
2. Copy and paste this SQL:

```sql
-- Enable Row Level Security on the kv table
ALTER TABLE kv ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON kv
  FOR SELECT
  USING (
    auth.uid()::text IS NOT NULL AND
    (key LIKE 'user:' || auth.uid()::text || ':%' OR key NOT LIKE 'user:%')
  );

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data" ON kv
  FOR INSERT
  WITH CHECK (
    auth.uid()::text IS NOT NULL AND
    (key LIKE 'user:' || auth.uid()::text || ':%' OR key NOT LIKE 'user:%')
  );

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON kv
  FOR UPDATE
  USING (
    auth.uid()::text IS NOT NULL AND
    (key LIKE 'user:' || auth.uid()::text || ':%' OR key NOT LIKE 'user:%')
  );

-- Policy: Users can delete their own data
CREATE POLICY "Users can delete own data" ON kv
  FOR DELETE
  USING (
    auth.uid()::text IS NOT NULL AND
    (key LIKE 'user:' || auth.uid()::text || ':%' OR key NOT LIKE 'user:%')
  );
```

3. Click **Run**

## ✅ Step 4: Restart Your Development Server

If your dev server is running, stop it (Ctrl+C) and restart it:

```bash
npm run dev
```

This ensures the new environment variables are loaded.

## ✅ Step 5: Test the Connection

1. Open your app in the browser (usually `http://localhost:5173`)
2. You should see a login/register screen
3. **Create a new account** with your email and password
4. Check your email for a confirmation link (if email confirmation is enabled)
5. After signing in, try:
   - Adding a new recipe
   - Adding items to the shopping list
   - Creating categories

## ✅ Step 6: Verify Data is Syncing

1. In your Supabase Dashboard, go to **Table Editor**
2. Select the `kv` table
3. You should see rows with keys like:
   - `user:YOUR_USER_ID:recipes`
   - `user:YOUR_USER_ID:shopping-list`
   - `user:YOUR_USER_ID:categories`

If you see data here, your sync is working! 🎉

## 🔧 Troubleshooting

### "Supabase nicht konfiguriert" error
- Check that your `.env` file exists in the project root
- Verify the environment variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after creating/updating `.env`

### Authentication errors
- Verify your API key is correct (should start with `eyJ`)
- Check that your Supabase project URL is correct
- Make sure email confirmation is disabled in Supabase Auth settings (for testing), or check your email

### Database errors (permission denied, etc.)
- Make sure you ran Step 3 (RLS policies)
- Check that the `kv` table exists (Step 2)
- Verify you're signed in to the app

### Data not syncing
- Open browser DevTools (F12) → Console tab
- Look for any error messages
- Check the Network tab to see if Supabase requests are being made

## 📝 What Happens Next?

Once everything is working:
- ✅ Your recipes are stored in Supabase (not just localStorage)
- ✅ Each user has their own isolated data
- ✅ Data syncs across devices when users sign in
- ✅ The app falls back to localStorage if Supabase is unavailable

## 🚀 Optional: Deploy to Production

See `SUPABASE_DEPLOY.md` for instructions on deploying your app to Supabase Hosting.
