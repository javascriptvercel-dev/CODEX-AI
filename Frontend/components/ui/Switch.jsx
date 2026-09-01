"use client";
export default function Switch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`focus-ring inline-flex h-6 w-11 flex-none items-center rounded-full border p-0.5 transition-colors duration-200 ${checked ? "border-azure-500 bg-azure-500" : "border-edge bg-surface2"} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >

      <span
        aria-hidden="true"
        className={`block h-5 w-5 flex-none rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
