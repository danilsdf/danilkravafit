import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recipes | Hybrid Athlete Hub",
  description: "Discover meal prep, hybrid athlete recipes, and practical nutrition for busy people by Danil Kravchenko.",
  openGraph: {
    title: "Recipes | Hybrid Athlete Hub",
    description: "Discover meal prep, hybrid athlete recipes, and practical nutrition for busy people by Danil Kravchenko.",
    url: "https://danilkrava.fit/recipes",
    siteName: "Hybrid Athlete Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recipes | Hybrid Athlete Hub",
    description: "Discover meal prep, hybrid athlete recipes, and practical nutrition for busy people by Danil Kravchenko.",
  },
};
import MainFooter from "@/components/footer/MainFooter";
import HomeHeader from "@/components/headers/HomeHeader";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HomeHeader showTraining={false} />
      {children}
      <MainFooter />
    </>
  );
}
