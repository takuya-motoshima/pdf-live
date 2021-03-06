import typescript from 'rollup-plugin-typescript2';
import {terser} from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import pkg from './package.json';
import copy from 'rollup-plugin-copy'
import path from 'path';
import json from '@rollup/plugin-json';

// Determine whether it is a production environment
const isPro = () => {
  return process.env.NODE_ENV === 'production';
}

export default {
  // external: Object.keys(pkg['dependencies'] || []),
  input: './src/index.ts',
  plugins: [
    typescript({
      tsconfigDefaults: {compilerOptions: {}},
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {compilerOptions: {}},
      useTsconfigDeclarationDir: true
    }),
    isPro() && terser(),
    json(),
    commonjs(),
    resolve({
      mainFields: ['module', 'main']
    }),
    postcss({
      include: 'src/index.css',
      extract: path.resolve(`dist/${pkg.name}.css`),
      minimize: true
    }),
    copy({
      targets: [
        {src: 'src/favicon.svg', dest: 'dist'},
        {src: 'node_modules/pdfjs-dist/build/pdf.worker.min.js', dest: 'dist', rename: (_, extension) => `pdf.worker.${extension}`},
        {src: 'node_modules/pdfjs-dist/cmaps/**/*', dest: 'dist/cmaps'},
      ]
    })
  ],
  output: [
    // ES module (for bundlers) build.
    {
      format: 'esm',
      file: pkg.module
    },
    // CommonJS (for Node) build.
    {
      format: 'cjs',
      file: pkg.main
    },
    // browser-friendly UMD build
    {
      format: 'umd',
      file: pkg.browser,
      name: pkg.name
        .replace(/^.*\/|\.js$/g, '')
        .replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''))
    }
  ],
  watch: {
    exclude: 'node_modules/**',
    include: 'src/**'
  }
}