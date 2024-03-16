import path from 'path';
import * as cdk from 'aws-cdk-lib';
import type {Construct} from 'constructs';

const distDirname = path.join(import.meta.dirname, `../dist/`);

export interface StackProps extends cdk.StackProps {
  readonly bucketName: string;
  readonly customDomain?: {
    readonly domainName: string;
    readonly subdomainName: string;
  };
}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    const {bucketName, customDomain, ...otherProps} = props;
    super(scope, id, otherProps);

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
        },
        memorySize: 1769, // equivalent of one vCPU
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

    const customDomainName =
      customDomain &&
      `${customDomain.subdomainName}.${customDomain.domainName}`;

    const hostedZone =
      customDomain &&
      cdk.aws_route53.HostedZone.fromLookup(this, `hosted-zone-lookup`, {
        domainName: customDomain.domainName,
      });

    const distribution = new cdk.aws_cloudfront.Distribution(this, `cdn`, {
      certificate:
        customDomainName && hostedZone
          ? new cdk.aws_certificatemanager.Certificate(this, `certificate`, {
              domainName: customDomainName,
              validation:
                cdk.aws_certificatemanager.CertificateValidation.fromDns(
                  hostedZone,
                ),
            })
          : undefined,
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
        viewerProtocolPolicy:
          cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: new cdk.aws_cloudfront.ResponseHeadersPolicy(
          this,
          `response-headers-policy`,
          {
            securityHeadersBehavior: {
              frameOptions: {
                frameOption: cdk.aws_cloudfront.HeadersFrameOption.DENY,
                override: true,
              },
              strictTransportSecurity: {
                accessControlMaxAge: cdk.Duration.days(365),
                includeSubdomains: true,
                override: true,
              },
            },
          },
        ),
      },
      additionalBehaviors: {
        '/client/*': {
          origin: new cdk.aws_cloudfront_origins.S3Origin(bucket),
          cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy:
            cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      priceClass: cdk.aws_cloudfront.PriceClass.PRICE_CLASS_100,
    });

    if (customDomain && hostedZone) {
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
      distributionPaths: [`/client/*`],
      cacheControl: [
        cdk.aws_s3_deployment.CacheControl.setPublic(),
        cdk.aws_s3_deployment.CacheControl.maxAge(cdk.Duration.days(365)),
        cdk.aws_s3_deployment.CacheControl.immutable(),
      ],
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
