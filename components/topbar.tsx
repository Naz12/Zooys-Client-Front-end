import ThemeToggle from "./ui/theme-toggle";
import LangSwitch from "./ui/lang-switch";

export default function Topbar() {
  return (
    <header className="flex justify-end items-center gap-4 p-4 border-b">
      <LangSwitch />
      <ThemeToggle />
    </header>
  );
}
