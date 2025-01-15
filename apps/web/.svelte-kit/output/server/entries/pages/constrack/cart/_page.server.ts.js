import { e as error, r as redirect } from "../../../../chunks/index.js";
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
const load = async ({ cookies }) => {
  const cart = cookies.get("cart") ? JSON.parse(cookies.get("cart")) : [];
  const cartItems = cart.reduce((items, productId) => {
    const product = mockProducts.find((p) => p.id === productId);
    if (product) {
      const existingItem = items.find((item) => item.id === productId);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        items.push({ ...product, quantity: 1 });
      }
    }
    return items;
  }, []);
  return {
    cartItems
  };
};
const actions = {
  updateQuantity: async ({ request, cookies }) => {
    const data = await request.formData();
    const productId = data.get("productId");
    const quantity = parseInt(data.get("quantity"));
    if (!productId || !quantity) {
      throw error(400, "Product ID and quantity are required");
    }
    cookies.get("cart") ? JSON.parse(cookies.get("cart")) : [];
    const newCart = [];
    for (let i = 0; i < quantity; i++) {
      newCart.push(productId);
    }
    cookies.set("cart", JSON.stringify(newCart), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7
      // 1 week
    });
    return { success: true };
  },
  removeItem: async ({ request, cookies }) => {
    const data = await request.formData();
    const productId = data.get("productId");
    if (!productId) {
      throw error(400, "Product ID is required");
    }
    const cart = cookies.get("cart") ? JSON.parse(cookies.get("cart")) : [];
    const newCart = cart.filter((id) => id !== productId);
    cookies.set("cart", JSON.stringify(newCart), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7
      // 1 week
    });
    return { success: true };
  },
  checkout: async ({ cookies }) => {
    cookies.delete("cart", { path: "/" });
    throw redirect(303, "/constrack/checkout/success");
  }
};
export {
  actions,
  load
};
