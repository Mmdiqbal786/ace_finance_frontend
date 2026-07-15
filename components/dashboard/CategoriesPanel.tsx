"use client";

import CatalogAdminPanel, { CatalogAdminConfig } from "./CatalogAdminPanel";
import { validateCategoryLabel } from "../../lib/validation";

const CATEGORIES_CONFIG: CatalogAdminConfig = {
  endpoint: "categories",
  singular: "Category",
  plural: "Categories",
  totalStatTitle: "Total Categories",
  totalStatSubtext: "Configured categories",
  totalEmoji: "🏷️",
  activeSubtext: "Shown on expense form",
  searchPlaceholder: "Search name or label...",
  emptyTitle: "No categories match filters",
  nameCreateLabel: "Name (value stored)",
  namePlaceholder: "Travel",
  nameValidateLabel: "Name",
  secondary: {
    key: "label",
    createLabel: "Label (display)",
    editLabel: "Label",
    placeholder: "Travel & Lodging",
    required: true,
    validate: validateCategoryLabel,
    getValue: (item) => String(item.label ?? ""),
    toBodyValue: (value) => value.trim(),
  },
};

interface CategoriesPanelProps {
  onCatalogChanged?: () => void;
  openCreateSignal?: number;
}

export default function CategoriesPanel(props: CategoriesPanelProps) {
  return <CatalogAdminPanel config={CATEGORIES_CONFIG} {...props} />;
}
