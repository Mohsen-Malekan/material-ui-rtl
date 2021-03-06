import { Api } from "utility";
import sortBy from "lodash/sortBy";
import has from "lodash/has";
import differenceWith from "lodash/differenceWith";
import remove from "lodash/remove";
import { MIN_W, MIN_H, TBreakPoint, TLayoutItem } from "components/Layout";
import { TDashboard, TConfig } from ".";
// import data from "./dashboards.json";

const baseUrl = `${process.env.REACT_APP_BASE_URL}`;

type Dashboard = {
  id: number;
  name: string;
  config: string;
  order: number;
  shared: boolean;
};

export class DashboardsService {
  private _dashboards: TDashboard[] = [];
  private _promise: Promise<any> = Promise.reject();
  private hasInit = false;

  public get dashboards() {
    const promise = this.hasInit ? this._promise : this.fetchDashboards();

    return promise.then(() => sortBy(this._dashboards, d => d.order));
  }

  public get(id: number) {
    return this._dashboards.find(d => d.id === id);
  }

  public async create(name: string, order: number) {
    const config = this.parseConfig("");
    return Api.post(`${baseUrl}/dashboard`, {
      name,
      order,
      config: JSON.stringify(config)
    }).then(res => {
      const newDashboard: TDashboard = {
        id: +res.data.result,
        name,
        order,
        shared: false,
        config,
        userReportIds: []
      };
      this._dashboards = [...this._dashboards, newDashboard];
      return this._dashboards;
    });
  }

  public async update(
    id: number,
    updates: { [k: string]: any },
    shared: boolean
  ) {
    const url = `${baseUrl}/dashboard/${shared ? "shared/" : ""}${id}`;
    return Api.patch(url, updates).then(() => {
      if (has(updates, "config")) {
        updates.config = JSON.parse(updates.config);
      }
      this._dashboards = this._dashboards.map(d =>
        d.id === id ? { ...d, ...updates } : d
      );
      return this._dashboards;
    });
  }

  public async updateAll(dashboards: TDashboard[]) {
    return Api.put(
      `${baseUrl}/dashboard`,
      dashboards.map(d => ({ ...d, config: JSON.stringify(d.config) }))
    ).then(() => {
      this._dashboards = dashboards;
    });
  }

  public async delete(dashboard: TDashboard) {
    const { id } = dashboard;
    const url = `${baseUrl}/dashboard/${id}`;
    return Api.delete(url).then(() => {
      this._dashboards = this._dashboards.filter(d => d.id !== id);
      this._dashboards = this.reOrder();
      return this._dashboards;
    });
  }

  public removeReport(dashboardId: number, instanceId: number): TDashboard[] {
    const dash = this.get(dashboardId);
    if (dash) {
      dash.userReportIds = dash.userReportIds.filter(id => id !== instanceId);
      const { layouts } = dash.config;
      for (const bp in layouts) {
        if (layouts.hasOwnProperty(bp)) {
          const items = layouts[bp as TBreakPoint];
          remove(items, item => +item.i === instanceId);
        }
      }
    }
    return this._dashboards;
  }

  private async fetchDashboards() {
    const url = `${baseUrl}/dashboard/allWithReport`;
    this._promise = Api.get(url)
      .then((response: any) => {
        const dashboards = response.data.result.data as Dashboard[];
        return dashboards.map((dashboard, order) => {
          const config: TConfig = this.parseConfig(dashboard.config);
          return {
            ...dashboard,
            order,
            config
          } as TDashboard;
        });
      })
      .then((dashboards: TDashboard[]) => {
        this._dashboards = dashboards.map(d =>
          this.addItems(d, d.userReportIds)
        );
        this.hasInit = true;
        return this._dashboards;
      });
    return this._promise;
  }

  public addItems(d: TDashboard, userReportIds: number[]) {
    const { layouts } = d.config;
    const diff = differenceWith(
      userReportIds,
      layouts.lg,
      (a: number, b: TLayoutItem) => a === +b.i
    );
    for (const id of diff) {
      const li = this.newItem(id);
      for (const bp in layouts) {
        if (layouts.hasOwnProperty(bp)) {
          layouts[bp as TBreakPoint].push(li[bp as TBreakPoint]);
        }
      }
    }
    return d;
  }

  private parseConfig = (configString: string): TConfig => {
    try {
      const config: TConfig = JSON.parse(configString);
      const { layouts } = config;
      for (const bp in layouts) {
        if (layouts.hasOwnProperty(bp)) {
          const items = layouts[bp as TBreakPoint];
          for (const item of items) {
            item.minW = MIN_W[bp as TBreakPoint];
            item.minH = MIN_H[bp as TBreakPoint];
          }
        }
      }
      return { ...config, layouts };
    } catch (error) {
      return {
        layouts: {
          lg: [],
          md: [],
          sm: [],
          xs: [],
          xxs: []
        },
        slide: {
          isVisible: true,
          duration: 60
        }
      };
    }
  };

  private newItem = (id: number): { [key in TBreakPoint]: TLayoutItem } => {
    return {
      lg: {
        i: id.toString(),
        x: 0,
        y: Infinity,
        w: MIN_W.lg,
        h: MIN_H.lg
      },
      md: {
        i: id.toString(),
        x: 0,
        y: Infinity,
        w: MIN_W.md,
        h: MIN_H.md
      },
      sm: {
        i: id.toString(),
        x: 0,
        y: Infinity,
        w: MIN_W.sm,
        h: MIN_H.sm
      },
      xs: {
        i: id.toString(),
        x: 0,
        y: Infinity,
        w: MIN_W.xs,
        h: MIN_H.xs
      },
      xxs: {
        i: id.toString(),
        x: 0,
        y: Infinity,
        w: MIN_W.xxs,
        h: MIN_H.xxs
      }
    };
  };

  private reOrder(): TDashboard[] {
    return this._dashboards.map((d, i) => {
      return { ...d, order: i };
    });
  }
}

const dashboardsService = new DashboardsService();
export default dashboardsService;
