import { Route, Routes } from "react-router-dom";
import { CartProvider } from "./cart/CartContext";
import Header from "./components/Header";
import CheckoutPage from "./pages/CheckoutPage";
import MenuPage from "./pages/MenuPage";
import OrderStatusPage from "./pages/OrderStatusPage";

export default function App() {
  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <Header />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders/:id" element={<OrderStatusPage />} />
          </Routes>
        </main>
      </div>
    </CartProvider>
  );
}
