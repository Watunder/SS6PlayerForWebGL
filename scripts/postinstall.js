import { execSync } from 'child_process';

const ssfblib = 'https://github.com/SpriteStudio/SS6PlayerForWeb/tree/20250621/packages/ssfblib';
const ss6playerlib = 'https://github.com/SpriteStudio/SS6PlayerForWeb/tree/20250621/packages/ss6player-lib';

const downgit = 'npx down-git --compress=0' +
    (process.env.npm_package_config_proxy ? ` --proxy=${process.env.npm_package_config_proxy}` : '') +
    (process.env.npm_package_config_token ? ` --token=${process.env.npm_package_config_token}` : '');

execSync(`cd ../libs && ${downgit} --url=${ssfblib}`, { stdio: 'inherit' });
execSync(`cd ../libs && ${downgit} --url=${ss6playerlib}`, { stdio: 'inherit' });

execSync('node diff.js');

execSync('cd ../libs/ssfblib && npm install --ignore-scripts');
execSync('cd ../libs/ss6player-lib && npm install --ignore-scripts');

execSync('cd ../libs/ssfblib && npm run build', { stdio: 'inherit' });
execSync('cd ../libs/ss6player-lib && npm run build', { stdio: 'inherit' });
