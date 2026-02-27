import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { ProductImageProvider } from "@/lib/ProductImageContext";
import { PickCountProvider } from "@/lib/PickCountContext";
import { LowStockProvider } from "@/lib/LowStockContext";

export const metadata: Metadata = {
  title: "A-Best Swag WMS",
  description: "Warehouse Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ProductImageProvider>
            <PickCountProvider>
              <LowStockProvider>
                {children}
              </LowStockProvider>
            </PickCountProvider>
          </ProductImageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}