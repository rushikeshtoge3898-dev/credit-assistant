import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, Building2, X } from "lucide-react";
import {
  INDIAN_BANKS,
  BANK_CATEGORIES,
  OTHER_BANK_OPTION,
  getFilteredBanks,
} from "../data/indianBanks";

export default function BankSelector({
  value,
  onChange,
  label = "Bank / Lender",
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Banks");
  const [isCustom, setIsCustom] = useState(false);
  const [customBankName, setCustomBankName] = useState("");

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Check whether the current value matches a known bank
  useEffect(() => {
    if (!value) {
      setIsCustom(false);
      setCustomBankName("");
      return;
    }
    const isKnown = INDIAN_BANKS.some((b) => b.name === value);
    if (!isKnown && value !== OTHER_BANK_OPTION) {
      setIsCustom(true);
      setCustomBankName(value);
    } else {
      setIsCustom(false);
    }
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredBanks = useMemo(() => {
    return getFilteredBanks(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  const handleSelectBank = (bankName) => {
    setIsCustom(false);
    setCustomBankName("");
    onChange(bankName);
    setIsOpen(false);
  };

  const handleSelectOther = () => {
    setIsCustom(true);
    setCustomBankName("");
    onChange("");
    setIsOpen(false);
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomBankName(val);
    onChange(val);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block font-semibold text-slate-300 mb-1 text-xs sm:text-sm">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left text-sm text-white flex items-center justify-between gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <span className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">
            {isCustom
              ? customBankName
                ? `${customBankName} (Other)`
                : OTHER_BANK_OPTION
              : value || "Select Indian Bank..."}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-3 space-y-2.5 max-w-full">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search bank name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">
              Category:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {BANK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Bank Options Scrollable List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredBanks.length > 0 ? (
              filteredBanks.map((bank) => {
                const isSelected = value === bank.name;
                return (
                  <button
                    key={bank.name}
                    type="button"
                    onClick={() => handleSelectBank(bank.name)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30"
                        : "text-slate-300 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate">{bank.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {bank.category}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-3 text-center text-xs text-slate-500">
                No bank matches &quot;{searchQuery}&quot; in {selectedCategory}.
              </div>
            )}

            {/* Other / Custom Option */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSelectOther}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isCustom
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                }`}
              >
                <span>{OTHER_BANK_OPTION}</span>
                {isCustom && (
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* If "Other / Bank not listed" is selected, render direct custom input */}
      {isCustom && (
        <div className="mt-2 animate-fade-in">
          <input
            type="text"
            required={required}
            placeholder="Type your bank or lending institution name..."
            value={customBankName}
            onChange={handleCustomChange}
            className="w-full px-3.5 py-2 bg-slate-950 border border-indigo-500/40 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      )}
    </div>
  );
}
