# fittime 官网改版

> 目录结构
   * build 构建的代码
   * config 配置文件
   * dist 构建生成的目标代码
   * node_modules 项目依赖的第三方模块
   * src 源码，每个页面一个文件夹（模版template，样式style，脚本script，资源assets，main.jade，main.js,main.scss为各自入口）
   * static 其他静态资源  
   * .babelrc babel配置文件
   * .editorconfig 编辑器配置文件
   * .gitignore git配置文件
   * postcss.config.js postcss配置文件
   * package.json 项目描述文件
   * README.md 项目说明文件
   
> 所用技术
   * jade 模版引擎
   * sass postcss css预处理 后处理
   * jquery dom操作
   * babel es6转译
   * webpack 基于webpack进行了二次的封装，config下为自己的配置文件
 
## 使用方式

``` bash
# 安装依赖
npm install

# 启动热替换的开发服务器 在localhost:9999
npm run dev

# 构建生成生产环境中用的目标代码
npm run build

```
