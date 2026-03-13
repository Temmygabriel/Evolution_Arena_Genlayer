import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evolution Arena — GenLayer",
  description:
    "Build a creature. Survive impossible scenarios. The AI decides who lives. Powered by GenLayer.",
  openGraph: {
    title: "Evolution Arena",
    description: "The AI-powered creature survival game on GenLayer",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo/mark.svg" type="image/svg+xml" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#080818" }}>
        {children}
      </body>
    </html>
  );
}

