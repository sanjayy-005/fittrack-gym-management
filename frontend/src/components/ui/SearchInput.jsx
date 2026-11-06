import { useEffect, useState } from "react";
import { Search } from "lucide-react";

/** Search box that waits until the user stops typing before calling onChange (saves API calls). */
export default function SearchInput({ value, onChange, placeholder = "Search...", className = "" }) {
  const [local, setLocal] = useState(value ?? "");

  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  useEffect(() => {
    if (local.trim() === (value ?? "")) return undefined;
    const timer = setTimeout(() => onChange(local.trim()), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
      <input
        type="search"
        value={local}
        onChange={(event) => setLocal(event.target.value)}
        placeholder={placeholder}
        className="input pl-10"
        aria-label={placeholder}
      />
    </div>
  );
}
