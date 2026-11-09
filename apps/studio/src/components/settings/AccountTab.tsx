/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Surface } from "@/src/components/common";
import { ExternalLink, Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authAppHref } from "../../lib/authUrl";

export const AccountTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { user } = useAuth();
  const [displayUser, setDisplayUser] = useState(user);

  useEffect(() => {
    setDisplayUser(user);
  }, [user]);

  if (!active) return null;

  const accountUrl = authAppHref("/account", {
    returnUrl: typeof window !== "undefined" ? window.location.href : undefined,
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <Surface className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          {displayUser?.image ? (
            <img
              src={displayUser.image}
              alt=""
              className="w-14 h-14 rounded-full object-cover border border-m3-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-m3-primary/15 text-m3-primary flex items-center justify-center text-lg font-semibold">
              {(displayUser?.name || displayUser?.email || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-m3-text truncate">
              {displayUser?.name || displayUser?.email || "Account"}
            </h2>
            <p className="text-sm text-m3-secondary truncate">{displayUser?.email}</p>
          </div>
        </div>

        <div className="rounded-lg border border-m3-border/70 bg-m3-bg/50 p-4 flex gap-3">
          <Shield className="w-5 h-5 text-m3-primary shrink-0 mt-0.5" />
          <div className="space-y-2 min-w-0">
            <p className="text-sm text-m3-text font-medium">
              Account security is managed in Hosanna Auth
            </p>
            <p className="text-xs text-m3-secondary leading-relaxed">
              Update your name, email, password, linked Google account, two-factor authentication,
              and active sessions on the dedicated auth site.
            </p>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                window.location.assign(accountUrl);
              }}
            >
              <span className="inline-flex items-center gap-2">
                Manage account
                <ExternalLink className="w-4 h-4" />
              </span>
            </Button>
          </div>
        </div>
      </Surface>
    </div>
  );
};
