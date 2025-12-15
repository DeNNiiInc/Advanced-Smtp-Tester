# Advanced SMTP Tester

A powerful desktop application for testing SMTP configurations with support for multiple providers, dark mode, test history, and enhanced error messages.

## Features

### 🎨 User Interface
- **Dark/Light Mode** - Toggle between themes with persistence
- **Configuration Presets** - Quick-load for Office 365, Gmail, SendGrid, Mailgun, Amazon SES
- **Test History** - Last 50 tests with click-to-load
- **Enhanced Errors** - Helpful troubleshooting tips for common issues

### 🖥️ Desktop Application
- **Native Windows App** - Runs in its own window (no browser needed)
- **System Tray** - Minimize to tray, quick access
- **Menu Bar** - Full application menu
- **Auto-Start Server** - Express server starts automatically

### 📧 SMTP Testing
- **Multiple Encryption** - STARTTLS, SSL/TLS, Unencrypted
- **Auto-Discovery** - Test multiple port/encryption combinations
- **Beautiful Emails** - Professional HTML test emails
- **Detailed Results** - Full response logs and error messages

## Installation

### Desktop App (Windows)
1. Download the latest release from [Releases](https://github.com/DeNNiiInc/Advanced-Smtp-Tester/releases)
2. Extract the ZIP file
3. Run `Advanced-SMTP-Tester.exe`

### Web Version
```bash
npm install
npm start
```
Open `http://localhost:3000` in your browser.

### Electron Development
```bash
npm install
npm run electron
```

## Building from Source

### Web Version
```bash
npm install
npm start
```

### Desktop App
```bash
npm install
npm run build
```

Or use electron-packager:
```bash
npx electron-packager . "Advanced-SMTP-Tester" --platform=win32 --arch=x64 --out=dist --overwrite
```

## Usage

### Quick Start
1. Select a preset (e.g., "Microsoft Office 365")
2. Enter your credentials
3. Enter recipient email
4. Click "Test Configuration & Send Email"

### Configuration Presets
- **Office 365**: `smtp.office365.com:587` (STARTTLS)
- **Gmail**: `smtp.gmail.com:587` (STARTTLS)
- **SendGrid**: `smtp.sendgrid.net:587` (STARTTLS)
- **Mailgun**: `smtp.mailgun.org:587` (STARTTLS)
- **Amazon SES**: `email-smtp.us-east-1.amazonaws.com:587` (STARTTLS)

### Auto-Discovery
Click "Auto Discovery Test" to automatically test multiple port/encryption combinations.

## Development

### Project Structure
```
Advanced-Smtp-Tester/
├── electron-main.js      # Electron entry point
├── server.js             # Express server
├── index.html            # Main UI
├── public/
│   ├── db.js            # IndexedDB wrapper
│   ├── script.js        # Frontend logic
│   ├── styles.css       # Styling
│   └── Logo.png         # App icon
└── .github/
    └── workflows/
        └── build-desktop.yml  # Automated builds
```

### Scripts
- `npm start` - Start web server
- `npm run electron` - Run desktop app
- `npm run build` - Build Windows installer
- `npm run build:dir` - Build unpacked directory

## Technologies

- **Backend**: Node.js, Express, Nodemailer
- **Frontend**: Vanilla JavaScript, IndexedDB
- **Desktop**: Electron
- **Build**: electron-builder, electron-packager

## License

ISC

## Author

Beyond Cloud Technology

## Links

- [GitHub Repository](https://github.com/DeNNiiInc/Advanced-Smtp-Tester)
- [YouTube Channel](https://www.youtube.com/@beyondcloudtechnology)
