import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = { slug: string; name: string; price: number; imageKey: string; imageUrl?: string | null; size: string; quantity: number };
type CartContextValue = { items: CartItem[]; count: number; total: number; addItem: (item: Omit<CartItem, "quantity">) => void; setQuantity: (slug: string, size: string, quantity: number) => void; clear: () => void };
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { try { const saved = localStorage.getItem("kaleria-cart"); if (saved) setItems(JSON.parse(saved) as CartItem[]); } catch { /* use empty cart */ } }, []);
  useEffect(() => { try { localStorage.setItem("kaleria-cart", JSON.stringify(items)); } catch { /* storage may be unavailable */ } }, [items]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: (item) => setItems((current) => {
      const existing = current.find((entry) => entry.slug === item.slug && entry.size === item.size);
      return existing ? current.map((entry) => entry === existing ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { ...item, quantity: 1 }];
    }),
    setQuantity: (slug, size, quantity) => setItems((current) => current.flatMap((item) => item.slug === slug && item.size === size ? (quantity > 0 ? [{ ...item, quantity }] : []) : [item])),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}