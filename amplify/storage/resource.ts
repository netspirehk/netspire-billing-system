import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'netspireBillingStorage',
  access: (allow) => ({
    'invoices/*': [
      allow.authenticated.to(['read']),
      allow.groups(['admin', 'billing']).to(['read', 'write', 'delete'])
    ],
    'reports/*': [
      allow.authenticated.to(['read']),
      allow.groups(['admin', 'billing']).to(['read', 'write', 'delete'])
    ],
    'attachments/*': [
      allow.authenticated.to(['read']),
      allow.groups(['admin', 'billing']).to(['read', 'write', 'delete'])
    ],
    'templates/*': [
      allow.groups(['admin']).to(['read', 'write', 'delete']),
      allow.groups(['billing']).to(['read'])
    ]
  })
});