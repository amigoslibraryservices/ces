import { loadEnvFile } from 'node:process';

if (process.env.NODE_ENV !== "production") {
  loadEnvFile(); 
}

const TENANT_ID = process.env.DYNAMICS_TENANT_ID;
const CLIENT_ID = process.env.DYNAMICS_CLIENT_ID;
const CLIENT_SECRET = process.env.DYNAMICS_CLIENT_SECRET;
const ORG_URL = process.env.DYNAMICS_ORG_URL; 


async function fetchWhoAmI() {
  const token = await getAccessToken();

  const url = `${ORG_URL}/api/data/v9.2/WhoAmI`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
}

async function getAccessToken() {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: `${ORG_URL}/.default`
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();

  return data.access_token;
}


export default async function fetchAccountsByType(accountTypeIds, since = null) {
  const token = await getAccessToken();

  const [updated, removed] = await Promise.all([
    fetchAccounts(token, buildActiveFilter(accountTypeIds, since)),
    since ? fetchAccounts(token, buildRemovedFilter(accountTypeIds, since)) : Promise.resolve({ value: [] }),
  ]);

  return { updated, removed };
}

async function fetchAccounts(token, filter) {
  const url = `${ORG_URL}/api/data/v9.2/accounts?$select=name,accountid&$filter=${encodeURIComponent(filter)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    }
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function buildActiveFilter(accountTypes, since) {
  const typeFilter = accountTypes.map(t => `statuscode eq 1 and new_membershipstatus eq ${t}`).join(' or ');
  return since
    ? `modifiedon ge ${since} and (${typeFilter})`
    : typeFilter;
}

function buildRemovedFilter(accountTypes, since) {
  const typeFilter = accountTypes.map(t => `new_membershipstatus eq ${t}`).join(' or ');
  // accounts modified since last run that match the membership types but are no longer active
  return `modifiedon ge ${since} and statuscode ne 1 and (${typeFilter})`;
}
