import { e as error } from "../../../chunks/index.js";
const mockProducts = [
  {
    id: "1",
    name: "Power Drill",
    category: "Power Tools",
    price: 2999.99,
    image: "https://placehold.co/300x200?text=Power+Drill"
  },
  {
    id: "2",
    name: "Hammer",
    category: "Hand Tools",
    price: 299.99,
    image: "https://placehold.co/300x200?text=Hammer"
  },
  {
    id: "3",
    name: "Paint Brush Set",
    category: "Painting",
    price: 499.99,
    image: "https://placehold.co/300x200?text=Paint+Brush+Set"
  },
  {
    id: "4",
    name: "Cement (40kg)",
    category: "Building Materials",
    price: 259.99,
    image: "https://placehold.co/300x200?text=Cement"
  }
];
const categories = ["Power Tools", "Hand Tools", "Painting", "Building Materials"];
const load = async ({ locals, cookies }) => {
  const cart = cookies.get("cart") ? JSON.parse(cookies.get("cart")) : [];
  return {
    products: mockProducts,
    categories,
    cartCount: cart.length
  };
};
const actions = {
  addToCart: async ({ request, cookies }) => {
    const data = await request.formData();
    const productId = data.get("productId");
    if (!productId) {
      throw error(400, "Product ID is required");
    }
    const cart = cookies.get("cart") ? JSON.parse(cookies.get("cart")) : [];
    cart.push(productId);
    cookies.set("cart", JSON.stringify(cart), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7
      // 1 week
    });
    return { success: true };
  }
};
export {
  actions,
  load
};
