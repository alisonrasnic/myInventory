import { defineConfig } from '@rspack/cli';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  devServer: {
    static: 'dist',
    historyApiFallback: true,
    port: 9090,
  },
  output: {
    publicPath: '/',
  },
  entry: {
    main: './src/index.js',
  },
  resolve: {
    alias: {
      buffer: require.resolve('buffer/'),
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(process.cwd(), './node_modules/react-dom')
    }
  },
  module: {
    defaultRules: [
      '...',
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript', // Use 'typescript' if using TS
                jsx: true,
              },
              transform: {
                react: {
                  // 'automatic' tells SWC to auto-import the React runtime
                  runtime: 'automatic', 
                  // When true, this injects the development runtime 
                  // (which adds source maps and better error tracking for React)
                  development: isDev, 
                },
              },
            },
          },
          type: 'javascript/auto',
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('@tailwindcss/postcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
          ],
          type: 'css',
      },
    ],
  },
});
