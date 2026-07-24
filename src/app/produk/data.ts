export interface Product {
  id: number;
  name: string;
  price: number;
  category: "Coffee" | "Non-Coffee";
  rating: number;
  sold: string;
  tags: string[];
  image: string;
  is_stock_tracked?: boolean;
  is_offline_only?: boolean;
}

export const products: Product[] = [
  { 
    id: 1, name: "Americano", price: 10000, category: "Coffee", 
    rating: 4.7, sold: "1K+", tags: ["Best Seller", "Bold"], image: "/produk/americano.png" 
  },
  { 
    id: 2, name: "Apple Americano", price: 15000, category: "Coffee", 
    rating: 4.6, sold: "850", tags: ["Fruity", "Refreshing"], image: "/produk/apple americano.png" 
  },
  { 
    id: 3, name: "Coklat", price: 15000, category: "Non-Coffee", 
    rating: 4.8, sold: "1.2K+", tags: ["Chocolate", "Smooth"], image: "/produk/coklat.png" 
  },
  { 
    id: 4, name: "Kopi Aren", price: 12000, category: "Coffee", 
    rating: 4.5, sold: "900", tags: ["Sweet", "Local"], image: "/produk/kopi aren.png" 
  },
  { 
    id: 5, name: "Butterscotch", price: 13000, category: "Coffee", 
    rating: 4.7, sold: "1K+", tags: ["Butterscotch", "Creamy"], image: "/produk/kopi butterscoth.png" 
  },
  { 
    id: 6, name: "Kopi Caramel", price: 13000, category: "Coffee", 
    rating: 4.6, sold: "950", tags: ["Caramel", "Silky"], image: "/produk/kopi caramel.png" 
  },
  { 
    id: 7, name: "Kopi Susu", price: 10000, category: "Coffee", 
    rating: 4.4, sold: "800", tags: ["Milk", "Mild"], image: "/produk/kopi susu.png" 
  },
  { 
    id: 8, name: "Lychea Tea", price: 10000, category: "Non-Coffee", 
    rating: 4.5, sold: "500", tags: ["Tea", "Tropical"], image: "/produk/lychea tea.png" 
  },
  { 
    id: 9, name: "Matcha", price: 15000, category: "Non-Coffee", 
    rating: 4.7, sold: "650", tags: ["Green", "Healthy"], image: "/produk/matcha.png" 
  },
  { 
    id: 10, name: "Red Velvet", price: 15000, category: "Non-Coffee", 
    rating: 4.6, sold: "700", tags: ["Velvet", "Rich"], image: "/produk/red velvet.png" 
  },
  {
    id: 11, name: "Kopi Susu Kampuang", price: 10000, category: "Coffee",
    rating: 0, sold: "0", tags: ["Kampuang", "Authentic"], image: "/produk/kopi susu kampuang.png",
    is_stock_tracked: true, is_offline_only: false
  },
  {
    id: 12, name: "Kopi Almond", price: 13000, category: "Coffee",
    rating: 0, sold: "0", tags: ["Almond", "Nutty"], image: "/produk/kopi almond.png",
    is_stock_tracked: true, is_offline_only: false
  },
  {
    id: 13, name: "Kopi Susu Jasmine", price: 13000, category: "Coffee",
    rating: 0, sold: "0", tags: ["Jasmine", "Floral"], image: "/produk/kopi susu jasmine.png",
    is_stock_tracked: true, is_offline_only: false
  },
  {
    id: 14, name: "Americano Botol", price: 95000, category: "Coffee",
    rating: 0, sold: "0", tags: ["Botol", "Bulk"], image: "/produk/americano botol.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 15, name: "Coklat Botol", price: 95000, category: "Non-Coffee",
    rating: 0, sold: "0", tags: ["Botol", "Bulk"], image: "/produk/coklat botol.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 16, name: "Gantungan Kunci", price: 10000, category: "Non-Coffee",
    rating: 0, sold: "0", tags: ["Merchandise"], image: "/produk/gantungan kunci.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 17, name: "Kopi Aren Botol", price: 80000, category: "Coffee",
    rating: 0, sold: "0", tags: ["Botol", "Bulk"], image: "/produk/kopi aren botol.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 18, name: "Kopi Butterscotch Botol", price: 85000, category: "Coffee",
    rating: 0, sold: "0", tags: ["Botol", "Bulk"], image: "/produk/kopi butterscoth botol.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 19, name: "Kopi Caramel Botol", price: 85000, category: "Coffee",
    rating: 0, sold: "0", tags: ["Botol", "Bulk"], image: "/produk/kopi caramel botol.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 20, name: "Maha Nori", price: 15000, category: "Non-Coffee",
    rating: 0, sold: "0", tags: ["Snack"], image: "/produk/maha nori.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 21, name: "Matcha Botol", price: 95000, category: "Non-Coffee",
    rating: 0, sold: "0", tags: ["Botol", "Bulk"], image: "/produk/matcha botol.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 22, name: "Mineral Prima", price: 5000, category: "Non-Coffee",
    rating: 0, sold: "0", tags: ["Water", "Beverage"], image: "/produk/mineral prima.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 23, name: "Kopi Susu 240ml", price: 16000, category: "Coffee",
    rating: 0, sold: "0", tags: ["Mini", "Ready to Drink"], image: "/produk/kopi susu 240ml.png",
    is_stock_tracked: false, is_offline_only: true
  },
  {
    id: 24, name: "Spaghetti Bolognese", price: 15000, category: "Non-Coffee",
    rating: 0, sold: "0", tags: ["Food", "Pasta"], image: "/produk/spaghetti bolognese.png",
    is_stock_tracked: false, is_offline_only: true
  }
];