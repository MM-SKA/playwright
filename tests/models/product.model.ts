export interface Category {
  id?: string;
  name: string;
  slug?: string;
}

export interface Brand {
  id?: string;
  name: string;
}

export interface ProductImage {
  id?: string;
  title: string;
  file_name: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;
  category?: Category;
  brand?: Brand;
  product_image?: ProductImage;
}

export interface ProductsListResponse {
  data: ProductListItem[];
}

export interface ProductDetailResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;

  category: Category;
  brand: Brand;
  product_image: ProductImage;
}

export interface SelectedCartProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
