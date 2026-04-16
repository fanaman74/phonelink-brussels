"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  children: React.ReactNode;
  authFreePaths: string[];
  locale?: string;
}

/**
 * Client-side session guard.
 * Redirects unauthenticated users to /[locale]/login.
 * Auth-free paths (login, invite) are always accessible.
 */
export default function SessionGuard({ children, authFreePaths, locale: localeProp }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  const isAuthFree = authFreePaths.some((p) => pathname.includes(p));
  const locale = localeProp || pathname.split("/")[1] || "fr";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !isAuthFree) {
        router.replace(`/${locale}/login`);
      } else {
        setChecked(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !isAuthFree) {
        router.replace(`/${locale}/login`);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, isAuthFree, router, locale]);

  if (!checked && !isAuthFree) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
