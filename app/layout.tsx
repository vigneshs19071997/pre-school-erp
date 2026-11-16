import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/client";
import { LoaderProvider } from "@/components/loader";

export const metadata: Metadata = {
  title: process.env.SCHOOL_NAME || "Preschool Manager",
  description: "Complete preschool management — students, attendance, parents, HR and finance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <LoaderProvider>
          {children}
          <Toaster />
        </LoaderProvider>
      </body>
    </html>
  );
}
