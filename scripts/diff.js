import fs from "fs";
import { applyPatches } from 'diff';

const patch = `
--- ../libs/ss6player-lib/package.json
+++ ../libs/ss6player-lib/package.json
@@ -1,6 +1,6 @@
 {
   "name": "ss6player-lib",
-  "version": "1.0.4",
+  "version": "1.0.4-rc.1",
   "description": "generate an animation framedata from ssfblib for ss6players",
   "keywords": [
     "SpriteStudio"
@@ -36,9 +36,10 @@
     "docs": "typedoc --out ../../docs/ss6player_lib_api src/ss6player-lib.ts"
   },
   "dependencies": {
-    "ssfblib": "1.2.4"
+    "ssfblib": "file:../ssfblib"
   },
   "devDependencies": {
+    "tslib": "^2.8.1",
     "typescript": "^5.8.3",
     "typedoc": "^0.28.5",
     "flatbuffers": "^25.2.10",

--- ../libs/ss6player-lib/rollup.config.ts
+++ ../libs/ss6player-lib/rollup.config.ts
@@ -1,12 +1,14 @@
 import resolve from '@rollup/plugin-node-resolve';
 import commonjs from '@rollup/plugin-commonjs';
 import camelCase from 'lodash.camelcase';
-import esbuild from 'rollup-plugin-esbuild';
+import esbuild, { Options } from 'rollup-plugin-esbuild';
 import json from '@rollup/plugin-json';
 import license from 'rollup-plugin-license';
 
+// @ts-ignore
 const production = !process.env.ROLLUP_WATCH;
 
+// @ts-ignore
 const pkg = require('./package.json');
 
 const libraryName = 'ss6player-lib';
@@ -36,7 +38,7 @@ export default {
     json(),
     // Compile TypeScript files
     // typescript({ useTsconfigDeclarationDir: true }),
-    esbuild.default({sourceMap: !production}),
+    (esbuild as any).default({ sourceMap: !production } as Options),
     // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
     commonjs(),
     // Allow node_modules resolution, so you can use 'external' to control

--- ../libs/ss6player-lib/tsconfig.json
+++ ../libs/ss6player-lib/tsconfig.json
@@ -1,5 +1,5 @@
 {
-  "extends": "../../tsconfig.json",
+  "extends": "../tsconfig.json",
   "compilerOptions": {
     "declaration": true,
     "declarationDir": "dist/types",

--- ../libs/ssfblib/package.json
+++ ../libs/ssfblib/package.json
@@ -35,6 +35,7 @@
     "flatbuffers": "^25.2.10"
   },
   "devDependencies": {
+    "tslib": "^2.8.1",
     "typescript": "^5.8.3",
     "typedoc": "^0.28.5",
     "lodash.camelcase": "^4.3.0",

--- ../libs/ssfblib/rollup.config.ts
+++ ../libs/ssfblib/rollup.config.ts
@@ -1,12 +1,14 @@
 import resolve from '@rollup/plugin-node-resolve';
 import commonjs from '@rollup/plugin-commonjs';
 import camelCase from 'lodash.camelcase';
-import esbuild from 'rollup-plugin-esbuild';
+import esbuild, { Options } from 'rollup-plugin-esbuild';
 import json from '@rollup/plugin-json';
 import license from 'rollup-plugin-license';
 
+// @ts-ignore
 const production = !process.env.ROLLUP_WATCH;
 
+// @ts-ignore
 const pkg = require('./package.json');
 
 const libraryName = 'ssfblib';
@@ -36,7 +38,7 @@ export default {
     json(),
     // Compile TypeScript files
     // typescript({ useTsconfigDeclarationDir: true }),
-    esbuild.default({sourceMap: !production}),
+    (esbuild as any).default({ sourceMap: !production } as Options),
     // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
     commonjs(),
     // Allow node_modules resolution, so you can use 'external' to control

--- ../libs/ssfblib/tsconfig.json
+++ ../libs/ssfblib/tsconfig.json
@@ -1,11 +1,11 @@
 {
-  "extends": "../../tsconfig.json",
+  "extends": "../tsconfig.json",
   "compilerOptions": {
     "declaration": true,
     "declarationDir": "dist/types",
     "outDir": "dist/lib",
     "typeRoots": [
-      "../../node_modules/flatbuffers/js"
+      "node_modules/flatbuffers/js"
     ]
   },
   "include": [`;

applyPatches(patch, {
    loadFile: (patch, callback) => {
        let fileContents;
        try {
            fileContents = fs.readFileSync(patch.oldFileName).toString();
        } catch (e) {
            callback(`No such file: ${patch.oldFileName}`);
            return;
        }
        callback(undefined, fileContents);
    },
    patched: (patch, patchedContent, callback) => {
        if (patchedContent === false) {
            callback(`Failed to apply patch to ${patch.oldFileName}`)
            return;
        }
        fs.writeFileSync(patch.oldFileName, patchedContent);
        callback();
    },
    complete: (err) => {
        if (err) {
            console.log("Failed with error:", err);
        }
    }
});
