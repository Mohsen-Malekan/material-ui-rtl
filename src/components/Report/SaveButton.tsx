import React, { useState } from "react";
import { useSnackbar } from "notistack";
import { useTheme, Theme } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";
import SaveIcon from "@material-ui/icons/Save";
import { ReportService } from "components/Report";
import { displayErrMsg } from "utility";

type propsType = {
  instanceId: number;
};

const SaveButton = (props: propsType) => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const theme: Theme = useTheme();
  const { instanceId } = props;

  const style: React.CSSProperties = {
    position: "absolute",
    [theme.direction === "rtl" ? "left" : "right"]: 8
  };

  const handleSaveClick = () => {
    setLoading(true);
    ReportService.update(instanceId)
      .catch(displayErrMsg(enqueueSnackbar))
      .finally(() => setLoading(false));
  };

  return (
    <IconButton
      onClick={handleSaveClick}
      style={style}
      title="ذخیره تنظیمات"
      disabled={loading}
    >
      <SaveIcon color="primary" />
      {loading && (
        <CircularProgress
          color="secondary"
          size={36}
          style={{
            position: "absolute"
          }}
        />
      )}
    </IconButton>
  );
};

export default SaveButton;
