import { handler } from './pre_signup_lambda.mjs';
const event = {
  triggerSource: 'PreSignUp_ExternalProvider',
  userPoolId: 'ap-southeast-2_oQSXJHFz9',
  request: {
    userAttributes: {
      email: 'test@test.com',
      email_verified: 'true',
      identities: JSON.stringify([{ providerName: 'SNOMEDINTERNATIONAL', userId: '11111111-2222-3333-4444-555555555555' }])
    }
  },
  response: {}
};
const out = await handler(event);
console.log(out);
