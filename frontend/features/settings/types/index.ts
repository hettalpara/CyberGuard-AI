// Settings feature types
export interface AppSettings {
  theme: "light" | "dark" | "system";
  language: string;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface NotificationSettings {
  emailAlerts: boolean;
  pushNotifications: boolean;
  scanCompleted: boolean;
  threatDetected: boolean;
  reportGenerated: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}
