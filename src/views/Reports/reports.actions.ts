import { Store } from "use-global-hook";
import { TReport } from "components/Report";
import { TDashboard } from "components/Dashboard";
import { TView, TOrderBy, TOrderDir } from "components/ToolBox";
import { ReportsService as Reports, TReports, TActions } from ".";
import { errorHandler } from "utility";

export const REPORTS_CONFIG = "DU_RC";

function saveSettings(state: TReports) {
  const { view = "grid", orderBy = "created", orderDir = "desc" } = state;
  localStorage.setItem(
    REPORTS_CONFIG,
    JSON.stringify({ view, orderBy, orderDir })
  );
}

export function get(store: Store<TReports, TActions>, bypassCache?: boolean) {
  store.setState({ ...store.state, loading: true, error: false });
  const { q, orderBy, orderDir, page, pageSize } = store.state;
  Reports.get(q, orderBy, orderDir, page, pageSize, bypassCache)
    .then(reports => {
      store.setState({
        ...store.state,
        reports,
        count: Reports.count,
        loading: false
      });
    })
    .catch(errorHandler<TReports, TActions>(store));
}

export function update(store: Store<TReports, TActions>) {
  store.setState({ ...store.state, loading: true, error: false });
  const { q, orderBy, orderDir, page, pageSize } = store.state;
  const reports = Reports.update(q, orderBy, orderDir, page, pageSize);
  store.setState({
    ...store.state,
    reports,
    loading: false
  });
}

export function changeSearch(store: Store<TReports, TActions>, q: string) {
  store.setState({ ...store.state, q });
}

export function changeView(store: Store<TReports, TActions>, view: TView) {
  saveSettings({ ...store.state, view });
  store.setState({ ...store.state, view });
}

export function changeOrder(
  store: Store<TReports, TActions>,
  orderBy: TOrderBy,
  orderDir: TOrderDir
) {
  saveSettings({ ...store.state, orderBy, orderDir });
  store.setState({ ...store.state, orderBy, orderDir });
}

export function changePagination(
  store: Store<TReports, TActions>,
  page: number,
  pageSize: number
) {
  store.setState({ ...store.state, page, pageSize });
}

export function openParamsModal(
  store: Store<TReports, TActions>,
  report: TReport,
  dashboard: TDashboard
) {
  store.setState({
    ...store.state,
    selectedReport: report,
    selectedDashboard: dashboard,
    showParams: true
  });
}

export function closeParamsModal(store: Store<TReports, TActions>) {
  store.setState({
    ...store.state,
    selectedReport: undefined,
    selectedDashboard: undefined,
    showParams: false
  });
}
