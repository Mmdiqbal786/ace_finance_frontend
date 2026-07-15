"use client";

import CatalogAdminPanel, { CatalogAdminConfig } from "./CatalogAdminPanel";
import { validateCurrencyCode } from "../../lib/validation";

const COUNTRIES_CONFIG: CatalogAdminConfig = {
  endpoint: "countries",
  singular: "Country",
  plural: "Countries",
  totalStatTitle: "Total Countries",
  totalStatSubtext: "Configured countries",
  totalEmoji: "🌍",
  activeSubtext: "Available for selection",
  searchPlaceholder: "Search name or currency...",
  emptyTitle: "No countries yet",
  emptyHint: "Add a country and its currency code (e.g. USD, INR, AED).",
  nameCreateLabel: "Country Name",
  namePlaceholder: "United Arab Emirates",
  nameValidateLabel: "Country name",
  secondary: {
    key: "currency",
    createLabel: "Currency",
    editLabel: "Currency",
    placeholder: "AED",
    required: true,
    mono: true,
    validate: validateCurrencyCode,
    getValue: (item) => String(item.currency ?? ""),
    toBodyValue: (value) => value.trim().toUpperCase(),
  },
};

interface CountriesPanelProps {
  onCatalogChanged?: () => void;
  openCreateSignal?: number;
}

export default function CountriesPanel(props: CountriesPanelProps) {
  return <CatalogAdminPanel config={COUNTRIES_CONFIG} {...props} />;
}
