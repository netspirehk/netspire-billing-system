import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
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