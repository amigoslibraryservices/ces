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

  console.log("Fetching WhoAmI from:", url);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    }
  });

  if (!res.ok) {
    console.log(res); 
    const text = await res.text();
    console.log(text);
    throw new Error(`API request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  console.log("WhoAmI response:", data);
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
  console.log("Access token response:", data);
  return data.access_token;
}

async function fetchAccounts() {
  const token = await getAccessToken();

  const url = `${ORG_URL}/api/data/v9.2/accounts?$select=name,accountnumber&$filter=new_accounttype eq 8`;

  console.log("Fetching accounts from:", url);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    }
  });

  if (!res.ok) {
    console.log(res); 
    throw new Error(`API request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
}


export default async function fetchAccountsByType(accountTypeIds) {
  const token = await getAccessToken();


  const filter = await buildFilter(accountTypeIds);

  const url = `${ORG_URL}/api/data/v9.2/accounts?$select=name,accountnumber&$filter=${encodeURIComponent(filter)}`;

  console.log("Fetching accounts from:", url);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    }
  });

  if (!res.ok) {
    console.log(res);
    throw new Error(`API request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  console.log(data);
  return data;
}

async function buildFilter(accountTypes) {
  return accountTypes.map(t => `new_accounttype eq ${t}`).join(' or ');
}
