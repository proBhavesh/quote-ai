"use client";

import { initiateXeroConnection } from "@/app/actions/xero";
import { XeroConnectButton } from "./xero-connect-button";

interface XeroConnectFormProps {
  isNewConnection?: boolean;
}

export function XeroConnectForm({
  isNewConnection = false,
}: XeroConnectFormProps) {
  const handleConnect = async () => {
    const { authUrl } = await initiateXeroConnection();

    if (authUrl) {
      // Redirect to Xero authorization URL
      window.location.href = authUrl;
    }
  };

  return (
    <XeroConnectButton
      onConnect={handleConnect}
      variant={isNewConnection ? "default" : "large"}
      label={isNewConnection ? "Connect Another Account" : "Connect Xero"}
    />
  );
}
