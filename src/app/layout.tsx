import type { Metadata } from "next";
import "./globals.css";
import { ProductImageProvider } from "@/lib/ProductImageContext";
import { PickCountProvider } from "@/lib/PickCountContext";

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
        <ProductImageProvider>
          <PickCountProvider>
            {children}
          </PickCountProvider>
        </ProductImageProvider>
      </body>
    </html>
  );
}