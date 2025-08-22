import { CognitoIdentityProviderClient, ListUsersCommand, AdminLinkProviderForUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});
const REQUIRE_VERIFIED_EMAIL = (process.env.REQUIRE_VERIFIED_EMAIL ?? "true").toLowerCase() === "true";
const EXPECTED_IDP_NAME = (process.env.EXPECTED_IDP_NAME || "SNOMEDINTERNATIONAL").toLowerCase(); // e.g. "keycloak"

export const handler = async (event) => {
  if (event.triggerSource !== "PreSignUp_ExternalProvider") return event;

  const poolId = event.userPoolId;
  const attrs = event.request?.userAttributes ?? {};
  const email = (attrs.email ?? "").trim().toLowerCase();

  let curIdp = {};
  try {
    const ids = attrs.identities ? JSON.parse(attrs.identities) : [];
    curIdp = ids.find(i => (i.providerName || "").toLowerCase() === EXPECTED_IDP_NAME) || {};
  } catch {
    console.log(`Error parsing JSON from attributes: ${attrs}`);
  }

  if (!curIdp.userId) {
    console.log(`Skipping: provider not matched (expected: ${EXPECTED_IDP_NAME})`);
    return event;
  }

  const providerName = curIdp.providerName || EXPECTED_IDP_NAME;
  const providerSub  = curIdp.userId;

  if (!email || !providerName || !providerSub) return event;
  if (REQUIRE_VERIFIED_EMAIL && attrs.email_verified !== "true") return event;

  // Find the existing destination user by email
  const { Users = [] } = await client.send(new ListUsersCommand({
    UserPoolId: poolId,
    Filter: `email = "${email}"`,
    Limit: 2
  }));
  if (Users.length !== 1) {
    console.log(`No user or multiple users exist for the email ${email}`);
    return event;
  }

  const destUsername = Users[0]?.Username;
  if (!destUsername) {
    console.error(`Skip link: missing Username on matched user for ${email}`);
    return event;
  }

  // Link (Source = IdP + sub, Destination = existing Cognito user)
  try {
    await client.send(new AdminLinkProviderForUserCommand({
      UserPoolId: poolId,
      DestinationUser: { 
        ProviderName: "Cognito",
        ProviderAttributeValue: destUsername },
      SourceUser: {
        ProviderName: providerName,
        ProviderAttributeName: "Cognito_Subject",
        ProviderAttributeValue: providerSub
      }
    }));
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
    console.log(`Successfully linked user ${providerSub} to Cognito user ${destUsername} with email ${email}`);
  } catch (e) {
    console.error(`AdminLinkProviderForUser failed for ${email}:`, e);
    // don't block sign-in; just return event
  }

  return event;
};
