const ms = require('ms');

function parseDuration(str) {
  if (!str) return null;
  try {
    const result = ms(str);
    return typeof result === 'number' && !isNaN(result) && result > 0 ? result : null;
  } catch (e) {
    return null;
  }
}

function formatDuration(millis) {
  if (!millis || millis <= 0) return '0 seconds';
  
  const seconds = Math.floor((millis / 1000) % 60);
  const minutes = Math.floor((millis / (1000 * 60)) % 60);
  const hours = Math.floor((millis / (1000 * 60 * 60)) % 24);
  const days = Math.floor(millis / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  if (seconds > 0 && days === 0 && hours === 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);

  return parts.length > 0 ? parts.join(', ') : 'less than a second';
}

module.exports = {
  parseDuration,
  formatDuration
};
