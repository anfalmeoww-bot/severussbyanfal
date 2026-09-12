import { config } from "../config";
import type { SmsProvider } from "./provider";
import { consoleSmsProvider } from "./console";
import { unifonicSmsProvider } from "./unifonic";

export function getSmsProvider(): SmsProvider {
  switch (config.smsProvider) {
    case "unifonic":
      return unifonicSmsProvider;
    case "console":
    default:
      return consoleSmsProvider;
  }
}
