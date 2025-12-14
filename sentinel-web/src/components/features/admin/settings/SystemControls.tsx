"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Power, Users, Shield, Loader2 } from "lucide-react";
import { updateSystemSetting } from "@/actions/settings-actions";

interface SystemSetting {
  key: string;
  value: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface SystemControlsProps {
  settings: {
    allowStudentLogin: boolean;
    enableRegistrations: boolean;
    strictGateMode: boolean;
  };
}

export function SystemControls({ settings }: SystemControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState(settings);

  const systemSettings: SystemSetting[] = [
    {
      key: "allowStudentLogin",
      value: localSettings.allowStudentLogin,
      title: "Allow Student Login",
      description:
        "When disabled, students will see a 'Maintenance Mode' message.",
      icon: <Users className="h-5 w-5 text-[#4F39F6]" />,
    },
    {
      key: "enableRegistrations",
      value: localSettings.enableRegistrations,
      title: "Enable New Registrations",
      description: "When disabled, Managers cannot add new students.",
      icon: <Power className="h-5 w-5 text-emerald-600" />,
    },
    {
      key: "strictGateMode",
      value: localSettings.strictGateMode,
      title: "Strict Gate Mode",
      description:
        "When enabled, rejects tickets purchased less than 1 hour ago (anti-fraud).",
      icon: <Shield className="h-5 w-5 text-amber-600" />,
    },
  ];

  const handleToggle = (key: string, newValue: boolean) => {
    setPendingKey(key);
    startTransition(async () => {
      try {
        const result = await updateSystemSetting(key, newValue);

        if (result.success) {
          setLocalSettings((prev) => ({ ...prev, [key]: newValue }));
          toast.success(`${key} updated successfully`);
        } else {
          toast.error(result.message || "Failed to update setting");
        }
      } catch (error) {
        toast.error("An error occurred");
      } finally {
        setPendingKey(null);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Power className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              System Controls
            </h3>
            <p className="text-sm text-slate-500">
              Toggle system-wide features on or off
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {systemSettings.map((setting) => (
          <div
            key={setting.key}
            className="p-6 flex items-center justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-50 rounded-lg">{setting.icon}</div>
              <div>
                <h4 className="font-medium text-slate-900">{setting.title}</h4>
                <p className="text-sm text-slate-500 mt-0.5">
                  {setting.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingKey === setting.key && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
              <Switch
                checked={setting.value}
                onCheckedChange={(checked) =>
                  handleToggle(setting.key, checked)
                }
                disabled={isPending}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
