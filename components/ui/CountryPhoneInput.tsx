"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, CheckCircle2 } from "lucide-react";
import styles from "./CountryPhoneInput.module.css";

export interface CountryData {
  code: string;
  name: string;
  flagUrl: string;
  prefix: string;
  digits: number;
  placeholder: string;
  searchTerms: string;
}

export const COUNTRIES: CountryData[] = [
  {
    code: "CO",
    name: "Colombia",
    flagUrl: "/images/countries_flags/co.svg",
    prefix: "+57",
    digits: 10,
    placeholder: "300 123 4567",
    searchTerms: "colombia +57 57 co",
  },
  {
    code: "MX",
    name: "México",
    flagUrl: "/images/countries_flags/mx.svg",
    prefix: "+52",
    digits: 10,
    placeholder: "55 1234 5678",
    searchTerms: "mexico méxico +52 52 mx",
  },
  {
    code: "PE",
    name: "Perú",
    flagUrl: "/images/countries_flags/pe.svg",
    prefix: "+51",
    digits: 9,
    placeholder: "912 345 678",
    searchTerms: "peru perú +51 51 pe",
  },
  {
    code: "US",
    name: "Estados Unidos",
    flagUrl: "/images/countries_flags/us.svg",
    prefix: "+1",
    digits: 10,
    placeholder: "202 555 0123",
    searchTerms: "estados unidos eeuu usa +1 1 us",
  },
];

interface CountryPhoneInputProps {
  name?: string;
  countryName?: string;
  defaultCountry?: string;
  required?: boolean;
  error?: string;
  onValidationChange?: (isValid: boolean, phone: string, countryCode: string) => void;
}

export function CountryPhoneInput({
  name = "whatsapp",
  countryName = "country",
  defaultCountry = "CO",
  required = true,
  error: externalError,
  onValidationChange,
}: CountryPhoneInputProps) {
  const [selectedCode, setSelectedCode] = useState(defaultCountry);
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeCountry =
    COUNTRIES.find((c) => c.code === selectedCode) || COUNTRIES[0];

  // Number validation: count digits only
  const cleanPhone = phone.replace(/\D/g, "");
  const isValid = cleanPhone.length === activeCountry.digits;
  const isTooShort = cleanPhone.length > 0 && cleanPhone.length < activeCountry.digits;

  // Derive error message
  let displayError = externalError;
  if (!displayError && touched) {
    if (required && !cleanPhone) {
      displayError = "El número de WhatsApp es requerido.";
    } else if (isTooShort) {
      displayError = `El número para ${activeCountry.name} debe tener ${activeCountry.digits} dígitos (llevas ${cleanPhone.length}).`;
    }
  }

  useEffect(() => {
    onValidationChange?.(isValid, phone, activeCountry.code);
  }, [isValid, phone, activeCountry.code]);

  const handleBlur = () => {
    setTouched(true);
  };

  // Filter countries by search query
  const filteredCountries = COUNTRIES.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.prefix.includes(q) ||
      c.searchTerms.toLowerCase().includes(q)
    );
  });

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelectCountry = (country: CountryData) => {
    setSelectedCode(country.code);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Hidden field for form submission (Country Code) */}
      <input type="hidden" name={countryName} value={activeCountry.code} />

      <div
        className={`${styles.phoneGroup} ${
          displayError ? styles.phoneGroupError : ""
        }`}
      >
        {/* Left: Flag Picker Button (ONLY FLAG + CHEVRON) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Seleccionar país"
          className={styles.flagButton}
        >
          <img
            src={activeCountry.flagUrl}
            alt={activeCountry.name}
            className={styles.flagImg}
          />
          <ChevronDown
            size={14}
            className={`${styles.chevronIcon} ${
              isOpen ? styles.chevronOpen : ""
            }`}
          />
        </button>

        {/* Center: Prefix + Phone Input */}
        <div className={styles.inputWrapper}>
          <span className={styles.prefix}>{activeCountry.prefix}</span>
          <input
            type="tel"
            id={`register-${name}`}
            name={name}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={handleBlur}
            placeholder={activeCountry.placeholder}
            required={required}
            className={styles.phoneInput}
          />

          {/* Right: Green Validation Checkmark */}
          {isValid && (
            <div className={styles.checkmark}>
              <CheckCircle2 size={18} fill="#16A34A" color="#FFFFFF" />
            </div>
          )}
        </div>
      </div>

      {displayError && (
        <p className={styles.errorMessage}>{displayError}</p>
      )}

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div className={styles.popover}>
          {/* Search Input Header */}
          <div className={styles.searchHeader}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar país o código..."
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Country Options List */}
          <div className={styles.countryList}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = c.code === activeCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`${styles.countryItem} ${
                      isSelected ? styles.countryItemSelected : ""
                    }`}
                  >
                    <img
                      src={c.flagUrl}
                      alt={c.name}
                      className={styles.flagImg}
                    />
                    <span className={styles.countryItemName}>{c.name}</span>
                    <span className={styles.countryItemPrefix}>{c.prefix}</span>
                  </button>
                );
              })
            ) : (
              <div className={styles.noResults}>
                No se encontraron países
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
