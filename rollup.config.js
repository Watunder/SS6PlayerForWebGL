import { defineConfig } from 'rollup';
import replace from '@rollup/plugin-replace';

export default defineConfig({
    input: './src/main.js',
    plugins: [
        replace({
            delimiters: ['', ''],
            values: {
                'from "../libs/ss6player-lib/dist/types/ss6player-lib.js";': 'from "../libs/ss6player-lib/dist/ss6player-lib.es6.js";'
            },
            preventAssignment: true
        })
    ],
    output: {
        format: 'esm',
        file: './dist/ss6player.js'
    }
});
