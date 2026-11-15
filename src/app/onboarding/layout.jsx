export const metadata = {
  title: "Personalize Your Listening — GolpoBook",
  description: "Customize your language, genre, and topic preferences for personalized audiobook recommendations.",
};

export default function OnboardingLayout({ children }) {
  return (
    <div className="h-screen h-dvh max-h-screen overflow-hidden bg-background text-foreground flex flex-col font-sans selection:bg-canary selection:text-ink">
      {children}
    </div>
  );
}
