export interface DBProduct {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  description: string | null;
  category: string;
  sizes: string[];
  colors: string[];
  materials: string | null;
  images: string[];
  is_visible: boolean;
  is_in_stock: boolean;
  is_new: boolean;
  is_premium: boolean;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  sku: string;
  name: string;
  price: number;
  description: string;
  category: string;
  sizes: string[];
  colors: string[];
  materials: string;
  is_new: boolean;
  is_premium: boolean;
  stock: number;
}

export type AppRole = 'admin' | 'user' | 'master';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  shop_name: string;
  shop_logo_url: string | null;
  bcv_rate: number;
  footer_credits: string | null;
  developer_logo_url: string | null;
  contact_whatsapp: string | null;
  contact_instagram: string | null;
  contact_email: string | null;
  updated_at: string;
}
