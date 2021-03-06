/* eslint react-hooks/exhaustive-deps: 0 */
import React, { useState, useEffect } from "react";
import findIndex from "lodash/findIndex";
import get from "lodash/get";
import { useHistory } from "react-router-dom";
import { useTheme } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import { Fab } from "components/Button";
import { useDashboards, TDashboard } from ".";

let intervalId = 0;

const Timer = () => {
  const theme = useTheme();
  const [paused, setPaused] = useState(true);
  const [value, setValue] = useState(0);
  const [state] = useDashboards();
  const history = useHistory();
  const [isVisible, setVisibility] = useState(false);
  const [dashboard, setDashboard] = useState<TDashboard | undefined>(undefined);

  const clearInterval = (_intervalId: number | undefined) => {
    setValue(0);
    intervalId = 0;
    window.clearInterval(_intervalId);
  };

  useEffect(() => {
    const id = window.location.pathname.split("/").pop() || 0;
    setDashboard(state.dashboards.find(d => d.id === +id));
  }, [state.dashboards, window.location.pathname]);

  useEffect(() => {
    if (!!dashboard && get(dashboard, "config.slide.isVisible", false)) {
      !paused ? startCounter() : clearInterval(intervalId);
      let visibles = 0;
      for (const d of state.dashboards) {
        visibles += get(d, "config.slide.isVisible", false) ? 1 : 0;
      }
      setValue(0);
      setVisibility(
        RegExp(/user\/dashboard\/\d+$/).test(window.location.pathname) &&
          visibles > 1
      );
    } else {
      setPaused(true);
      setVisibility(false);
    }

    return stopCounter;
  }, [dashboard]);

  useEffect(() => {
    !paused ? startCounter() : clearInterval(intervalId);

    return stopCounter;
  }, [paused]);

  useEffect(() => {
    if (value >= 100) {
      handleNextClick();
    }
  }, [value]);

  const startCounter = () => {
    intervalId = window.setInterval(() => {
      if (!!dashboard) {
        const duration = get(dashboard.config, "slide.duration", 60);
        setValue(value => value + 100 / duration);
      }
    }, 1000);
  };

  const stopCounter = () => {
    clearInterval(intervalId);
  };

  const handleStartClick = () => {
    setPaused(!paused);
  };

  const handleNextClick = () => {
    const length = state.dashboards.length;
    const id = window.location.pathname.split("/").pop() || 0;
    const index = findIndex(state.dashboards, { id: +id });
    for (let i = (index + 1) % length; i !== index; i = (i + 1) % length) {
      const dashboard = state.dashboards[i];
      const isVisible = get(dashboard.config, "slide.isVisible", false);
      if (isVisible) {
        history.push(`/user/dashboard/${dashboard.id}`, {
          title: dashboard.name
        });
        return;
      }
    }
  };

  const handlePrevClick = () => {
    function getNext(i: number) {
      return i === 0 ? length - 1 : i - 1;
    }
    const length = state.dashboards.length;
    const id = window.location.pathname.split("/").pop() || 0;
    const index = findIndex(state.dashboards, { id: +id });
    for (let i = (index + length - 1) % length; i !== index; i = getNext(i)) {
      const dashboard = state.dashboards[i];
      const isVisible = get(dashboard.config, "slide.isVisible", false);
      if (isVisible) {
        history.push(`/user/dashboard/${dashboard.id}`, {
          title: dashboard.name
        });
        return;
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{ display: "contents" }}>
      <IconButton size="small" onClick={handleNextClick}>
        {theme.direction === "rtl" ? (
          <SkipNextIcon fontSize="small" />
        ) : (
          <SkipPreviousIcon fontSize="small" />
        )}
      </IconButton>
      <Fab
        color="primary"
        size="small"
        loading
        title={paused ? "شروع" : "توقف"}
        progress={{
          variant: "static",
          value,
          size: 48,
          thickness: 2,
          style: {
            position: "absolute",
            top: -4,
            left: -4,
            zIndex: -1,
            color: "blueviolet"
          }
        }}
        onClick={handleStartClick}
      >
        {paused ? (
          <PlayArrowIcon fontSize="large" />
        ) : (
          <PauseIcon fontSize="large" />
        )}
      </Fab>
      <IconButton size="small" onClick={handlePrevClick}>
        {theme.direction === "rtl" ? (
          <SkipPreviousIcon fontSize="small" />
        ) : (
          <SkipNextIcon fontSize="small" />
        )}
      </IconButton>
    </div>
  );
};

export default Timer;
