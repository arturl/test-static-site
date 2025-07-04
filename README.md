# Static Website Hosting on AWS

A Pulumi TypeScript project that creates a complete static website hosting infrastructure on AWS using S3 and CloudFront.

## Architecture

This project sets up:
- **Amazon S3** bucket configured for static website hosting
- **CloudFront CDN** for global content distribution and HTTPS
- **Automated file sync** from local directory to S3

## Quick Start

### Prerequisites
- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Node.js](https://nodejs.org/) (v16 or later)

### Deploy the Website

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Pulumi stack:**
   ```bash
   pulumi stack init dev
   ```

3. **Configure AWS region:**
   ```bash
   pulumi config set aws:region us-west-2
   ```

4. **Deploy the infrastructure:**
   ```bash
   pulumi up
   ```

5. **Access your website:**
   - S3 Origin URL: `http://your-bucket.s3-website-region.amazonaws.com`
   - CloudFront CDN URL: `https://your-distribution.cloudfront.net` (recommended)

## Configuration Options

Customize your deployment with Pulumi configuration:

```bash
# Set custom website directory (default: ./www)
pulumi config set path ./my-website

# Set custom index page (default: index.html)
pulumi config set indexDocument home.html

# Set custom error page (default: error.html)
pulumi config set errorDocument 404.html
```

## Project Structure

```
├── index.ts              # Main Pulumi program
├── www/                  # Website files directory
│   ├── index.html       # Homepage
│   └── error.html       # 404 error page
├── package.json         # Node.js dependencies
├── Pulumi.yaml         # Pulumi project configuration
└── README.md           # This file
```

## Website Files

Place your static website files in the `www/` directory:
- HTML files
- CSS stylesheets  
- JavaScript files
- Images and other assets

These files will be automatically uploaded to S3 and served via CloudFront.

## Features

- ✅ **Global CDN**: CloudFront distribution for fast worldwide access
- ✅ **HTTPS Support**: Automatic HTTPS with CloudFront default certificate
- ✅ **Custom Error Pages**: Configurable 404 error handling
- ✅ **Automatic Sync**: Local files automatically uploaded to S3
- ✅ **Cost Optimized**: Uses most cost-effective CloudFront price class

## Management Commands

```bash
# View current stack outputs
pulumi stack output

# Update website files (re-run after changing files in www/)
pulumi up

# Delete all resources
pulumi destroy
```

## Detailed Code Explanation

For a comprehensive explanation of how this code works, see [CODE_EXPLANATION.md](./CODE_EXPLANATION.md).

## Cost Estimation

This setup uses AWS Free Tier eligible services where possible:
- **S3**: First 5GB free, then ~$0.023/GB/month
- **CloudFront**: First 1TB free per month for data transfer
- **Route 53**: $0.50/month per hosted zone (if custom domain added)

## Security

- Public read access is limited to website files only
- HTTPS enforcement via CloudFront
- Modern TLS 1.2 encryption
- No unnecessary permissions or access

## Support

For issues with this template, please check:
1. [Pulumi Documentation](https://www.pulumi.com/docs/)
2. [AWS S3 Static Website Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
3. [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
