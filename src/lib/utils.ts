import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  if (currency === "INR") {
    return formatIndianCurrency(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatIndianCurrency(amount: number): string {
  const crore = 10000000;
  const lakh = 100000;

  if (Math.abs(amount) >= crore) {
    const value = amount / crore;
    return `₹ ${value.toFixed(value % 1 === 0 ? 0 : 1)} Cr`;
  }
  if (Math.abs(amount) >= lakh) {
    const value = amount / lakh;
    return `₹ ${value.toFixed(value % 1 === 0 ? 0 : 1)} L`;
  }
  return `₹ ${new Intl.NumberFormat("en-IN").format(amount)}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹ ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return "var(--color-success)";
  if (progress >= 50) return "var(--color-primary)";
  if (progress >= 25) return "var(--color-warning)";
  return "var(--color-error)";
}

export function getStatusColor(status?: string | null): {
  bg: string;
  text: string;
  dot: string;
} {
  const safeStatus = (status || "pending").toLowerCase();
  const statusMap: Record<string, { bg: string; text: string; dot: string }> = {
    planning: { bg: "#DBEAFE", text: "#2563EB", dot: "#3B82F6" },
    active: { bg: "#DCFCE7", text: "#16A34A", dot: "#22C55E" },
    "on-hold": { bg: "#FEF3C7", text: "#D97706", dot: "#F59E0B" },
    completed: { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
    cancelled: { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
    delayed: { bg: "#FFF7ED", text: "#C2410C", dot: "#EA580C" },
    "on-track": { bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
    "at-risk": { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
    "not-started": { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
    "in-progress": { bg: "#DBEAFE", text: "#2563EB", dot: "#3B82F6" },
    blocked: { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
    approved: { bg: "#DCFCE7", text: "#16A34A", dot: "#22C55E" },
    pending: { bg: "#FEF3C7", text: "#D97706", dot: "#F59E0B" },
    pending_approval: { bg: "#FEF3C7", text: "#D97706", dot: "#F59E0B" },
    rejected: { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
    draft: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
    "low-stock": { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
    "in-stock": { bg: "#DCFCE7", text: "#16A34A", dot: "#22C55E" },
    "out-of-stock": { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  };

  return statusMap[safeStatus] || { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" };
}

export function generateProjectCode(prefix: string = "PRJ", num: number): string {
  return `${prefix}-${String(num).padStart(3, "0")}`;
}

export function calculateDaysRemaining(endDate: string | Date): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / 86400000);
}

export function isOverdue(endDate: string | Date): boolean {
  return calculateDaysRemaining(endDate) < 0;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Pool of verified authentic active construction site images (cranes, excavators, rebar, scaffolds, concrete)
const PROJECT_IMAGES_POOL = [
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Tower_crane_at_a_building_construction_site_in_Taichung_2023-05-13_01.jpg/960px-Tower_crane_at_a_building_construction_site_in_Taichung_2023-05-13_01.jpg", // Active residential high-rise building under construction with tower crane
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop", // Commercial high-rise structural rebar & workers with tower cranes
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Jiangsu_Provincial_Highway_238_construction_site_%2820240217%29_P3.jpg/960px-Jiangsu_Provincial_Highway_238_construction_site_%2820240217%29_P3.jpg", // Heavy highway flyover & bridge civil engineering construction site
  "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop", // Industrial site construction worker with hardhat, safety gear & power tool
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Excavator_performs_earth_digging.jpg/960px-Excavator_performs_earth_digging.jpg", // Heavy CAT excavator performing site excavation and foundation digging
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Constructions_and_scaffolding_at_the_Oosterdokseiland%2C_Amsterdam-Centrum.jpg/960px-Constructions_and_scaffolding_at_the_Oosterdokseiland%2C_Amsterdam-Centrum.jpg", // Building under construction surrounded by heavy scaffolding and framework
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Hitachi_Zaxis_135US_Excavator_Digging_in_Section_7%2C_Shimin_Blvd%2C_Taipei_20141220.jpg/960px-Hitachi_Zaxis_135US_Excavator_Digging_in_Section_7%2C_Shimin_Blvd%2C_Taipei_20141220.jpg", // Heavy excavator digging foundations on active site
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Crane_at_construction_site_-_geograph.org.uk_-_7593527.jpg/960px-Crane_at_construction_site_-_geograph.org.uk_-_7593527.jpg", // Heavy yellow crane at structural construction site
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Tower_crane_at_a_building_construction_site_in_Taichung_2023-05-13_03.jpg/960px-Tower_crane_at_a_building_construction_site_in_Taichung_2023-05-13_03.jpg", // Concrete tower structure under construction with crane
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Large_scaffoldings_on_the_construction_site_of_the_new_Library_at_Oosterdokseiland%2C_Amsterdam-Centrum%2C_2006.jpg/960px-Large_scaffoldings_on_the_construction_site_of_the_new_Library_at_Oosterdokseiland%2C_Amsterdam-Centrum%2C_2006.jpg", // Multi-story building construction scaffolding
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop", // Construction site blueprints, plans & architectural layout
];

// Specific mappings for known demo projects for thematic alignment with active construction sites
const SPECIFIC_PROJECT_IMAGE_MAP: Record<string, string> = {
  "p1": PROJECT_IMAGES_POOL[0], // Green Valley Residency -> Active residential high-rise building under construction with tower crane
  "prj-001": PROJECT_IMAGES_POOL[0],
  "p2": PROJECT_IMAGES_POOL[1], // Skyline Towers -> High-rise commercial tower site with workers & rebar
  "prj-002": PROJECT_IMAGES_POOL[1],
  "p3": PROJECT_IMAGES_POOL[2], // Metro Express Highway Flyover -> Bridge & highway flyover civil engineering construction
  "prj-003": PROJECT_IMAGES_POOL[2],
  "p4": PROJECT_IMAGES_POOL[3], // Sunrise Industrial Warehouse -> Industrial site construction worker with hardhat & safety gear
  "prj-004": PROJECT_IMAGES_POOL[3],
  "p5": PROJECT_IMAGES_POOL[4], // Palm Grove Luxury Villas -> Heavy excavator digging foundation on site
  "prj-005": PROJECT_IMAGES_POOL[4],
};

/**
 * Returns a distinct, appropriate construction/architectural image for each project.
 */
export function getProjectImageUrl(project?: { id?: string; project_code?: string; thumbnail_url?: string; name?: string } | null): string {
  if (!project) return PROJECT_IMAGES_POOL[0];
  if (project.thumbnail_url && project.thumbnail_url.trim().length > 0) {
    return project.thumbnail_url;
  }

  const idKey = (project.id || "").toLowerCase();
  const codeKey = (project.project_code || "").toLowerCase();

  if (SPECIFIC_PROJECT_IMAGE_MAP[idKey]) return SPECIFIC_PROJECT_IMAGE_MAP[idKey];
  if (SPECIFIC_PROJECT_IMAGE_MAP[codeKey]) return SPECIFIC_PROJECT_IMAGE_MAP[codeKey];

  // Deterministic hash based on project id, code, or name to always pick a unique image from pool
  const seedString = (project.project_code || project.id || project.name || "default").toLowerCase();
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PROJECT_IMAGES_POOL.length;
  return PROJECT_IMAGES_POOL[index];
}

