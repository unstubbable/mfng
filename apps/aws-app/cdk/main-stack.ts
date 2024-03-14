import path from 'path';
import * as cdk from 'aws-cdk-lib';
import type {Construct} from 'constructs';

const verifyHeader = process.env.AWS_HANDLER_VERIFY_HEADER;
const distDirname = path.join(import.meta.dirname, `../dist/`);

export interface MainStackProps extends cdk.StackProps {
  readonly webAcl: cdk.aws_wafv2.CfnWebACL;
}

export class MainStack extends cdk.Stack {
  #webAcl: cdk.aws_wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: MainStackProps) {
    const {webAcl, ...otherProps} = props;
    super(scope, id, otherProps);
    this.#webAcl = webAcl;

    const lambdaFunction = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      `function`,
      {
        entry: path.join(distDirname, `handler/index.js`),
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        bundling: {format: cdk.aws_lambda_nodejs.OutputFormat.ESM},
        timeout: cdk.Duration.minutes(1),
        environment: verifyHeader
          ? {AWS_HANDLER_VERIFY_HEADER: verifyHeader}
          : undefined,
      },
    );

    const functionUrl = new cdk.aws_lambda.FunctionUrl(this, `function-url`, {
      function: lambdaFunction,
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
      invokeMode: cdk.aws_lambda.InvokeMode.RESPONSE_STREAM,
    });

    const bucket = new cdk.aws_s3.Bucket(this, `assets-bucket`, {
      bucketName: `mfng-aws-app-assets`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cdk.aws_cloudfront.Distribution(this, `cdn`, {
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.FunctionUrlOrigin(functionUrl, {
          customHeaders: verifyHeader
            ? {'X-Origin-Verify': verifyHeader}
            : undefined,
        }),
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
      webAclId: this.#webAcl.attrArn,
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

    new cdk.CfnOutput(this, `function-url-output`, {
      exportName: `function-url`,
      value: functionUrl.url,
    });

    new cdk.CfnOutput(this, `cdn-url-output`, {
      exportName: `cdn-url`,
      value: `https://${distribution.domainName}`,
    });
  }
}
