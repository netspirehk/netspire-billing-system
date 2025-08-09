import { defineBackend, defineFunction, secret } from '@aws-amplify/backend';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

// Resend secret and email function
const RESEND_API_KEY = secret('RESEND_API_KEY');

const sendEmailFunction = defineFunction({
  name: 'send-email',
  entry: './functions/send-email/handler.ts',
  environment: {
    RESEND_API_KEY,
  },
});

export const backend = defineBackend({
  auth,
  data,
  storage,
  sendEmailFunction,
});

// Extract L1 CDK resources
const { cfnUserPool } = backend.auth.resources.cfnResources;

// Configure user pool settings
cfnUserPool.addPropertyOverride('Policies', {
  PasswordPolicy: {
    MinimumLength: 8,
    RequireLowercase: true,
    RequireNumbers: true,
    RequireSymbols: false,
    RequireUppercase: true,
  },
});

// Add custom attributes for user roles
cfnUserPool.addPropertyOverride('Schema', [
  {
    Name: 'email',
    AttributeDataType: 'String',
    Required: true,
    Mutable: true,
  },
  {
    Name: 'name',
    AttributeDataType: 'String',
    Required: true,
    Mutable: true,
  },
  {
    Name: 'role',
    AttributeDataType: 'String',
    Required: false,
    Mutable: true,
  },
]);

// Allow the Lambda function to be called via Function URL with permissive CORS
const lambdaFn = backend.sendEmailFunction.resources.lambda;
lambdaFn.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ['*'],
  },
});

// Grant the function read access to S3 so it can fetch invoice PDFs by pre-signed URL if needed later
backend.storage.resources.bucket.grantRead(lambdaFn);