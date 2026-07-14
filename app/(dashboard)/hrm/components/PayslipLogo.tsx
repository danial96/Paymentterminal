"use client";

export function PayslipLogo() {
  return (
    <img
      src="/ikia-logo.png"
      alt=""
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      className="h-14 w-auto object-contain"
    />
  );
}
