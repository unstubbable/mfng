import * as cdk from 'aws-cdk-lib';
import type {Construct} from 'constructs';

export interface WafStackProps extends cdk.StackProps {
  readonly webAclName: string;
}

export class WafStack extends cdk.Stack {
  #webAcl: cdk.aws_wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WafStackProps) {
    const {webAclName, ...otherProps} = props;
    super(scope, id, otherProps);

    this.#webAcl = new cdk.aws_wafv2.CfnWebACL(this, `waf`, {
      name: webAclName,
      scope: `CLOUDFRONT`,
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: false,
        metricName: webAclName,
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          priority: 1,
          name: `rate-limit`,
          visibilityConfig: {
            cloudWatchMetricsEnabled: false,
            metricName: `${webAclName}-rate-limit`,
            sampledRequestsEnabled: true,
          },
          statement: {
            rateBasedStatement: {
              aggregateKeyType: `CONSTANT`,
              limit: 100, // 100 is the minimum
              scopeDownStatement: {
                byteMatchStatement: {
                  fieldToMatch: {method: {}},
                  positionalConstraint: `EXACTLY`,
                  searchString: `POST`,
                  textTransformations: [{priority: 0, type: `NONE`}],
                },
              },
            },
          },
          action: {block: {customResponse: {responseCode: 429}}},
        },
      ],
    });
  }

  get webAcl(): cdk.aws_wafv2.CfnWebACL {
    return this.#webAcl;
  }
}
