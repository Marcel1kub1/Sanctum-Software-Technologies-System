const config = require('../../config');

function handleError(bot, error, context) {
  console.error(`[Error] ${context}:`, error.message);

  if (config.debug) {
    console.error(error);
  }
}

module.exports = { handleError };
