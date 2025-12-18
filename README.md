# QR Document Delivery System

A production-ready system for sharing multiple documents via a single QR code. Users scan the QR code and all files download automatically - no chat, no manual selection, just instant delivery.

## 🎯 Features

- **Multi-File Upload**: Upload PDFs, DOCX, images, videos, and archives
- **Single QR Code**: One QR code for all files
- **Automatic Download**: Files download as a ZIP when QR is scanned (one tap on iOS)
- **Secure**: Password protection, expiration dates, rate limiting
- **Analytics**: Track QR scans and downloads
- **Multi-Language**: English, Spanish, French, German, Hindi
- **Branding**: Customize with your brand name
- **Mobile Optimized**: Works perfectly on all mobile browsers

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Edit `.env` if needed to change port or upload limits.

### 3. Start Server

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Server will run on **http://localhost:3000**

## 📱 How to Use

### Upload Files

1. Open **http://localhost:3000**
2. Drag and drop files or click to select
3. Configure settings:
   - Expiration (1-30 days)
   - Language
   - Brand name
   - Password (optional)
4. Click "Generate QR Code"
5. Share the QR code or URL

### Download Files

1. Scan QR code with mobile device
2. Enter password if required
3. Click "Download All Files"
4. Files download as a ZIP archive

## 🏗️ Architecture

```
/PHONE/scan
├── server.js              # Main Express server
├── models/
│   └── database.js        # SQLite database
├── routes/
│   ├── upload.js          # File upload API
│   ├── download.js        # File download API
│   └── analytics.js       # Analytics API
├── utils/
│   ├── qr-generator.js    # QR code generation
│   └── token-generator.js # Security utilities
├── public/
│   ├── index.html         # Upload interface
│   ├── download.html      # Download page
│   ├── css/styles.css     # Styling
│   └── js/
│       ├── upload.js      # Upload logic
│       └── download.js    # Download logic
└── uploads/               # Uploaded files (auto-created)
```

## 🔧 API Endpoints

### Upload Files
```
POST /api/upload
Body: FormData with files, expirationDays, password, brandName, language
Response: { shareId, shareUrl, qrCode, ... }
```

### Get Share Info
```
GET /api/download/:shareId
Response: { brandName, requiresPassword, fileCount, files }
```

### Download All Files (ZIP)
```
GET /api/download/:shareId/zip?password=xxx
Response: ZIP file
```

### Download Single File
```
GET /api/download/:shareId/file/:fileId?password=xxx
Response: File
```

### Get Analytics
```
GET /api/analytics/:shareId
Response: { events: { qr_scan, download_zip, ... } }
```

## 🔒 Security Features

- **Password Protection**: Optional bcrypt hashed passwords
- **Expiration**: Automatic cleanup of expired shares
- **Rate Limiting**: Prevents abuse (100 requests per 15 min)
- **File Validation**: Only allowed file types accepted
- **Secure Tokens**: Cryptographically random share IDs
- **Helmet**: Security headers enabled

## 📊 Configuration

Edit `.env` to customize:

- `PORT`: Server port (default: 3000)
- `MAX_FILE_SIZE`: Max single file size in bytes (default: 100MB)
- `DEFAULT_EXPIRATION_DAYS`: Default share expiration (default: 7 days)
- `BASE_URL`: Public URL for QR codes

## 🌐 Deployment

### For Production:

1. **Use HTTPS** (required for QR scanning)
2. **Change BASE_URL** in `.env` to your domain
3. **Use PostgreSQL** instead of SQLite for better performance
4. **Use cloud storage** (AWS S3, Google Cloud) for files
5. **Add monitoring** (error logging, analytics)

### Example with Heroku:

```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set BASE_URL=https://your-app-name.herokuapp.com
git push heroku main
```

## 📱 Mobile Browser Compatibility

- **Android (Chrome)**: Automatic ZIP download ✅
- **iOS (Safari)**: One-tap download button ✅
- **All Browsers**: Individual file download buttons as fallback ✅

## 🧪 Testing

1. Upload test files on desktop
2. Scan QR code with mobile device
3. Verify automatic download
4. Test password protection
5. Check analytics tracking

## 🛠️ Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (upgradable to PostgreSQL)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **QR Generation**: qrcode library
- **File Handling**: multer, archiver
- **Security**: bcrypt, helmet, express-rate-limit

## 📝 License

MIT

## 🔗 Repository

GitHub: https://github.com/gurusaiss/QR_scan

## 🙋‍♂️ Support

For issues or questions, check:
- Server logs in console
- Browser console for frontend errors
- Database file: `database.db`
- Uploaded files: `uploads/` directory

---

**Made with ❤️ for seamless document sharing**
