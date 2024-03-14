import * as cdk from 'aws-cdk-lib';
import {MainStack} from './main-stack.js';
import {WafStack} from './waf-stack.js';

const app = new cdk.App();

const wafStack = new WafStack(app, `mfng-waf`, {
  crossRegionReferences: true,
  env: {
    // For a web ACL with CLOUDFRONT scope, the WAF resources must be created in
    // the US East (N. Virginia) Region, us-east-1.
    region: `us-east-1`,
  },
});

new MainStack(app, `mfng-app`, {
  crossRegionReferences: true,
  env: {
    // Cross stack/region references are only supported for stacks with an
    // explicit region defined.
    region: process.env.AWS_REGION,
  },
  webAcl: wafStack.webAcl,
});
