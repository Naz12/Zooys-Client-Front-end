"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LangSwitch() {
  const [lang, setLang] = useState("EN");

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(lang === "EN" ? "AM" : "EN")}
    >
      {lang === "EN" ? "English" : "አማርኛ"}
    </Button>
  );
}
