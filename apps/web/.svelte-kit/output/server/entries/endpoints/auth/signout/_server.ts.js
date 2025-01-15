import { r as redirect } from "../../../../chunks/index.js";
const POST = async ({ locals: { supabase }, cookies }) => {
  await supabase.auth.signOut();
  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });
  throw redirect(303, "/auth");
};
export {
  POST
};
