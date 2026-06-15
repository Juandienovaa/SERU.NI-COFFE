export interface Product {
  id: number;
  name: string;
  price: number;
  category: "Coffee" | "Non-Coffee";
  rating: number;
  sold: string;
  tags: string[];
  image: string;
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
  }
];