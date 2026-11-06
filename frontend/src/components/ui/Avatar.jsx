import { initials } from "../../utils/format";

export default function Avatar({ name, size = "md" }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-ink-950 ${sizes[size]}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
