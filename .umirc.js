/*
 * @Description: 
 * @Version: 
 * @Author: linjinzhi
 * @Date: 2020-08-06 11:05:40
 * @LastEditors: linjinzhi
 * @LastEditTime: 2020-08-06 12:19:28
 */
const env = process.env.NODE_ENV;
const base = env === 'development'?'/':'/live2d-dc.github.io/';
const publicPath = env === 'development'?'/':'/live2d-dc.github.io/';
const path = env === 'development'?'':'/live2d-dc.github.io/';
// ref: https://umijs.org/config/
export default {
  history: 'hash',
  hash: true,
  treeShaking: true,
  base: base,
  publicPath: publicPath,
  routes: [
    {
      path: '/',
      component: '../layouts/index',
      routes: [
        { path: '/:model', component: '../pages/index' }
      ]
    }
  ],
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    ['umi-plugin-react', {
      antd: false,
      dva: false,
      dynamicImport: false,
      title: 'live2d-dc',
      dll: false,
      
      routes: {
        exclude: [
          /components\//,
        ],
      },
    }],
    'umi-plugin-gh-pages'
  ],
  define: {
    PATH: path,
  }
}
