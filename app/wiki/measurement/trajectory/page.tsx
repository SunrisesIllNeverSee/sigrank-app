import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Trajectory",
  description:
    "How an operator's metrics change over time — the temporal dimension of operator measurement.",
  path: "/wiki/measurement/trajectory",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Operator", href: "/wiki/measurement/operator" },
  { label: "Cohort", href: "/wiki/measurement/cohort" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function TrajectoryPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Measurement", path: "/wiki#evidence-measurement" },
            { name: "Trajectory", path: "/wiki/measurement/trajectory" },
          ]),
          definedTerm(
            "Trajectory",
            "How an operator's metrics change over time — the temporal dimension of operator measurement.",
            "/wiki/measurement/trajectory",
          ),
        ]}
      />
      <WikiEntry
        title="Trajectory"
        summary="How an operator's metrics change over time — the temporal dimension of operator measurement."
        category="measurement"
        evidenceLevel="repeated-experiment"
        specVersion="SigRank Standard v1.0"
        definition={
          <>
            How an operator&apos;s metrics change over time. The temporal
            dimension of operator measurement.
          </>
        }
        inputs={
          <>
            Time-series of token pillars across windows for a given operator.
          </>
        }
        derivedVariables={
          <>
            Trend slopes, volatility, adaptation rates, regime changes.
          </>
        }
        claim={
          <>
            Operators adapt over time — their token cascade efficiency changes as
            they learn, switch tools, or change workflows.
          </>
        }
        test={
          <>
            Compare early-window vs late-window metrics for the same operator.
          </>
        }
        observable={
          <>Metric slopes over time, volatility, adaptation events.</>
        }
        falsifiers={
          <>
            If metrics are stationary across all time windows for all operators,
            trajectory is not meaningful.
          </>
        }
        evidence={
          <>Field data shows non-stationary operator trajectories.</>
        }
        limitations={
          <>
            Trajectory is confounded with tool/model changes and task selection
            shifts.
          </>
        }
        lineage={
          <>Upsilon adaptation analysis, SigRank time-window methodology. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
