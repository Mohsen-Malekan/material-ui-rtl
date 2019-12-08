import get from "lodash/get";
import merge from "lodash/merge";
import { loadSettings, primary, fontFamily } from "components/Theme";
import { TReportInstance, TChartTheme } from "components/Report";
import { getThemeOptions } from ".";

export default function getHeatmapOptions(instance: TReportInstance) {
  const { direction } = loadSettings();
  const chartTheme: TChartTheme = get(instance, "config.theme", "default");
  const name = get(instance, "name", instance.report.name);

  return merge(getThemeOptions(chartTheme), {
    title: {
      show: true,
      text: name,
      textAlign: "left",
      [direction === "rtl" ? "right" : "left"]: "32px",
      textStyle: {
        fontSize: 18,
        fontWeight: "lighter",
        color: primary[500]
      }
    },
    tooltip: {
      position: "top"
    },
    animation: true,
    grid: {
      height: "50%",
      y: "10%"
    },
    xAxis: {
      type: "category",
      splitNumber: 20,
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: "category",
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: "15%"
      // inRange: {
      //   color: ["#121122", "rgba(3,4,5,0.4)", "red"]
      // }
    },
    textStyle: {
      fontFamily
    }
  });
}