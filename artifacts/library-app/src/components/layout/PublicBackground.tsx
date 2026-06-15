const LIBRARY_TEXTURE =
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1920&q=80";

export function PublicBackground() {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: `url(${LIBRARY_TEXTURE})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/8 via-background to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none" />
    </>
  );
}

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80";
