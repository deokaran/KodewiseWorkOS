"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export function BrandSwitcher({ activeBrand }: { activeBrand: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleBrandChange = (value: string | null) => {
    if (!value || value === "none") return;
    startTransition(() => {
      // Set cookie to expire in 1 year
      document.cookie = `activeBrand=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Space:</span>
      <Select 
        value={activeBrand} 
        onValueChange={handleBrandChange}
        disabled={isPending}
        items={[
          { value: "Football Counter", label: "Football Counter" },
          { value: "Kodewise", label: "Kodewise" }
        ]}
      >
        <SelectTrigger className="w-[180px] h-8 bg-indigo-50/50 border-indigo-100 text-indigo-900 font-medium hover:bg-indigo-50">
          <SelectValue placeholder="Select Brand" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Football Counter">Football Counter</SelectItem>
          <SelectItem value="Kodewise">Kodewise</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
