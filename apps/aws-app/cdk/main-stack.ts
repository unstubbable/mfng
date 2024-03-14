import path from 'path';
import * as cdk from 'aws-cdk-lib';
import type {Construct} from 'constructs';

const distDirname = path.join(import.meta.dirname, `../dist/`);

export interface MainStackProps extends cdk.StackProps {
  readonly bucketName: string;
  readonly customDomain?: {
    readonly domainName: string;
    readonly subdomainName: string;
  };
  readonly webAcl?: cdk.aws_wafv2.CfnWebACL;
}

export class MainStack extends cdk.Stack {
  #webAcl: cdk.aws_wafv2.CfnWebACL | undefined;

  constructor(scope: Construct, id: string, props: MainStackProps) {
    const {bucketName, customDomain, webAcl, ...otherProps} = props;
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
        environment: {
          AWS_HANDLER_VERIFY_HEADER: process.env.AWS_HANDLER_VERIFY_HEADER,
          GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY,
          GOOGLE_SEARCH_SEARCH_ENGINE_ID:
            process.env.GOOGLE_SEARCH_SEARCH_ENGINE_ID,
          UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
          UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        },
      },
    );

    const functionUrl = new cdk.aws_lambda.FunctionUrl(this, `function-url`, {
      function: lambdaFunction,
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
      invokeMode: cdk.aws_lambda.InvokeMode.RESPONSE_STREAM,
    });

    const bucket = new cdk.aws_s3.Bucket(this, `assets-bucket`, {
      bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const customDomainName = customDomain
      ? `${customDomain.subdomainName}.${customDomain.domainName}`
      : undefined;

    const certificate = customDomainName
      ? new cdk.aws_certificatemanager.Certificate(this, `certificate`, {
          domainName: customDomainName,
        })
      : undefined;

    const distribution = new cdk.aws_cloudfront.Distribution(this, `cdn`, {
      certificate,
      domainNames: customDomainName ? [customDomainName] : undefined,
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.FunctionUrlOrigin(functionUrl, {
          customHeaders: {
            'X-Origin-Verify': process.env.AWS_HANDLER_VERIFY_HEADER,
          },
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
      webAclId: this.#webAcl?.attrArn,
    });

    if (customDomain) {
      const hostedZone = cdk.aws_route53.HostedZone.fromLookup(
        this,
        `hosted-zone-lookup`,
        {domainName: customDomain.domainName},
      );

      new cdk.aws_route53.ARecord(this, `a-record`, {
        zone: hostedZone,
        recordName: customDomain.subdomainName,
        target: cdk.aws_route53.RecordTarget.fromAlias(
          new cdk.aws_route53_targets.CloudFrontTarget(distribution),
        ),
      });

      new cdk.aws_route53.AaaaRecord(this, `aaaa-record`, {
        zone: hostedZone,
        recordName: customDomain.subdomainName,
        target: cdk.aws_route53.RecordTarget.fromAlias(
          new cdk.aws_route53_targets.CloudFrontTarget(distribution),
        ),
      });
    }

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
      value: functionUrl.url,
    });

    new cdk.CfnOutput(this, `cdn-cloudfront-url-output`, {
      value: `https://${distribution.domainName}`,
    });

    if (customDomainName) {
      new cdk.CfnOutput(this, `cdn-custom-domain-url-output`, {
        value: `https://${customDomainName}`,
      });
    }
  }
}
