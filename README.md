# S3 Presigned URL Uploader

## 🌐 Live Demo

Try the hosted app here: [https://mhalitk.github.io/s3-uploader/](https://mhalitk.github.io/s3-uploader/)

A simple, user-friendly web application for uploading files directly to Amazon S3 using presigned URLs. This is ideal for securely allowing uploads to your S3 bucket without exposing AWS credentials or needing backend infrastructure.

---

## 🚀 Web Application

**Features:**
- Drag-and-drop file upload
- Progress bar for upload status
- Clean, responsive UI
- No server-side code required (runs entirely in the browser)
- Works with any valid S3 presigned URL (including those generated elsewhere)

**How it works:**
1. Obtain a presigned URL for your S3 bucket/object (see below for how to generate one, or use your own).
2. Open the web application (`index.html`) in your browser.
3. Paste the presigned URL, select or drag a file, and click “Upload”.
4. Watch the progress bar and receive instant feedback on success or error.

---

## 🛠️ Getting Started

### 1. Clone and Open

```sh
git clone https://github.com/mhalitk/s3-uploader.git
cd s3-uploader
```

Open `index.html` directly in your browser, or serve it with a static server (for example, with Python):

```sh
python3 -m http.server 8080
# Then visit http://localhost:8080 in your browser
```

### 2. Configure S3 Bucket

#### CORS Configuration

Your S3 bucket must allow CORS for uploads from your web app. Add this to your bucket’s CORS settings:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```
> For production, restrict `"AllowedOrigins"` to your domain.

#### IAM Permissions

The IAM user generating presigned URLs needs at least:

```json
{
    "Effect": "Allow",
    "Action": ["s3:PutObject"],
    "Resource": [
        "arn:aws:s3:::your-bucket-name/*"
    ]
}
```

---

## 🧰 Utility: Presigned URL Generation Script

If you don’t already have a way to generate presigned URLs, this package includes a Node.js CLI utility:

**Usage:**
```sh
cd scripts
npm install
node generate-presigned-url.js -b your-bucket-name -k path/in/bucket/filename.ext
```

**Requirements:**
- Node.js v14+
- AWS credentials configured (via environment or AWS CLI)

**Note:** You can use any other method or language to generate presigned URLs—this script is provided for convenience.

---

## 📦 Project Structure

```
/s3uploader
  ├── index.html         # Main web application
  ├── script.js          # Web app logic
  ├── styles.css         # Web app styles
  ├── scripts/           # Node.js utility for presigned URLs
  └── README.md
```

---

## 🤝 Contributing

Pull requests and suggestions are welcome! Please open an issue or PR if you have ideas for improvement.

---

## 📄 License

MIT
