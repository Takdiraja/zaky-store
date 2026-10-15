import AppBarWrapper from "./app-bar-wrapper";
import SideNavDrawer from "@/components/layout/side-nav-drawer";
import BottomNav from "@/components/layout/bottom-nav";
import GlobalSearch from "@/components/shared/global-search";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppBarWrapper />
      <SideNavDrawer />
      <BottomNav />
      <GlobalSearch />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-[52px] sm:px-6 md:pb-6 min-h-screen [&:has(.kasir-layout)]:max-w-none [&:has(.kasir-layout)]:pt-0 [&:has(.kasir-layout)]:px-0 [&:has(.kasir-layout)]:pb-0">
        {children}
      </main>
    </>
  );
}
