import { CognitoIdentityProviderClient, ListUsersCommand, AdminLinkProviderForUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});
const REQUIRE_VERIFIED_EMAIL = (process.env.REQUIRE_VERIFIED_EMAIL ?? "true").toLowerCase() === "true";
const EXPECTED_IDP_NAME = (process.env.EXPECTED_IDP_NAME || "SNOMEDINTERNATIONAL");
const EXPECTED_SNOMED_IDP_NAME = (process.env.EXPECTED_SNOMNED_IDP_NAME || "SNOMED");

const attr = (u, name) => (u.Attributes || []).find(a => a.Name === name)?.Value;

function hasLinkedProvider(user) {
  const raw = attr(user, "identities");
  if (!raw) return false;
  try {
    const ids = JSON.parse(raw);
    return ids.some(i => (i.providerName || "").toLowerCase() === EXPECTED_SNOMED_IDP_NAME.toLowerCase());
  } catch {
    return false;
  }
}

export const handler = async (event) => {
  console.log("triggerSource:", event.triggerSource);
  if (event.triggerSource !== "PreSignUp_ExternalProvider") {
    console.log("Skip: not external-provider path");
    return event;
  }

  const poolId = event.userPoolId;
  const attrs = event.request?.userAttributes ?? {};
  const email = (attrs.email ?? "").trim().toLowerCase();
  console.log("incoming email:", email, "email_verified:", attrs.email_verified);

  let incoming = {};
  let ids = [];
  try {
    ids = attrs.identities ? JSON.parse(attrs.identities) : [];
    incoming = ids.find(i => (i.providerName || "").toLowerCase() === EXPECTED_IDP_NAME.toLowerCase()) || {};
  } catch {
    console.log(`Failed to parse incoming identities: ${attrs.identities}`);
  }

  if (!incoming.userId && typeof event.userName === "string" && event.userName.includes("_")) {
    const [prov, ...rest] = event.userName.split("_");
    if ((prov || "").toLowerCase() === EXPECTED_IDP_NAME.toLowerCase()) {
      incoming = { providerName: prov, userId: rest.join("_") };
    }
  }

  //console.log("incoming:", incoming);

  if (!email || !incoming.userId) {
    console.error(`Require email and sub in the token!`);
    return event;
  }
  if (REQUIRE_VERIFIED_EMAIL && attrs.email_verified !== "true") return event;

  const { Users = [] } = await client.send(new ListUsersCommand({
    UserPoolId: poolId,
    Filter: `email = "${email}"`,
    Limit: 60
  }));

  if (Users.length === 0) {
    console.log(`No destination users for ${email}; letting Cognito create new user.`);
    return event;
  }

  const providerMatches = Users.filter(hasLinkedProvider);

  if (providerMatches.length > 1) {
    console.error(`Ambiguous: ${providerMatches.length} users share email ${email} and are already linked to ${EXPECTED_SNOMED_IDP_NAME}. Skipping link.`);
    return event;
  }

  let dest = null;
  if (providerMatches.length === 1) {
    dest = providerMatches[0];
  } else if (Users.length === 1) {
    console.info(`Existing user with email address ${email} is not a SNOMED Crowd user. Skipping link.`);
    return event;
  } else {
    console.error(`Duplicate email without a unique ${EXPECTED_SNOMED_IDP_NAME} IDP link for ${email} (count=${Users.length}). Skipping link.`);
    return event;
  }

  const destUsername = dest.Username;
  if (!destUsername) {
    console.error(`Skip: matched user missing Username for ${email}`);
    return event;
  }

  try {
    const adminLinkCommand = new AdminLinkProviderForUserCommand({
      UserPoolId: poolId,
      DestinationUser: {
        ProviderName: "Cognito",
        ProviderAttributeValue: destUsername
      },
      SourceUser: {
        ProviderName: EXPECTED_IDP_NAME,
        ProviderAttributeName: "Cognito_Subject",
        ProviderAttributeValue: incoming.userId
      }
    })
    //console.log(JSON.stringify(adminLinkCommand));
    await client.send(adminLinkCommand);
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
    console.log(`Linked ${incoming.providerName}/${incoming.userId} -> ${destUsername} (${email})`);
  } catch (e) {
    console.error(`AdminLinkProviderForUser failed for ${email}:`, e);
  }

  return event;
};
