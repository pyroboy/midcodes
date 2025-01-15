import { e as error, j as json } from "../../../../chunks/index.js";
import { A as ADMIN_URL } from "../../../../chunks/private.js";
async function GET({ locals: { safeGetSession } }) {
  const { profile } = await safeGetSession();
  if (!profile || profile.role !== "super_admin") {
    throw error(403, "Unauthorized");
  }
  return json({
    adminUrl: ADMIN_URL
  });
}
export {
  GET
};
