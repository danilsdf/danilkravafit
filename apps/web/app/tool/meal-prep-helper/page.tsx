import { Suspense } from "react";
import MealPrepHelperPageBody from "@/components/pages/MealPrepHelper/PageBody";

export default function MealPrepHelperPage() {
  return (
    <Suspense>
      <MealPrepHelperPageBody />
    </Suspense>
  );
}