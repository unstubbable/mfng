import path from 'path';
import * as cdk from 'aws-cdk-lib';
import type {Construct} from 'constructs';

const distDirname = path.join(import.meta.dirname, `../dist/`);

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunction = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      `function`,
      {
        entry: path.join(distDirname, `handler/index.js`),
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        bundling: {format: cdk.aws_lambda_nodejs.OutputFormat.ESM},
        timeout: cdk.Duration.seconds(28),
      },
    );

    const lambdaFunctionUrl = new cdk.aws_lambda.FunctionUrl(
      this,
      `function-url`,
      {
        function: lambdaFunction,
        authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
        invokeMode: cdk.aws_lambda.InvokeMode.RESPONSE_STREAM,
      },
    );

    const bucket = new cdk.aws_s3.Bucket(this, `assets-bucket`, {
      bucketName: `mfng-aws-app-assets`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cdk.aws_cloudfront.Distribution(this, `cdn`, {
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.FunctionUrlOrigin(
          lambdaFunctionUrl,
        ),
        allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: new cdk.aws_cloudfront.CachePolicy(this, `cache-policy`, {
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          queryStringBehavior:
            cdk.aws_cloudfront.CacheQueryStringBehavior.all(),
          headerBehavior:
            cdk.aws_cloudfront.CacheHeaderBehavior.allowList(`accept`),
        }),
        originRequestPolicy:
          cdk.aws_cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      additionalBehaviors: {
        '/client/*': {
          origin: new cdk.aws_cloudfront_origins.S3Origin(bucket),
          cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      priceClass: cdk.aws_cloudfront.PriceClass.PRICE_CLASS_100,
    });

    new cdk.aws_s3_deployment.BucketDeployment(this, `assets-deployment`, {
      destinationBucket: bucket,
      destinationKeyPrefix: `client`,
      sources: [
        cdk.aws_s3_deployment.Source.asset(
          path.join(distDirname, `static/client`),
        ),
      ],
      distribution,
      cacheControl: [cdk.aws_s3_deployment.CacheControl.immutable()],
    });

    new cdk.CfnOutput(this, `cdn-domain-name`, {
      value: distribution.domainName,
    });
  }
}

const app = new cdk.App();

new Stack(app, `mfng-aws-app`);
