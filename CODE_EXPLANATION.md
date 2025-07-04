# Code Explanation: Static Website Hosting on AWS

This document provides a comprehensive explanation of the Pulumi TypeScript code that sets up a static website hosting infrastructure on AWS.

## Overview

This is a Pulumi Infrastructure as Code (IaC) project written in TypeScript that creates a complete static website hosting solution on AWS. The infrastructure includes:

- **Amazon S3** for file storage and static website hosting
- **Amazon CloudFront** for content delivery network (CDN) and caching
- **Synced Folder** for automated file deployment

The result is a scalable, fast, and globally distributed static website with HTTPS support.

## Architecture Diagram

```
[Local Files] → [S3 Bucket] → [CloudFront CDN] → [Users Worldwide]
     |              |              |
   www/         Website Config   Global Cache
```

## Code Structure

### 1. Dependencies and Imports

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as synced_folder from "@pulumi/synced-folder";
```

- **@pulumi/pulumi**: Core Pulumi SDK for infrastructure orchestration
- **@pulumi/aws**: AWS provider for creating AWS resources
- **@pulumi/synced-folder**: Provider for syncing local files to cloud storage

### 2. Configuration Management

```typescript
const config = new pulumi.Config();
const path = config.get("path") || "./www";
const indexDocument = config.get("indexDocument") || "index.html";
const errorDocument = config.get("errorDocument") || "error.html";
```

**Purpose**: Allows customization without code changes
- `path`: Local directory containing website files (default: "./www")
- `indexDocument`: Homepage file (default: "index.html")
- `errorDocument`: 404 error page (default: "error.html")

### 3. S3 Bucket Creation

```typescript
const bucket = new aws.s3.BucketV2("bucket");
const bucket3 = new aws.s3.BucketV2("bucket3");
const bucket4 = new aws.s3.BucketV2("bucket4");
```

**Primary Bucket**: `bucket` is used for the website
**Additional Buckets**: `bucket3` and `bucket4` appear to be unused - possibly for testing or future features

### 4. Website Configuration

```typescript
const bucketWebsite = new aws.s3.BucketWebsiteConfigurationV2("bucketWebsite", {
    bucket: bucket.bucket,
    indexDocument: {suffix: indexDocument},
    errorDocument: {key: errorDocument},
});
```

**Purpose**: Configures the S3 bucket to serve as a static website
- Sets the default index document (homepage)
- Defines custom error page for 404 errors

### 5. Bucket Permissions and Access Control

#### Ownership Controls
```typescript
const ownershipControls = new aws.s3.BucketOwnershipControls("ownership-controls", {
    bucket: bucket.bucket,
    rule: {
        objectOwnership: "ObjectWriter",
    },
});
```

**Purpose**: Sets object ownership to "ObjectWriter" (the account that uploads objects owns them)

#### Public Access Configuration
```typescript
const publicAccessBlock = new aws.s3.BucketPublicAccessBlock("public-access-block", {
    bucket: bucket.bucket,
    blockPublicAcls: false,
});
```

**Purpose**: Allows public ACLs on the bucket (necessary for public website access)

### 6. File Synchronization

```typescript
const bucketFolder = new synced_folder.S3BucketFolder("bucket-folder", {
    path: path,
    bucketName: bucket.bucket,
    acl: "public-read",
}, { dependsOn: [ownershipControls, publicAccessBlock]});
```

**Purpose**: Automatically uploads files from local directory to S3
- **path**: Local directory to sync (./www by default)
- **acl**: "public-read" makes files publicly accessible
- **dependsOn**: Ensures permissions are set before uploading files

### 7. CloudFront CDN Distribution

```typescript
const cdn = new aws.cloudfront.Distribution("cdn", {
    enabled: true,
    origins: [{
        originId: bucket.arn,
        domainName: bucketWebsite.websiteEndpoint,
        customOriginConfig: {
            originProtocolPolicy: "http-only",
            httpPort: 80,
            httpsPort: 443,
            originSslProtocols: ["TLSv1.2"],
        },
    }],
    // ... additional configuration
});
```

#### Origins Configuration
- **originId**: Unique identifier for the S3 bucket origin
- **domainName**: S3 website endpoint as the content source
- **originProtocolPolicy**: "http-only" since S3 website endpoints only support HTTP

#### Cache Behavior
```typescript
defaultCacheBehavior: {
    targetOriginId: bucket.arn,
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD", "OPTIONS"],
    defaultTtl: 600,
    maxTtl: 600,
    minTtl: 600,
    forwardedValues: {
        queryString: true,
        cookies: { forward: "all" },
    },
}
```

**Key Settings**:
- **viewerProtocolPolicy**: Redirects HTTP to HTTPS for security
- **TTL values**: Cache content for 600 seconds (10 minutes)
- **allowedMethods**: Read-only operations for static content
- **forwardedValues**: Passes query strings and cookies to origin

#### Error Handling
```typescript
customErrorResponses: [{
    errorCode: 404,
    responseCode: 404,
    responsePagePath: `/${errorDocument}`,
}]
```

**Purpose**: Shows custom 404 page instead of CloudFront default error

#### Geographic and Certificate Settings
```typescript
restrictions: {
    geoRestriction: { restrictionType: "none" }
},
viewerCertificate: {
    cloudfrontDefaultCertificate: true
}
```

- **geoRestriction**: No geographic restrictions (worldwide access)
- **viewerCertificate**: Uses CloudFront's default SSL certificate

### 8. Exports

```typescript
export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const cdnHostname = cdn.domainName;
```

**Purpose**: Provides access to the website URLs after deployment
- **originURL**: Direct S3 website URL (HTTP)
- **cdnURL**: CloudFront distribution URL (HTTPS) - recommended for production

## Deployment Flow

1. **Infrastructure Creation**: Pulumi creates AWS resources in dependency order
2. **File Upload**: Synced folder uploads website files to S3
3. **DNS Propagation**: CloudFront distribution becomes available globally
4. **Ready**: Website accessible via both S3 and CloudFront URLs

## Configuration Options

You can customize the deployment using Pulumi configuration:

```bash
# Set custom website directory
pulumi config set path ./my-website

# Set custom index page
pulumi config set indexDocument home.html

# Set custom error page  
pulumi config set errorDocument 404.html
```

## Cost Considerations

- **S3**: Pay for storage and requests
- **CloudFront**: Pay for data transfer and requests
- **PriceClass_100**: Uses only North America and Europe edge locations (lowest cost tier)

## Security Features

- **HTTPS Enforcement**: CloudFront redirects HTTP to HTTPS
- **TLS 1.2**: Modern encryption protocol
- **Public Read Access**: Only necessary for website files, not the entire bucket

## Potential Improvements

1. **Remove unused buckets** (bucket3, bucket4)
2. **Add custom domain** with Route 53 and SSL certificate
3. **Implement origin access control** for better security
4. **Add compression** for better performance
5. **Configure caching headers** for different file types

## Troubleshooting

- **404 Errors**: Check that index.html exists in ./www directory
- **Access Denied**: Verify public access block settings
- **Slow Updates**: CloudFront cache may need invalidation after file changes