process.env.__CDS_RL_DEV_JEST_TEST__ == undefined
  ? require("./lib")
  : require("./src");
