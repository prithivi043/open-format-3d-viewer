const PROJECT_IMAGES = {
  temple:
    "https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=1200",

  hindu_temple:
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1200",

  church:
    "https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=1200",

  mosque:
    "https://images.unsplash.com/photo-1564769625905-50e93615e769?q=80&w=1200",

  school:
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200",

  hospital:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200",

  factory:
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=1200",

  mall: "https://images.unsplash.com/photo-1481437156560-3205f6a55735?q=80&w=1200",

  bridge:
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200",

  airport:
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200",

  building:
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1200";

export function getProjectImage(projectName: string) {
  const name = projectName.toLowerCase();

  if (
    name.includes("hindu") ||
    name.includes("kovil") ||
    name.includes("mandir")
  ) {
    return PROJECT_IMAGES.hindu_temple;
  }

  if (name.includes("temple")) {
    return PROJECT_IMAGES.temple;
  }

  if (name.includes("church")) {
    return PROJECT_IMAGES.church;
  }

  if (name.includes("mosque") || name.includes("masjid")) {
    return PROJECT_IMAGES.mosque;
  }

  if (
    name.includes("school") ||
    name.includes("college") ||
    name.includes("university")
  ) {
    return PROJECT_IMAGES.school;
  }

  if (name.includes("hospital")) {
    return PROJECT_IMAGES.hospital;
  }

  if (
    name.includes("factory") ||
    name.includes("manufacturing") ||
    name.includes("industry")
  ) {
    return PROJECT_IMAGES.factory;
  }

  if (name.includes("mall")) {
    return PROJECT_IMAGES.mall;
  }

  if (name.includes("bridge")) {
    return PROJECT_IMAGES.bridge;
  }

  if (name.includes("airport")) {
    return PROJECT_IMAGES.airport;
  }

  if (
    name.includes("building") ||
    name.includes("tower") ||
    name.includes("office")
  ) {
    return PROJECT_IMAGES.building;
  }

  return DEFAULT_IMAGE;
}
