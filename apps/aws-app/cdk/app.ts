import * as cdk from 'aws-cdk-lib';
import './env.js';
import {Stack} from './stack.js';

const app = new cdk.App();

new Stack(app, `mfng-app`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    // A certificate for CloudFront must be created in the US East (N. Virginia)
    // Region, us-east-1.
    region: `us-east-1`,
  },
  bucketName: `mfng-app-assets`,
  customDomain: {domainName: `strict.software`, subdomainName: `mfng`},
});
