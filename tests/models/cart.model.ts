export interface AddToCartRequest {
  product_id: string;
  quantity: number;
}

export interface AddToCartResponse {
  result: string;
}

export interface CartProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;
}

export interface CartItem {
  id: string;
  quantity: number;
  cart_id: string;
  product_id: string;
  product: CartProduct;
}

export interface CartResponse {
  id: string;
  cart_items: CartItem[];
}
