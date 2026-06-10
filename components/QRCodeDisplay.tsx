"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="rounded-xl bg-white p-3 shadow-lg">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-xs text-slate-500 max-w-[220px] text-center break-all">
        {value}
      </p>
    </div>
  );
}
