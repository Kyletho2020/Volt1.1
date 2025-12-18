# Git Quick Reference for Volt1.1

## Daily Workflow

### 1️⃣ Check Status
```bash
git status
```
Shows what files you've changed

### 2️⃣ Stage Changes
```bash
git add .                    # Add all files
git add filename.tsx         # Add specific file
```

### 3️⃣ Commit Changes
```bash
git commit -m "Your descriptive message"
```

### 4️⃣ Push to GitHub
```bash
git push
```

---

## Common Scenarios

### Quick Push Everything
```bash
git add . && git commit -m "Updated files" && git push
```

### See What Changed
```bash
git diff                     # See changes not staged
git diff --cached            # See changes staged
git log --oneline -5         # See last 5 commits
```

### Undo Changes (Before Commit)
```bash
git checkout filename.tsx    # Undo changes to one file
git reset --hard            # Undo ALL changes (careful!)
```

### Pull Latest from GitHub
```bash
git pull
```
Use this if you edited on GitHub website or another computer

---

## Quick Tips

✅ **DO:**
- Commit related changes together
- Write clear commit messages
- Pull before you push if working from multiple places
- Commit often (saves your work!)

❌ **DON'T:**
- Commit passwords or API keys (they're in .env which is git-ignored)
- Push broken code (test first!)
- Use vague messages like "fixed stuff"

---

## Need Help?

**See full history:**
```bash
git log
```

**See who changed what:**
```bash
git blame filename.tsx
```

**Create a branch for experiments:**
```bash
git checkout -b new-feature
```

**Switch back to main:**
```bash
git checkout main
```

---

**Remember:** Changes are ONLY local until you `git push`!
