export interface ProductsRequestData {
  page?: string | number;
  q?: string;
  sort?: string;
  between?: string;
  is_rental?: string | boolean;
  by_category?: string;
  by_brand?: string;
  by_category_slug?: string;
}
