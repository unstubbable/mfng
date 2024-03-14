import * as cdk from 'aws-cdk-lib';
import type {Construct} from 'constructs';

export class WafStack extends cdk.Stack {
  #webAcl: cdk.aws_wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.#webAcl = new cdk.aws_wafv2.CfnWebACL(this, `waf`, {
      name: `mfng-waf`,
      scope: `CLOUDFRONT`,
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: false,
        metricName: `mfng-waf-metric`,
        sampledRequestsEnabled: true,
      },
    });
  }

  get webAcl(): cdk.aws_wafv2.CfnWebACL {
    return this.#webAcl;
  }
}
