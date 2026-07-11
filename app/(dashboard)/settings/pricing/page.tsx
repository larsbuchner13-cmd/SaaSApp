import { PricingRuleForm } from "@/features/pricing/components/pricing-rule-form";
import { PricingRuleList } from "@/features/pricing/components/pricing-rule-list";
import { listPricingRules } from "@/repositories/pricing-rules";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

export default async function PricingRulesPage() {
  const { companyId } = await getTenantContext();
  const rules = await listPricingRules(companyId);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Preisregeln</h1>

      <PricingRuleList rules={rules} />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Neue Regel</h2>
        <PricingRuleForm />
      </div>
    </main>
  );
}
