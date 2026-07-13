import { OrganizationList } from "@clerk/nextjs";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Willkommen!</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          Erstelle deinen Betrieb oder nimm eine Einladung an, um loszulegen.
        </p>
      </div>
      <OrganizationList
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
        hidePersonal
      />
    </main>
  );
}
