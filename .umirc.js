/*
 * @Description: 
 * @Version: 
 * @Author: linjinzhi
 * @Date: 2020-08-06 11:05:40
 * @LastEditors: linjinzhi
 * @LastEditTime: 2020-08-06 11:08:23
 */

// ref: https://umijs.org/config/
export default {
  treeShaking: true,
  base: '/live2d-dc.github.io/',
  publicPath: '/live2d-dc.github.io/',
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
}
