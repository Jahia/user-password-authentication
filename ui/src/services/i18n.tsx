import { t } from "i18next";

export function tError(error: {
  code: string;
  arguments: Array<{ name: string; value: string }>;
}): string {
  // Convert array of {name, value} to interpolation object
  const interpolationData: Record<string, string> = {};

  error.arguments.forEach((arg) => {
    interpolationData[arg.name] = arg.value;
  });
  return t(error.code, interpolationData);
}
