import { TReportInstance, TReportData } from "components/Report";

export default function pieData(instance: TReportInstance, data: TReportData) {
  const length = data.cols.length === 0 ? 0 : data.cols.length - 1;
  const series = Array(length).fill({
    type: "pie",
    label: {
      show: true,
      position: "outside",
      alignTo: "labelLine",
      formatter: "{b} - {d}%"
    },
    radius: [0, "75%"],
    roseType: false
  });

  return {
    dataset: {
      dimensions: data.cols.map(c => c.key),
      source: data.rows.map(r => r.cols)
    },
    series
  };
}
