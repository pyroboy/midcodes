import { f as fail } from "../../../../chunks/index.js";
const actions = {
  default: async ({ request, locals: { supabase }, url }) => {
    const formData = await request.formData();
    const email = formData.get("email");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${url.origin}/auth/reset-password`
    });
    if (error) {
      return fail(500, {
        error: error.message,
        success: false,
        email
      });
    }
    return {
      success: true,
      message: "Password reset instructions have been sent to your email."
    };
  }
};
export {
  actions
};
