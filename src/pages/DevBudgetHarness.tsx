import { useState } from "react";
import { CustomBudgetDialog } from "@/components/improved-reviews/tabs/components/CustomBudgetDialog";

export default function DevBudgetHarness() {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-8">
      <button onClick={() => setOpen(true)}>abrir</button>
      <CustomBudgetDialog open={open} onClose={() => setOpen(false)} onSubmit={async () => {}} />
    </div>
  );
}
