const PROJECT_IMAGES = {
  school:
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200",
  hospital:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200",
  bridge:
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200",
  mall: "https://images.unsplash.com/photo-1481437156560-3205f6a55735?q=80&w=1200",
  airport:
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200",
  building:
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200",
  factory:
    "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1200",
  city: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1200",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1200";

export function getProjectImage(projectName: string): string {
  const name = projectName.toLowerCase();

  for (const keyword in PROJECT_IMAGES) {
    if (name.includes(keyword)) {
      return PROJECT_IMAGES[keyword as keyof typeof PROJECT_IMAGES];
    }
  }

  return DEFAULT_IMAGE;
}
