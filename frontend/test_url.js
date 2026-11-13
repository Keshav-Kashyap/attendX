const { UrlCreator } = require('expo/node_modules/@expo/cli/build/src/start/server/UrlCreator');

try {
  // Let's see what UrlCreator does
  const uc = new UrlCreator({ port: 8081 });
  const url = uc.constructUrl({ scheme: 'http', hostType: 'localhost' });
  console.log('Constructed URL:', url);
  console.log('new URL(url):', new URL(url).href);
} catch (e) {
  console.error('Error:', e.message);
  console.error(e.stack);
}
