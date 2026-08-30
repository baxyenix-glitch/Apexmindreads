import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function parseServiceAccount(raw: string): any {
  if (!raw) return null;
  // 1. Direct JSON parse
  try {
    return JSON.parse(raw);
  } catch {}

  // 2. Base64 decoded JSON parse
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {}

  // 3. Normalized string parse
  try {
    const sanitized = raw.trim();
    return JSON.parse(sanitized);
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", e);
    return null;
  }
}

const DEFAULT_SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "apexmind-a81d0",
  private_key_id: "8cab71e0c22e1d728d85accdeffec4f07b9e46de",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC4ZCUyUNCm50ot\n6WSkKjsts/XAhgop8ZCs5YCj0iiUOWBYqXH5I8hGvgEVA15do8Ig6NHkfZHdu9R3\nA23Es9AYDfRAzxUSepk2y26LruvypCnqpTjN6u4UKT449e1W9z+/zfF1GVFKRxU3\nIXj/TkA2jDPmNXvVrgSkvZbwsr4oKVv1EdZj6LEtm/5otlfbOWHQpaEHWSqA3Cti\nusHi5L6eKnVrVSo1WBdzALr2oHMtlhR2U0VYWTjSMY4zWYvl0aFBLtHqL1Qp/lPU\ntQKeMMw4pTK5qTSxbelnH8T24RldJr9vq26ile4LU63zSfCr6F+VzfJ3sSH5XrX1\nxULsDxwhAgMBAAECggEASKIOMuk5n505D6fBoJcQE5sxYWKLa2U/95M53o4gtO57\nAMHSZvDM6ezbcUMP73PbuunrEAXUqRLdiPn9ScAI5wjMH6FS7CIF61ssEvLW94/q\nAQePPjHeEWwDmh1pndmsL2o4xEcySb+BYGObjXnt+m603OhRfOTc6GXUKMFH/XpN\nUbqiudHgb0XFgT9ARP3Ioi0dO3/QYatOPTBCg8MFMTe+s4xBrd2HF4PPPNYnqCl3\ncfruSORr++WF5y4Xrh6g/GAmeJdshgxXAt+0JPmoe0uAqnSahai5h2o2BTfpaabg\nla+Thr6FLBjimT0482SGzPpbOYv985iowS3MUWCxPwKBgQDu6ZcHgJmDlw13Hu9C\nGku74vNWFveeG1lpQqU8SFQil0SwH5ulGfhPoT0uwHnidEra9avMt0dMgfm+bVMG\n8e8LNIK+B0Mwmepjj6U6Je6BzFc/QudKTStBYNh6G4CjTT9wZ48ggiVcW4FTa4ks\nzUskSrhdqAc9SCZiByKG89ognwKBgQDFlEncU0QMmWzwPpbcWrkfwiK7bQqMB5/O\nAWCoSV44GIUTUjDQP4heikqfhH4DpfDGYxqrOFbtrwKOkgSvqTm5/ezKGub4pPVe\nytGL+26E0mpDWhD5rOQ5camBnJnWPenQtFgW/NgJ9pDLJqg5jD4o9SVqfQl6jMVQ\nAwTBEJ3LPwKBgQC05R07yv1xi2/goAWc0XhCfOauapl2l1Ktxo6CBGnf/xU9HdGl\nwvImqPlAavBerJr5C0bXrHZJ0agdrX1OJuVOYKYV6D3RkNjOJbd/PbVHhkcRWUDz\nG1cDG6cNXcGa5CSCoYbXoHNVaNuVJDkrOQ4KHqFWGKHSnsyhMLHN6NliFQKBgQCP\nn7PxTTXyUrU2DslrdSeNRnoo9KLuF7y665Vvv6WV8X0LBnwlZYmj77M/MfjIfiAA\nlpoUTOgj70xUhyCQ8NrdsRAn+lZb+M3FEnow35z/QFWukBI27M8aUt19MnFBo9AL\nvo0qaLJCy9GFW5x9+MxWyZ1hQ3NYemwUNZ2HGqUZ0QKBgEpEFm9hwM9oJ+JUruP8\naxrr+9Z83PTIuZP2YCWxIfH9CwcvxRYF8h/CETo8c6SYLbrzKcFPRoAVv6UBZUkc\n+bZM+5qpQgn0j66r1Gjzka7XftjhmaJTHHjdGc6uADhO+qU7gf+WgQ99l5wfNqnV\n+9BMLDsK8t8cWOId7E8kXQZJ\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@apexmind-a81d0.iam.gserviceaccount.com",
  client_id: "113222400945784126811",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40apexmind-a81d0.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

let serviceAccount: any = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
}

if (!serviceAccount) {
  const serviceAccountPath = path.join(process.cwd(), "server/data/firebase-admin-key.json");
  if (fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    } catch (e) {
      console.error("Failed to read local service account file:", e);
    }
  }
}

if (!serviceAccount) {
  serviceAccount = DEFAULT_SERVICE_ACCOUNT;
}

if (!getApps().length) {
  if (serviceAccount) {
    if (typeof serviceAccount.private_key === "string") {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    initializeApp({
      projectId: "apexmind-a81d0"
    });
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Already initialized
}

