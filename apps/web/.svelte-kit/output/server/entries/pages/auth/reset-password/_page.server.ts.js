import { f as fail, r as redirect } from "../../../../chunks/index.js";
const actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const password = formData.get("password");
    const { error } = await supabase.auth.updateUser({
      password
    });
    if (error) {
      return fail(500, {
        error: error.message,
        success: false
      });
    }
    throw redirect(303, "/");
  }
};
export {
  actions
};
