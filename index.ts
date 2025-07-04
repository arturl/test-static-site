// Import required Pulumi packages for AWS infrastructure and file synchronization
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as synced_folder from "@pulumi/synced-folder";

// Import the program's configuration settings with sensible defaults
const config = new pulumi.Config();
const path = config.get("path") || "./www";  // Directory containing website files
const indexDocument = config.get("indexDocument") || "index.html";  // Homepage file
const errorDocument = config.get("errorDocument") || "error.html";  // 404 error page

// Create the primary S3 bucket that will host our static website
const bucket = new aws.s3.BucketV2("bucket");

// NOTE: The following buckets appear to be unused in this configuration
// Consider removing them if they're not needed for testing or future features
const bucket3 = new aws.s3.BucketV2("bucket3");
const bucket4 = new aws.s3.BucketV2("bucket4");

// Configure the S3 bucket to serve as a static website
// This enables S3's built-in web server functionality
const bucketWebsite = new aws.s3.BucketWebsiteConfigurationV2("bucketWebsite", {
    bucket: bucket.bucket,
    indexDocument: {suffix: indexDocument},  // Default page to serve (e.g., index.html)
    errorDocument: {key: errorDocument},     // Custom 404 error page
});

// Configure ownership controls for the S3 bucket
// "ObjectWriter" means the account that uploads an object owns it
const ownershipControls = new aws.s3.BucketOwnershipControls("ownership-controls", {
    bucket: bucket.bucket,
    rule: {
        objectOwnership: "ObjectWriter",
    },
});

// Configure public access settings for the S3 bucket
// Setting blockPublicAcls to false allows public read access for website files
const publicAccessBlock = new aws.s3.BucketPublicAccessBlock("public-access-block", {
    bucket: bucket.bucket,
    blockPublicAcls: false,  // Allow public ACLs (necessary for public website)
});

// Automatically sync local website files to the S3 bucket
// This creates a "synced folder" that uploads files and keeps them in sync
const bucketFolder = new synced_folder.S3BucketFolder("bucket-folder", {
    path: path,                    // Local directory to sync (default: ./www)
    bucketName: bucket.bucket,     // Target S3 bucket
    acl: "public-read",           // Make uploaded files publicly readable
}, { dependsOn: [ownershipControls, publicAccessBlock]});  // Wait for permissions to be set

// Create a CloudFront CDN distribution to serve the website globally
// This provides HTTPS, caching, and improved performance worldwide
const cdn = new aws.cloudfront.Distribution("cdn", {
    enabled: true,  // Enable the distribution
    
    // Define where CloudFront should fetch content from (the S3 website)
    origins: [{
        originId: bucket.arn,                          // Unique identifier for this origin
        domainName: bucketWebsite.websiteEndpoint,     // S3 website endpoint
        customOriginConfig: {
            originProtocolPolicy: "http-only",         // S3 website endpoints only support HTTP
            httpPort: 80,
            httpsPort: 443,
            originSslProtocols: ["TLSv1.2"],          // Modern TLS version
        },
    }],
    
    // Configure how CloudFront handles requests and caching
    defaultCacheBehavior: {
        targetOriginId: bucket.arn,                    // Which origin to fetch from
        viewerProtocolPolicy: "redirect-to-https",    // Force HTTPS for viewers
        
        // Allow standard web methods for static content
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],     // Which methods to cache
        
        // Cache settings - files cached for 10 minutes (600 seconds)
        defaultTtl: 600,  // Default cache duration
        maxTtl: 600,      // Maximum cache duration
        minTtl: 600,      // Minimum cache duration
        
        // Forward query strings and cookies to origin (useful for dynamic content)
        forwardedValues: {
            queryString: true,
            cookies: {
                forward: "all",
            },
        },
    },
    
    // Use the most cost-effective price class (North America and Europe only)
    priceClass: "PriceClass_100",
    
    // Configure custom error responses
    customErrorResponses: [{
        errorCode: 404,                               // When S3 returns 404
        responseCode: 404,                            // Return 404 to user
        responsePagePath: `/${errorDocument}`,       // Show custom error page
    }],
    
    // No geographic restrictions - serve content worldwide
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    
    // Use CloudFront's default SSL certificate (*.cloudfront.net)
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
});

// Export the URLs and hostnames so users can access their deployed website
// These values will be displayed after deployment completes

// Direct S3 website URL (HTTP only) - mainly for debugging
export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;

// CloudFront distribution URL (HTTPS enabled) - recommended for production use
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const cdnHostname = cdn.domainName;
