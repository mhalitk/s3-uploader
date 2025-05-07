# S3 Presigned URL Uploader

A simple web application that allows users to upload files to an S3 bucket using a presigned URL. This is particularly useful when you want to allow someone to upload a file to your S3 bucket without giving them direct access to the bucket.

## Features

- Drag and drop file upload
- Progress bar to track upload status
- Clean and responsive UI
- No server-side code required (runs entirely in the browser)
- Works with any S3-compatible storage that supports presigned URLs

## Prerequisites

### IAM User Permissions

The IAM user generating the presigned URL needs these minimum permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["s3:PutObject", "s3:ListBucket"],
            "Resource": [
                "arn:aws:s3:::your-bucket-name/*",
                "arn:aws:s3:::your-bucket-name"
            ]
        }
    ]
}
```

### S3 Bucket CORS Configuration

Before using this application, you need to configure CORS on your S3 bucket to allow cross-origin requests:

1. Go to the AWS Management Console and navigate to the S3 service
2. Click on your bucket name
3. Go to the "Permissions" tab
4. Scroll down to the "Cross-origin resource sharing (CORS)" section and click "Edit"
5. Add the following CORS configuration:

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

**Security Note**: For production environments, replace `"*"` in `AllowedOrigins` with your specific domain (e.g., `"https://yourdomain.com"`) to restrict access.

## How to Use

### Option 1: Using the Included Node.js Script (Recommended)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up AWS Credentials**
   Make sure you have AWS credentials configured. You can set them as environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID='your_access_key'
   export AWS_SECRET_ACCESS_KEY='your_secret_key'
   export AWS_REGION='your_region'
   ```
   
   Or configure them using the AWS CLI:
   ```bash
   aws configure
   ```

3. **Generate a Presigned URL**
   ```bash
   node generate-presigned-url.js -b your-bucket-name -k path/to/your-file.ext -e 3600
   ```
   - `-b, --bucket`: Your S3 bucket name (required)
   - `-k, --key`: Object key (path and filename in the bucket) (required)
   - `-e, --expires-in`: URL expiration time in seconds (default: 3600)

### Option 2: Using AWS CLI (GET only)

If you prefer using the AWS CLI, note that it only generates GET presigned URLs by default. For PUT operations, use the Node.js script above.

```bash
aws s3 presign s3://your-bucket-name/your-file-name --expires-in 3600
```

2. **Open the Web Application**
   - Simply open the `index.html` file in a modern web browser.
   - Or host the files on a web server (no server-side processing required).

3. **Upload a File**
   - Paste the presigned URL in the input field
   - Drag and drop a file or click to select one
   - Click the "Upload to S3" button
   - Wait for the upload to complete

## Security Notes

- The presigned URL should be kept confidential as it grants upload access to your S3 bucket
- Set an appropriate expiration time when generating the presigned URL
- The application runs entirely in the browser - no files or URLs are sent to any server

## Browser Support

This application uses modern JavaScript features and is compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
