import { Suspense } from "react";
import TrainingProgramGeneratorPageBody from "@/components/pages/TrainingProgramGenerator/PageBody";

export default function TrainingProgramGeneratorPage() {
  return (
    <Suspense>
      <TrainingProgramGeneratorPageBody />
    </Suspense>
  );
}
