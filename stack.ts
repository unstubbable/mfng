import path from 'path';
import url from 'url';
import * as aws from '@cdktf/provider-aws';
import * as cloudflare from '@cdktf/provider-cloudflare';
import {
  App,
  AssetType,
  Fn,
  TerraformAsset,
  TerraformOutput,
  TerraformStack,
} from 'cdktf';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const app = new App();
const stack = new TerraformStack(app, `mfng`);

new aws.provider.AwsProvider(stack, `aws`);
new cloudflare.provider.CloudflareProvider(stack, `cloudflare`);

const asset = new TerraformAsset(stack, `lambda-asset`, {
  path: path.resolve(__dirname, `./dist/rsc-lambda`),
  type: AssetType.ARCHIVE,
});

const bucket = new aws.s3Bucket.S3Bucket(stack, `bucket`, {
  bucketPrefix: `mfng`,
});

const lambdaArchive = new aws.s3Object.S3Object(stack, `lambda-archive`, {
  bucket: bucket.bucket,
  key: asset.fileName,
  source: asset.path,
  sourceHash: asset.assetHash,
});

const role = new aws.iamRole.IamRole(stack, `lambda-exec`, {
  name: `mfng-lambda-exec`,
  assumeRolePolicy: JSON.stringify({
    Version: `2012-10-17`,
    Statement: [
      {
        Action: `sts:AssumeRole`,
        Principal: {
          Service: `lambda.amazonaws.com`,
        },
        Effect: `Allow`,
        Sid: ``,
      },
    ],
  }),
});

new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
  stack,
  `lambda-execution-role-policy`,
  {
    policyArn: `arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`,
    role: role.name,
  },
);

const lambda = new aws.lambdaFunction.LambdaFunction(stack, `rsc-lambda`, {
  functionName: `mfng-rsc-handler`,
  s3Bucket: bucket.bucket,
  s3Key: lambdaArchive.key,
  runtime: `nodejs18.x`,
  handler: `index.handler`,
  role: role.arn,
  sourceCodeHash: asset.assetHash,
  timeout: 30,
});

const api = new aws.apigatewayv2Api.Apigatewayv2Api(stack, `api-gateway`, {
  name: `mfng-web-socket-api`,
  protocolType: `WEBSOCKET`,
  routeSelectionExpression: `\\$default`,
});

const apiIntegration = new aws.apigatewayv2Integration.Apigatewayv2Integration(
  stack,
  `api-gateway-integration`,
  {
    apiId: api.id,
    integrationType: `AWS_PROXY`,
    integrationUri: lambda.invokeArn,
  },
);

new aws.apigatewayv2Route.Apigatewayv2Route(
  stack,
  `api-gateway-default-route`,
  {
    apiId: api.id,
    routeKey: `$default`,
    target: `integrations/${apiIntegration.id}`,
  },
);

const apiStage = new aws.apigatewayv2Stage.Apigatewayv2Stage(
  stack,
  `api-gateway-stage`,
  {apiId: api.id, name: `prod`, autoDeploy: true},
);

new aws.lambdaPermission.LambdaPermission(
  stack,
  `api-gateway-lambda-permission`,
  {
    functionName: lambda.functionName,
    action: `lambda:InvokeFunction`,
    principal: `apigateway.amazonaws.com`,
    sourceArn: `${api.executionArn}/*/*`,
  },
);

const webSocketUrl = apiStage.invokeUrl;

lambda.addOverride(`environment`, [
  {
    variables: {
      API_GATEWAY_URL: Fn.replace(
        webSocketUrl,
        `wss://`,
        Fn.rawString(`https://`),
      ),
    },
  },
]);

const lambdaApiGatewayPolicy = new aws.iamPolicy.IamPolicy(
  stack,
  `lambda-api-gateway-policy`,
  {
    policy: JSON.stringify({
      Version: `2012-10-17`,
      Statement: [
        {
          Action: [`execute-api:ManageConnections`],
          Effect: `Allow`,
          Resource: `${apiStage.executionArn}/*/@connections/*`,
        },
      ],
    }),
  },
);

new aws.iamPolicyAttachment.IamPolicyAttachment(
  stack,
  `lambda-api-gateway-policy-attachment`,
  {
    name: `API Gateway Manage Connections`,
    policyArn: lambdaApiGatewayPolicy.arn,
    roles: [role.name],
  },
);

new cloudflare.workerScript.WorkerScript(stack, `mfng-ws-worker`, {
  name: `mfng-ws`,
  content: Fn.file(path.resolve(__dirname, `./test-worker.js`)),
  module: true,
  plainTextBinding: [{name: `WEB_SOCKET_URL`, text: webSocketUrl}],
});

new TerraformOutput(stack, `url`, {value: webSocketUrl});

app.synth();
