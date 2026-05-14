import MainFooter from "@/components/footer/MainFooter";
import HomeHeader from "@/components/headers/HomeHeader";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HomeHeader showTraining={true} />
      {children}
      <MainFooter />
    </>
  );
}
