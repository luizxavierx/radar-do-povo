import { Outlet } from "react-router-dom";

import AppFooter from "@/components/AppFooter";

const AppShellLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-grid-pattern">
      <div className="flex-1">
        <Outlet />
      </div>

      <div className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-6 sm:px-6 lg:pb-10">
          <AppFooter />
        </div>
      </div>
    </div>
  );
};

export default AppShellLayout;
