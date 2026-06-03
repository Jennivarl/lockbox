"use client";
import { PrivyProvider as Privy } from "@privy-io/react-auth";

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Privy
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#000000",
          logo: undefined,
        },
        loginMethods: ["wallet", "email", "google"],
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
      }}
    >
      {children}
    </Privy>
  );
}
