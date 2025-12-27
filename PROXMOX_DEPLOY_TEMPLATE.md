# 🚀 Proxmox Deployment Automation (TurnKey Node.js)

**Use this guide to deploy your project to a TurnKey Linux LXC Container.**

This project uses an **automated deployment system** that handles:
-   Initial server setup (Dependencies, Nginx, PM2, Cron).
-   Automatic updates via Git (Every 5 minutes).
-   Seamess updates using PM2.

---

## 📋 Prerequisites

1.  **Server**: A Proxmox TurnKey Node.js Container.
2.  **Access**: Root SSH password for the container.
3.  **Local Files**: Ensure you have `deploy-secrets.json` created (see below).

---

## 🛠️ Step 1: Configure Secrets

Create a file named `deploy-secrets.json` in the project root. **This file is gitignored** and safe to store locally.

```json
{
  "host": "172.16.69.217",
  "username": "root",
  "password": "YOUR_SSH_PASSWORD",
  "gitUser": "YOUR_GITHUB_EMAIL",
  "gitToken": "YOUR_GITHUB_TOKEN",
  "repoUrl": "https://github.com/YOUR_ORG/YOUR_REPO.git"
}
```

---

## 🚀 Step 2: Run Deployment

Open PowerShell in the project root and run:

```powershell
./deploy-to-proxmox.ps1
```

**That's it!** The script will:
1.  Connect to your server.
2.  Clone the repository using your token.
3.  Install all dependencies (Git, Nginx, PM2).
4.  Configure Nginx as a reverse proxy (Port 80 -> 4001).
5.  Set up a Cron job to auto-sync changes every 5 minutes.

---

## 🔄 How Updates Work

The server runs a cron job (`scripts/sync-and-restart.sh`) every 5 minutes that:
1.  Checks GitHub for changes.
2.  If changes are found:
    -   Pulls the new code.
    -   Installs dependencies (if `package.json` changed).
    -   Restarts the application via PM2.

To update your live site, simply **Push to GitHub** and wait ~5 minutes.

---

## � Troubleshooting

**View Logs:**
```bash
ssh root@<SERVER_IP> "cat /var/log/smtp-tester-sync.log"
```

**Manual Update:**
```bash
ssh root@<SERVER_IP> "/var/www/Advanced-Smtp-Tester/scripts/sync-and-restart.sh"
```
