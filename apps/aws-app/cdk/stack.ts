import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as path from 'path';

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunction = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'function',
      {
        entry: path.join(import.meta.dirname, '../dist/handler/index.js'),
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        bundling: {format: cdk.aws_lambda_nodejs.OutputFormat.ESM},
        timeout: cdk.Duration.seconds(28),
      },
    );

    const lambdaFunctionUrl = new cdk.aws_lambda.CfnUrl(this, 'function-url', {
      targetFunctionArn: lambdaFunction.functionArn,
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
      invokeMode: 'RESPONSE_STREAM',
    });

    lambdaFunction.addPermission('invoke-function-url', {
      principal: new cdk.aws_iam.AnyPrincipal(),
      action: 'lambda:InvokeFunctionUrl',
      functionUrlAuthType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
    });

    const distribution = new cdk.aws_cloudfront.Distribution(this, 'cdn', {
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.HttpOrigin(
          cdk.Fn.select(
            2,
            cdk.Fn.split('/', lambdaFunctionUrl.attrFunctionUrl),
          ),
        ),
        allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: new cdk.aws_cloudfront.CachePolicy(this, 'cache-policy', {
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          queryStringBehavior:
            cdk.aws_cloudfront.CacheQueryStringBehavior.all(),
        }),
      },
      priceClass: cdk.aws_cloudfront.PriceClass.PRICE_CLASS_100,
    });

    new cdk.CfnOutput(this, 'cdn-domain-name', {
      value: distribution.domainName,
    });
  }
}

const app = new cdk.App();

new Stack(app, 'mfng-aws-app');
