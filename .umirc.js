
// ref: https://umijs.org/config/
export default {
  history: 'hash',
  hash: true,
  treeShaking: true,
  publicPath: '/',
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
  ],
}
