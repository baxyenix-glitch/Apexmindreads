import "dotenv/config";
import { getAuth } from "firebase-admin/auth";
import { adminAuth } from "../server/lib/firebase-admin";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/set_admin_claim.ts <email>");
    process.exit(1);
  }

  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`Successfully set admin claim for ${email} (uid: ${user.uid})`);
  } catch (error) {
    console.error("Error setting custom claim:", error);
  }
}

main();
