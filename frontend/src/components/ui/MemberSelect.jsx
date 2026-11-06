import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { membersApi } from "../../api";
import Avatar from "./Avatar";
import { Spinner } from "./States";

/**
 * Search-as-you-type member picker.
 *   <MemberSelect selected={member} onSelect={setMember} error={errors.member} />
 * `selected` is a member object (or null). Only active members are listed.
 */
export default function MemberSelect({ selected, onSelect, error, disabled = false, placeholder = "Search by name, phone or code..." }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      membersApi
        .list({ search: query, page_size: 8, is_active: true })
        .then((data) => active && setOptions(data.results))
        .catch(() => active && setOptions([]))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (selected) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border bg-ink-900 px-3 py-2 ${error ? "border-red-500/70" : "border-ink-600"}`}>
        <Avatar name={selected.full_name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-100">{selected.full_name}</p>
          <p className="truncate text-xs text-ink-300">
            {selected.member_code} · {selected.phone}
          </p>
        </div>
        {!disabled && (
          <button type="button" className="icon-btn" onClick={() => onSelect(null)} aria-label="Choose a different member">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        className={`input ${error ? "input-error" : ""}`}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-ink-600 bg-ink-800 p-1 shadow-2xl">
          {loading && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-ink-300">
              <Spinner className="h-4 w-4" /> Searching...
            </li>
          )}
          {!loading && options.length === 0 && <li className="px-3 py-2 text-sm text-ink-300">No active members found.</li>}
          {options.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-ink-700"
                onClick={() => {
                  onSelect(member);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <Avatar name={member.full_name} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-100">{member.full_name}</span>
                  <span className="block truncate text-xs text-ink-300">
                    {member.member_code} · {member.phone}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
