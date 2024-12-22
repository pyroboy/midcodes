export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    image: string;
}

export interface CartItem extends Product {
    quantity: number;
}
