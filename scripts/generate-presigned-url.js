// Using CommonJS require for better compatibility
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { program } = require('commander');
const { fromIni } = require('@aws-sdk/credential-provider-ini');

// Enable debug logging if DEBUG environment variable is set
const debug = process.env.DEBUG === 'true';
const log = (...args) => debug && console.log('[DEBUG]', ...args);

async function generatePresignedUrl(bucket, key, expiresIn = 3600) {
    try {
        log('Generating presigned URL with parameters:', { bucket, key, expiresIn });
        
        // Get AWS credentials
        const credentials = await fromIni({ profile: process.env.AWS_PROFILE })();
        log('Using AWS credentials for access key:', credentials.accessKeyId);

        // Create S3 client with explicit credentials
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials,
            logger: debug ? console : undefined
        });

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            // Explicitly set content type
            ContentType: 'application/octet-stream',
            // Add any required metadata
            Metadata: {
                'x-amz-meta-uploaded-by': 's3-uploader'
            }
        });

        log('Created PutObjectCommand with parameters:', {
            Bucket: bucket,
            Key: key,
            ContentType: 'application/octet-stream'
        });

        const url = await getSignedUrl(s3Client, command, { 
            expiresIn,
            // Force path-style URLs
            signableHeaders: new Set()
        });

        log('Successfully generated presigned URL');
        return url;
    } catch (error) {
        console.error('❌ Error generating presigned URL:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.$metadata) {
            console.error('Request ID:', error.$metadata.requestId);
            console.error('HTTP Status Code:', error.$metadata.httpStatusCode);
        }
        
        if (error.name === 'SignatureDoesNotMatch') {
            console.error('\n🔑 Signature Mismatch: This usually indicates an issue with your AWS credentials.');
            console.error('   - Check if your credentials are valid and have not expired');
            console.error('   - Verify the AWS region matches your bucket\'s region');
            console.error('   - Ensure your system clock is synchronized');
        } else if (error.name === 'AccessDenied') {
            console.error('\n🔒 Access Denied: The IAM user does not have sufficient permissions');
            console.error('   - Check if the IAM user has s3:PutObject permission');
            console.error('   - Verify the bucket policy allows the operation');
        }
        
        throw error;
    }
}

program
    .requiredOption('-b, --bucket <bucket>', 'S3 bucket name')
    .requiredOption('-k, --key <key>', 'Object key (path and filename in the bucket)')
    .option('-e, --expires-in <seconds>', 'URL expiration time in seconds', '3600')
    .parse(process.argv);

const options = program.opts();

generatePresignedUrl(options.bucket, options.key, parseInt(options.expiresIn))
    .then(url => {
        console.log('Generated PUT presigned URL:');
        console.log(url);
    })
    .catch(err => {
        console.error('Failed to generate URL:', err);
        process.exit(1);
    });
