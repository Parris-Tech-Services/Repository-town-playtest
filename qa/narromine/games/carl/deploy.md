Use **PowerShell**. Start with the inner folder that should contain `package.json`:

```powershell
Set-Location "C:\Users\Josh\OneDrive - Dubbo Christian School\Documents\Dungeon Crawler Carl.zip\Dungeon Crawler Carl"

Get-ChildItem
Test-Path ".\package.json"
```

If that returns `False`, try the other folder:

```powershell
Set-Location "C:\Users\Josh\OneDrive - Dubbo Christian School\Documents\Dungeon Crawler Carl"

Get-ChildItem
Test-Path ".\package.json"
```

Once it returns `True`, run:

```powershell
# Create a basic .gitignore only when one does not already exist
if (-not (Test-Path ".gitignore")) {
@"
node_modules/
.next/
dist/
out/
.vercel/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.log
.DS_Store
"@ | Set-Content ".gitignore"
}

# Initialise Git
git init
git branch -M main

# Connect the GitHub repository
if ((git remote) -contains "origin") {
    git remote set-url origin "https://github.com/joshuaparris-max/carl.git"
} else {
    git remote add origin "https://github.com/joshuaparris-max/carl.git"
}

# Add and commit the project
git add .
git status
git commit -m "Initial Dungeon Crawler Carl deployment"

# Fetch and merge anything already in the GitHub repository
git fetch origin

git show-ref --verify --quiet refs/remotes/origin/main
if ($LASTEXITCODE -eq 0) {
    git merge origin/main --allow-unrelated-histories --no-edit
}

# Push to GitHub
git push -u origin main
```

GitHub may open a browser window asking you to sign in.

### Deploy through Vercel

If the GitHub repository is already connected to Vercel, that push should automatically start a deployment.

Otherwise:

1. Open the Vercel dashboard.
2. Select **Add New → Project**.
3. Import `joshuaparris-max/carl`.
4. Let Vercel detect the framework.
5. Add any required environment variables.
6. Select **Deploy**.

Future deployments will then only require:

```powershell
git add .
git commit -m "Describe the changes"
git push
```
