import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/ThemeProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "HuaChang Growmax | Sales & Order Management",
  description:
    "Streamline your sales operations with Hua Chang Growmax — a powerful order management platform tailored for efficiency and visibility across your sales pipeline.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  keywords: [
    "sales management",
    "order tracking",
    "customer management",
    "Hua Chang Growmax",
    "inventory system",
    "business dashboard",
    "B2B sales",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" reverseOrder={false} />
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
