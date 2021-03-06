import React, { Component } from "react";
import get from "lodash/get";
import keyBy from "lodash/keyBy";
import merge from "lodash/merge";
import omit from "lodash/omit";
import has from "lodash/has";
import { Moment } from "moment-jalaali";
import { withSnackbar, WithSnackbarProps } from "notistack";
import { withTheme, Theme } from "@material-ui/core/styles";
import { displayErrMsg, parseToJSON } from "utility";
import { withBreakPoint, TBreakPoint } from "components/Layout";
import { DeleteButton } from "components/Button";
import Chart, { chartOptions, chartData } from "components/Chart";
import Scalar, { IconMenu } from "components/Scalar";
import Composite from "components/Composite";
import Table from "components/Table";
import ReportCard from "components/ReportCard";
import { Modal } from "components/Modal";
import {
  ReportService,
  ExecError,
  Settings,
  ThemeMenu,
  SettingsMenu,
  AutoRefresh,
  Filters,
  Params,
  Export,
  Embed,
  SaveButton,
  TReportInstance,
  TReportData,
  TReportExecParams,
  TReportFilter,
  TReportType,
  TChartTheme,
  TReportIcons,
  TReportMenuAction,
  TQueryFilter,
  TQueryParam
} from "components/Report";
import { Subscriber, subscribeType } from "components/PubSub";

type propsType = {
  instanceId: number;
  onDelete: (instanceId: number) => void;
} & WithSnackbarProps & { bp: TBreakPoint } & { theme: Theme };

type stateType = {
  instance: TReportInstance;
  loading: boolean;
  error: boolean;
  data: TReportData | undefined;
  interval: number;
  isRunning: boolean;
  theme: TChartTheme;
  options: object;
  icon: TReportIcons;
  openFilters: boolean;
  openParams: boolean;
  openExport: boolean;
  openEmbed: boolean;
  openFullscreen: boolean;
  openSettings: boolean;
  filterVOS: TReportFilter[];
  parentParams: TQueryParam[];
  isDrillDown: boolean;
};

const noData = { cols: [], rows: [], totalCount: 0 };

class Report extends Component<propsType, stateType> {
  state: stateType = {
    instance: ReportService.get(this.props.instanceId),
    loading: false,
    error: false,
    data: undefined,
    interval: 0,
    isRunning: true,
    theme: "default",
    options: {},
    icon: "info",
    openFilters: false,
    openParams: false,
    openExport: false,
    openEmbed: false,
    openFullscreen: false,
    openSettings: false,
    filterVOS: [] as TReportFilter[],
    parentParams: [],
    isDrillDown: false
  };

  tempOptions: object = {};
  reportFilters: { [key: string]: TQueryFilter } = {};
  adminConfig = {
    refreshInterval: 0,
    theme: "default",
    icon: "info",
    options: {}
  };

  componentDidMount() {
    this.initialize();
  }

  componentDidUpdate(prevProps: propsType, prevState: stateType) {
    const { instance, theme } = this.state;
    const isChart =
      ["SCALAR", "TABLE", "FORM"].indexOf(instance.report.type) === -1;

    if (isChart) {
      if (
        prevProps.theme.palette.type !== this.props.theme.palette.type ||
        theme !== prevState.theme
        // || !isEqual(options, prevState.options)
      ) {
        this.updateOptions();
      }
    }
  }

  initialize() {
    const { instance } = this.state;
    const { report } = instance;
    const config = parseToJSON(report.config, { refreshInterval: 0 });
    const interval = get(config, "refreshInterval", 0);
    const theme = get(instance, "config.theme");
    const icon = get(instance, "config.icon");
    const options = this.getOptions();
    const parentParams = this.getParams();
    this.setState({ interval, theme, icon, options, parentParams });

    const { queryFilters } = report.query;
    this.reportFilters = keyBy(queryFilters, "id");

    if (["FORM"].indexOf(report.type) === -1) {
      this.execReport();
    }
  }

  execReport = (params?: TReportExecParams, showLoading?: boolean) => {
    const { instance, parentParams } = this.state;
    const loading = showLoading === undefined ? true : showLoading;
    const isTable = instance.report.type === "TABLE";
    this.setState({ loading, error: false });
    const filterVOS = this.processFilters();
    const _params = {
      size: isTable ? 10 : 0,
      filterVOS,
      parentParams,
      ...params
    };
    ReportService.execute(instance.id, _params)
      .then(data => this.setState({ data }, () => this.updateOptions()))
      .catch(() => this.setState({ error: true }))
      .finally(() => this.setState({ loading: false }));
  };

  updateOptions = () => {
    const { instance, data = noData, options } = this.state;
    const opt = this.getOptions();
    this.setState({
      options: merge(
        {},
        chartOptions(instance, options),
        chartData(instance, data),
        opt
      )
    });
  };

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ error: true });
    console.error(`Report ErrorBoundary> (${this.state.instance.id}) `, error);
  }

  processFilters = () => {
    return this.state.filterVOS.map(filter => {
      const reportFilter = this.reportFilters[filter.id];
      const filterType = reportFilter.type;
      let value = filter.value;
      if (filterType === "DATE") {
        value = (value as Moment).format("YYYY-MM-DD");
      } else if (filterType === "DATE_STRING") {
        value = (value as Moment).format("jYYYY-jMM-jDD");
      }
      return { ...filter, value };
    });
  };

  getParams() {
    const { instance } = this.state;
    if (ReportService.isComposite(instance)) {
      let _params = [] as TQueryParam[];
      for (const rep of instance.report.compositeSubReports) {
        _params = _params.concat(ReportService.getParams(rep));
      }
      return _params;
    }

    return ReportService.getParams(instance.report);
  }

  toggleFiltersModal = () => {
    this.setState(state => ({ openFilters: !state.openFilters }));
  };

  toggleParamsModal = () => {
    this.setState(state => ({ openParams: !state.openParams }));
  };

  toggleExportModal = () => {
    this.setState(state => ({ openExport: !state.openExport }));
  };

  toggleEmbedModal = () => {
    this.setState(state => ({ openEmbed: !state.openEmbed }));
  };

  toggleFullscreenModal = () => {
    this.setState(state => ({ openFullscreen: !state.openFullscreen }));
  };

  handleRetry = () => {
    const { bp, theme } = this.props;
    const { instance } = this.state;
    const type = theme.palette.type;
    instance.config.options[type][bp] = this.tempOptions;
    this.setState(
      {
        filterVOS: [] as TReportFilter[],
        options: this.getOptions()
      },
      () => {
        // this.execReport({ loadFromCache: false })
        if (["FORM"].indexOf(instance.report.type) === -1) {
          this.execReport({ loadFromCache: false });
        }
      }
    );
  };

  handleThemeChange = (theme: TChartTheme) => {
    const { instance } = this.state;
    instance.config.theme = theme;
    this.setState({ theme });
  };

  handleOptionChange = (options: object | "advanced") => {
    if (options === "advanced") {
      return this.handleToggleSettings();
    }

    const { bp, theme } = this.props;
    const { instance } = this.state;
    const type = theme.palette.type;
    this.tempOptions = get(instance, `config.options.${type}.${bp}`, {});
    instance.config.options[type][bp] = options;
    this.setState({ options }, this.updateOptions);
  };

  handleIconChange = (icon: TReportIcons) => {
    const { instance } = this.state;
    instance.config.icon = icon;
    this.setState({ icon });
  };

  handleFiltersChange = (filterVOS: TReportFilter[]) => {
    this.setState({ filterVOS });
    this.execReport();
    this.toggleFiltersModal();
  };

  handleParamsChange = (parentParams: TQueryParam[]) => {
    this.toggleParamsModal();
    this.setState({ parentParams }, this.execReport);
  };

  handleDelete = () => {
    const { id: instanceId } = this.state.instance;
    ReportService.delete(instanceId)
      .then(() => this.props.onDelete(instanceId))
      .catch(displayErrMsg(this.props.enqueueSnackbar));
  };

  getOptions() {
    const { bp, theme } = this.props;
    const { instance } = this.state;
    const type = theme.palette.type;

    const options = get(instance, `config.options.${type}.${bp}`);

    get(options, "series", []).forEach((s: any) => {
      has(s, "data") && Reflect.deleteProperty(s, "data");
    });

    return omit(options, [
      "dataset",
      "radar",
      "toolbox.feature.saveAsImage",
      "legend.textStyle"
    ]);
  }

  handleMenuItemClick = (key: TReportMenuAction) => {
    switch (key) {
      case "TOGGLE_AUTO_REFRESH":
        return this.setState(state => ({ isRunning: !state.isRunning }));

      case "REFRESH_REPORT":
        return this.execReport({ loadFromCache: false });

      case "DELETE_REPORT":
        return this.handleDelete();

      case "OPEN_FILTERS":
        return this.toggleFiltersModal();

      case "OPEN_PARAMS":
        return this.toggleParamsModal();

      case "OPEN_EXPORT":
        return this.toggleExportModal();

      case "FULLSCREEN":
        return this.toggleFullscreenModal();

      case "OPEN_EMBED":
        return this.toggleEmbedModal();

      case "BACK_FROM_DRILLDOWN":
        return this.setState(
          {
            instance: ReportService.get(this.props.instanceId),
            options: {},
            isDrillDown: false,
            filterVOS: [],
            parentParams: []
          },
          this.initialize
        );

      default:
        break;
    }
  };

  listener = (data: subscribeType) => {
    const { id, payload } = data;
    const instanceId = get(this.state, "instance.id", -1);
    const drillDownId = get(this.state, "instance.drillDownId", -1);
    const parentId = get(this.state, "instance.parentId", -1);

    if (id === instanceId && drillDownId > -1) {
      this.processDrilldown(drillDownId, payload);
    }
    if (id === parentId) {
      this.processLinked(parentId, payload);
    }
  };

  processDrilldown = (drillDownId: number, payload: any) => {
    const drillDownInstance = ReportService.get(drillDownId);
    const parentParams = drillDownInstance.report.query.queryParams.find(
      p => ["BY_PARENT", "BY_BUSINESS_OR_PARENT"].indexOf(p.fill) > -1
    );
    if (!!parentParams) {
      parentParams.value = payload.name;
    }
    this.setState(
      {
        instance: drillDownInstance,
        options: {},
        isDrillDown: true,
        parentParams: !!parentParams ? [parentParams] : []
      },
      this.initialize
    );
  };

  processLinked = (parentId: number, payload: any) => {
    const { instance } = this.state;
    const parentParams = instance.report.query.queryParams.find(
      p => ["BY_PARENT", "BY_BUSINESS_OR_PARENT"].indexOf(p.fill) > -1
    );
    if (!!parentParams) {
      parentParams.value = payload.name;
    }
    this.setState(
      {
        options: {},
        parentParams: !!parentParams ? [parentParams] : []
      },
      this.initialize
    );
  };

  handleToggleSettings = () => {
    this.setState(state => ({
      openSettings: !state.openSettings
    }));
  };

  renderActions = (type: TReportType) => {
    const { instance, data = noData, theme, icon } = this.state;
    switch (type) {
      case "SCALAR":
        return (
          <>
            <ThemeMenu theme={theme} onChange={this.handleThemeChange} />
            <SettingsMenu
              instance={instance}
              colsCount={data.cols.length}
              onChange={this.handleOptionChange}
            />
            <IconMenu icon={icon} onChange={this.handleIconChange} />
            <DeleteButton onDelete={this.handleDelete} size="small" />
            <SaveButton instanceId={instance.id} />
          </>
        );

      case "TABLE":
        return (
          <>
            <DeleteButton onDelete={this.handleDelete} size="small" />
          </>
        );

      default:
        return (
          <>
            <ThemeMenu theme={theme} onChange={this.handleThemeChange} />
            <SettingsMenu
              instance={instance}
              colsCount={data.cols.length}
              onChange={this.handleOptionChange}
            />
            <DeleteButton onDelete={this.handleDelete} size="small" />
            <SaveButton instanceId={instance.id} />
          </>
        );
    }
  };

  getReport = (type: TReportType) => {
    const { instance, data, options, theme, icon, loading } = this.state;

    switch (type) {
      case "SCALAR":
        return (
          <Scalar
            instance={instance}
            options={options}
            theme={theme}
            icon={icon}
            data={data}
            loading={loading}
          />
        );

      case "TABLE":
        return (
          <Table
            instance={instance}
            data={data}
            loading={loading}
            execReport={this.execReport}
          />
        );

      case "FORM":
        return <Composite instance={instance} />;

      default:
        return (
          <Chart
            instance={instance}
            // data={data}
            options={options}
            theme={theme}
            loading={loading}
          />
        );
    }
  };

  render() {
    const {
      instance,
      data,
      options,
      isRunning,
      interval,
      openFilters,
      openParams,
      openExport,
      openEmbed,
      openFullscreen,
      openSettings,
      filterVOS,
      parentParams,
      isDrillDown,
      error
    } = this.state;
    const isChart =
      ["SCALAR", "TABLE", "FORM"].indexOf(instance.report.type) === -1;

    if (error) {
      return (
        <ReportCard instance={instance}>
          <ExecError onRetry={this.handleRetry} onDelete={this.handleDelete} />
        </ReportCard>
      );
    }

    if (!!data && isChart && data.rows.length === 0) {
      return (
        <ReportCard instance={instance}>
          <ExecError
            onRetry={this.handleRetry}
            onDelete={this.handleDelete}
            message="داده ای وجود ندارد"
          />
        </ReportCard>
      );
    }

    return (
      <Subscriber listener={this.listener}>
        <ReportCard
          instance={instance}
          autoRefresh={interval > 0}
          isRunning={isRunning}
          isDrillDown={isDrillDown}
          onMenuItemClick={this.handleMenuItemClick}
          actions={this.renderActions(instance.report.type)}
        >
          <Modal
            open={openFilters}
            onClose={this.toggleFiltersModal}
            maxWidth="md"
            keepMounted={false}
            actions={<></>}
          >
            <Filters
              instance={instance}
              initials={filterVOS}
              reportFilters={this.reportFilters}
              onClose={this.toggleFiltersModal}
              onFiltersChange={this.handleFiltersChange}
            />
          </Modal>
          <Modal
            open={openParams}
            onClose={this.toggleParamsModal}
            maxWidth="md"
            keepMounted={false}
            actions={<></>}
          >
            <Params
              instance={instance}
              parentParams={parentParams}
              onClose={this.toggleParamsModal}
              onParamsChange={this.handleParamsChange}
            />
          </Modal>
          <Modal
            open={openExport}
            onClose={this.toggleExportModal}
            maxWidth="xs"
            actions={<></>}
          >
            <Export
              instanceId={instance.id}
              processFilters={this.processFilters}
            />
          </Modal>
          <Modal
            open={openEmbed}
            onClose={this.toggleEmbedModal}
            actions={<></>}
          >
            <Embed instanceId={instance.id} />
          </Modal>
          <Modal
            open={openFullscreen}
            onClose={this.toggleFullscreenModal}
            fullScreen
            actions={undefined}
          >
            {this.getReport(instance.report.type)}
          </Modal>
          <Settings
            open={openSettings}
            json={options}
            onChange={this.handleOptionChange}
            onToggleOpen={this.handleToggleSettings}
          />
          <AutoRefresh
            isRunning={isRunning}
            interval={interval}
            execReport={this.execReport}
          />
          {this.getReport(instance.report.type)}
        </ReportCard>
      </Subscriber>
    );
  }
}

const WithTheme = withTheme(Report);
const WithBreakPoint = withBreakPoint(WithTheme);
export default withSnackbar(WithBreakPoint);
