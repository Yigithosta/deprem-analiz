import { Platform, Share } from "react-native";

/**
 * Metin tabanlı bir dosyayı kullanıcıya verir: web'de tarayıcı indirmesi,
 * iOS/Android'de sistem paylaşım menüsü.
 */
export async function saveTextFile(filename: string, content: string, mime = "text/plain") {
  if (Platform.OS === "web") {
    // Excel'in Türkçe karakterleri doğru okuması için CSV'ye BOM eklenir.
    const blob = new Blob([mime === "text/csv" ? "﻿" + content : content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: filename, message: content });
}

/** Satır listesinden noktalı virgülle ayrılmış CSV üretir. */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [header.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\n");
}
