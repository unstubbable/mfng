import * as cdk from 'aws-cdk-lib';
import type {Construct} from 'constructs';

export interface WafStackProps extends cdk.StackProps {
  readonly webAclName: string;
}

export class WafStack extends cdk.Stack {
  #webAcl: cdk.aws_wafv2.CfnWebACL;
  #webAclName: string;
  #rulePriority = 0;

  constructor(scope: Construct, id: string, props: WafStackProps) {
    const {webAclName, ...otherProps} = props;
    super(scope, id, otherProps);
    this.#webAclName = webAclName;

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
        this.#createWebAclRule({
          name: `request-body-size-limit`,
          statement: {
            sizeConstraintStatement: {
              fieldToMatch: {body: {}},
              comparisonOperator: `GT`,
              size: 1024,
              textTransformations: [{priority: 0, type: `NONE`}],
            },
          },
          action: {block: {customResponse: {responseCode: 413}}},
        }),
        this.#createWebAclRule({
          name: `rate-limit`,
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
        }),
      ],
    });
  }

  get webAcl(): cdk.aws_wafv2.CfnWebACL {
    return this.#webAcl;
  }

  #createWebAclRule(
    rule: Omit<
      cdk.aws_wafv2.CfnWebACL.RuleProperty,
      'priority' | 'visibilityConfig'
    >,
  ): cdk.aws_wafv2.CfnWebACL.RuleProperty {
    return {
      ...rule,
      priority: (this.#rulePriority += 1),
      visibilityConfig: {
        cloudWatchMetricsEnabled: false,
        metricName: `${this.#webAclName}-${rule.name}`,
        sampledRequestsEnabled: true,
      },
    };
  }
}
