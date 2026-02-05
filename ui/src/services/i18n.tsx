import { useTranslation } from "react-i18next";

export function tError(error: {
  code: string;
  arguments?: Array<{ name: string; value: string }>;
}): string {
  const { t } = useTranslation();
  // Convert array of {name, value} to interpolation object
  const interpolationData: Record<string, string> = {};

  if (error.arguments) {
    error.arguments.forEach((arg) => {
      interpolationData[arg.name] = arg.value;
    });
  }
  return t(error.code, interpolationData);
}
