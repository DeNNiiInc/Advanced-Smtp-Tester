# deploy-to-proxmox.ps1

# 1. Read Configuration
if (-not (Test-Path "deploy-secrets.json")) {
    Write-Error "Could not find deploy-secrets.json. Please create it first."
    exit 1
}

$Config = Get-Content "deploy-secrets.json" | ConvertFrom-Json
$HostName = $Config.host
$User = $Config.username
$Password = $Config.password
$GitUser = $Config.gitUser
$GitToken = $Config.gitToken
$RepoUrl = $Config.repoUrl

# Construct Authenticated Repo URL
# Extract the domain and path from RepoUrl (remove https://)
$RepoPath = $RepoUrl -replace "https://", ""
# Use Token as username (GitHub supports this) to avoid issues with @ in email usernames
$AuthRepoUrl = "https://${GitToken}@${RepoPath}"

$AppName = "Advanced-Smtp-Tester"
$RemoteDir = "/var/www/$AppName"

Write-Host "🚀 Starting Deployment to $HostName..." -ForegroundColor Cyan

# 2. Define Remote Commands
# We use a Here-String for the remote script
$RemoteScript = @"
set -e

echo "🔹 [Remote] Checking prerequisites..."
if ! command -v git &> /dev/null; then
    echo "📦 [Remote] Installing Git..."
    apt-get update && apt-get install -y git
fi

echo "🔹 [Remote] Preparing directory $RemoteDir..."
mkdir -p "$RemoteDir"

# Check if .git exists, if not clone, else pull
if [ ! -d "$RemoteDir/.git" ]; then
    echo "⬇️ [Remote] Cloning repository..."
    # Clone with token for future auth-less pulls
    git clone "$AuthRepoUrl" "$RemoteDir"
else
    echo "⬇️ [Remote] Repository exists. Pulling latest..."
    cd "$RemoteDir"
    # Update remote url to ensure token is correct (in case it changed)
    git remote set-url origin "$AuthRepoUrl"
    git pull
fi

# Run the setup script from the repo
echo "⚡ [Remote] Running setup script..."
cd "$RemoteDir"
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh

echo "✅ [Remote] Deployment Logic Finished."
"@ -replace "`r`n", "`n"

# 3. Execute via Plink (Putty Link) or SSH
# We'll use plink if available because it handles password via argument easier than OpenSSH on Windows
# If plink is not found, we warn the user.
if (Get-Command plink -ErrorAction SilentlyContinue) {
    echo y | plink -ssh -l $User -pw $Password $HostName $RemoteScript
}
else {
    Write-Warning "Plink not found. Trying standard ssh (you may be prompted for password)."
    ssh "$User@$HostName" $RemoteScript
}

Write-Host "✨ Deployment script completed." -ForegroundColor Green
