import { ReactNode } from 'react';

interface AdminInputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
}

export default function AdminInputField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
}: AdminInputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#2B3037]">{label}</label>
      <div className="flex items-center gap-3 h-12 px-4 rounded-xl border border-[#DDDFE3] bg-[#F7F8FA] focus-within:border-[#0057FF]">
        {icon}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-[#2B3037] placeholder:text-[#8B94A4] outline-none"
        />
      </div>
    </div>
  );
}
