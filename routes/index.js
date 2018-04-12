module.exports = function(app) {
    app.use("/wx", require("./wechat.js"));
    app.use("/api/game", require("./game.js"));
    app.use("/api/user", require("./user.js"));
    // app.use("/api/loginInfos", require("./loginInfo.js"));
    // app.use("/api/roles", require("./role.js"));
};