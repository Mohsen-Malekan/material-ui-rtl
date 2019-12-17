import get from "lodash/get";
import { TReportInstance } from "components/Report";
import { loadSettings, primary, fontFamily } from "components/Theme";

export default function getBarOptions(instance: TReportInstance) {
  const { direction, type } = loadSettings();
  const name = get(instance, "name", instance.report.name);
  const theme = get(instance, "config.theme", "default");
  const color =
    theme === "vintage" ? "#555" : type === "dark" ? "#eee" : "#555";

  return {
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
      show: true,
      trigger: "axis",
      axisPointer: {
        type: "shadow" // 'line' | 'shadow'
      }
    },
    legend: {
      show: true,
      type: "scroll",
      top: "bottom",
      left: direction === "rtl" ? "left" : "right",
      textStyle: { color }
    },
    grid: {
      left: 30,
      right: "4%",
      bottom: 35,
      containLabel: true
    },
    xAxis: {
      show: true,
      type: "category",
      splitLine: { show: false },
      name: "",
      nameLocation: "end",
      nameGap: 0,
      nameRotate: 0,
      nameTextStyle: {
        fontWeight: "normal",
        fontSize: 12,
        align: "center",
        verticalAlign: "top",
        lineHeight: 50
      },
      axisLabel: {
        rotate: 0,
        inside: false,
        formatter: "{value}"
      },
      axisLine: {
        lineStyle: { color }
      }
    },
    yAxis: {
      show: true,
      type: "value",
      name: "",
      nameLocation: "center",
      nameGap: 55,
      nameRotate: 90,
      nameTextStyle: {
        fontWeight: "bold",
        fontSize: 16,
        align: null,
        verticalAlign: null,
        lineHeight: null
      },
      axisLabel: {
        rotate: 0,
        inside: false,
        formatter: "{value}"
      },
      axisLine: {
        lineStyle: { color }
      }
    },
    textStyle: {
      fontFamily
    }
  };
}
