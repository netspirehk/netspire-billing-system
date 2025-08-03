import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['admin', 'billing', 'viewer'],
  access: (allow) => [
    // Admin can manage everything
    allow.group('admin').to(['manageUsers', 'manageGroups']),
    
    // Billing can manage billing data but not users
    allow.group('billing'),
    
    // Viewer can only read data
    allow.group('viewer'),
  ],
});