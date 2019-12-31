import { Api } from "utility";
import get from "lodash/get";
import keyBy from "lodash/keyBy";
import {
  TReportInstance,
  TReportData,
  TReportExecParams,
  TReportConfig,
  TReportParams
} from ".";
import processElastic from "./elastic";

const baseUrl = `${process.env.REACT_APP_BASE_URL}`;

export const DefaultConfig: TReportConfig = {
  theme: "default",
  icon: "info",
  options: {
    light: { lg: {}, md: {}, sm: {}, xs: {}, xxs: {} },
    dark: { lg: {}, md: {}, sm: {}, xs: {}, xxs: {} }
  }
};

const DefaultConfigString = JSON.stringify(DefaultConfig);

export class ReportService {
  private _instances: { [id: number]: TReportInstance } = {};
  private hasInit = false;
  private filterOptions: TReportData = { cols: [], rows: [], totalCount: 0 };
  private filterOptionsId: number = 0;

  public get Instances() {
    return this.hasInit
      ? Promise.resolve(this._instances)
      : this.fetchInstances();
  }

  public get DefaultConfig() {
    return DefaultConfig;
  }

  public get(instanceId: number) {
    return this._instances[instanceId];
  }

  public async delete(instanceId: number) {
    const url = `${baseUrl}/userreport/${instanceId}`;
    return Api.delete(url);
  }

  public async update(id: number) {
    const instance = this._instances[id];
    const url = `${baseUrl}/userreport/${instance.id}`;
    const { name = instance.report.name, config } = instance;
    return Api.put(url, { name, config: JSON.stringify(config) });
  }

  public async create(
    dashboardId: number,
    reportId: number,
    reportParams: TReportParams,
    drillDownId: number
  ) {
    const { name, params = [], drillDownParams = [] } = reportParams;
    const _baseurl = `${baseUrl}/report`;
    const url = `${_baseurl}/${reportId}/param?dashboardId=${dashboardId}&name=${name}`;
    const instanceId = await Api.post(url, params).then(res => res.data.result);
    await this.fetchInstance(instanceId);
    if (drillDownId > -1) {
      const drillDownUrl = `${_baseurl}/${drillDownId}/userreport/${instanceId}/param`;
      const _drillDownId = await Api.post(drillDownUrl, drillDownParams).then(
        res => res.data.result
      );
      this._instances[instanceId].drillDownId = _drillDownId;
      await this.fetchInstance(_drillDownId);
    }
    return Promise.resolve(instanceId);
  }

  public async execute(instanceId: number, params?: TReportExecParams) {
    const url = `${baseUrl}/userreport/${instanceId}/exec`;

    const {
      filterVOS,
      parentParams,
      orderByElementVOS,
      loadFromCache,
      page,
      size,
      totalCount
    } = this.getReportExecParams(params);

    return Api.post(
      url,
      {
        filterVOS,
        parentParams,
        orderByElementVOS
      },
      {
        loadFromCache,
        page,
        size
      }
    )
      .then(response => response.data.result)
      .then(data => {
        const instance = this._instances[instanceId];
        const dataSource = get(instance, "report.query.dataSource.type", "SQL");
        if (dataSource === "ELASTICSEARCH") {
          return processElastic(
            JSON.parse(data.rawData),
            instance.report.query.metadata
          );
        }
        return data;
      })
      .then(data => ({
        ...data,
        totalCount: page > 0 ? totalCount : get(data, "totalCount", 0)
      }));
  }

  public async getFilterOptions(instanceId: number, filterId: number) {
    const fetch = async () => {
      const url = `${baseUrl}/userreport/${instanceId}/getFilterOptions?filterId=${filterId}`;
      return Api.post(url, null).then(res => {
        this.filterOptionsId = instanceId;
        this.filterOptions = res.data.result;
        return this.filterOptions;
      });
    };

    if (instanceId === this.filterOptionsId) {
      return Promise.resolve(this.filterOptions);
    }
    return fetch();
  }

  public async export(
    instanceId: number,
    format: "XLSX" | "CSV",
    params?: TReportExecParams
  ) {
    const api = format === "CSV" ? "getCSV" : "getXLS";
    const url = `${baseUrl}/userreport/${instanceId}/${api}`;
    const {
      filterVOS,
      parentParams,
      orderByElementVOS
    } = this.getReportExecParams(params);
    return Api.post(url, { filterVOS, parentParams, orderByElementVOS }).then(
      res => res.data
    );
  }

  public async fetchEmbedHash(instanceId: number): Promise<string> {
    const url = `${baseUrl}/userreport/${instanceId}/hash`;
    return Api.get(url).then(res => res.data.result as string);
  }

  private async fetchInstances() {
    const url = `${baseUrl}/userreport`;
    const response = await Api.get(url);
    const instances = response.data.result.data.map((ins: any) => ({
      ...ins,
      config: this.parseConfig(ins.config)
    }));
    this._instances = keyBy(instances, "id");
    this.hasInit = true;
    return this._instances;
  }

  private async fetchInstance(id: number) {
    const url = `${baseUrl}/userreport/${id}`;
    const instance = await Api.get(url)
      .then(res => res.data.result)
      .then(ins => {
        return {
          ...ins,
          config: this.parseConfig(ins.config || "")
        };
      });
    this._instances = { ...this._instances, [id]: instance };
  }

  private parseConfig(config: string) {
    try {
      return JSON.parse(config || DefaultConfigString);
    } catch (error) {
      return { ...DefaultConfig };
    }
  }

  private getReportExecParams(params?: TReportExecParams) {
    const filterVOS = get(params, "filterVOS", []);
    const parentParams = get(params, "parentParams", []);
    const orderByElementVOS = get(params, "orderByElementVOS", []);

    const loadFromCache = get(params, "loadFromCache", true);
    const page = get(params, "page", 0);
    const size = get(params, "size", 0);
    const totalCount = get(params, "totalCount", 0);

    return {
      filterVOS,
      parentParams,
      orderByElementVOS,
      loadFromCache,
      page,
      size,
      totalCount
    };
  }
}

const reportService = new ReportService();
export default reportService;
