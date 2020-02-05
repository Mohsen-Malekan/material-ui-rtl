import React from "react";
import { TChartTheme, TReportInstance } from "components/Report";
import { publish } from "components/PubSub";
import { Echarts } from ".";

type propsType = {
  instance: TReportInstance;
  options: object;
  theme: TChartTheme;
  loading: boolean;
};

const Chart = (props: propsType) => {
  const { instance, loading, options, theme } = props;

  const handleChartClick = (payload: any) => {
    publish({ id: instance.id, payload });
  };

  return (
    <Echarts
      instance={instance}
      options={options}
      loading={loading}
      theme={theme}
      onChartClick={handleChartClick}
    />
  );
};

export default Chart;
