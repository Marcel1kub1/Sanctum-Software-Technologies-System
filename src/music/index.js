const MusicApiServer = require('./MusicApiServer');

function startMusicServices(bot) {
  const apiServer = new MusicApiServer(bot);
  apiServer.start();
  return apiServer;
}

module.exports = { MusicApiServer, startMusicServices };
