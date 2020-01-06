// ref:
// - https://umijs.org/plugin/develop.html

import * as fs from "fs";
import { homedir } from 'os';
import { join, dirname, resolve } from 'path';
import {getNewRouteCode, isString, writeMenuLocales, toLine} from "./utils/utlis";

const modifyTemplate = (content, data) => {
  let reg = /\$\$\{(\w+)\}/g;

  let matchStr = content.match(reg);
  let variableArrey = content.match(reg).map(item => item.replace(reg,'$1'))
  variableArrey.forEach((key, index) => {
    let c_value = data[variableArrey[index]];
    if (isString(c_value)) {
      content = content.replace(matchStr[index], c_value)
    } else {
      content = content.replace(matchStr[index], JSON.stringify(c_value))
    }
  })

  return content
}

export default function (api, options) {

  // Example: output the webpack config
  api.chainWebpackConfig(config => {
    // console.log(config.toString());
  });

  api.addUIPlugin(require.resolve('../dist/index.umd'));

  api.onUISocket(({ action, failure, success }) => {
    if (action.type === 'org..umi-pro.products') {
      //读取所有项目
      let dbPath = join(homedir(), `.umi/ui/data.json`);
      let projects = [];
      if (fs.existsSync(dbPath)) {
        try {
          let projectObj = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

          let projectsByKey = projectObj['projectsByKey'];
          for(let key in projectsByKey) {
            projects.push(projectsByKey[key])
          }
        } catch (e) {
          projects = []
        }
      } else {
        projects = []
      }

      success({
        data: projects
      });
      return false;
    }

    if (action.type === 'org..umi-pro.generate') {
      // success({
      //   data: 'umi-pro.test',
      // });

      try {
        let data = action.payload;
        let basePath = data.project;
        let configPath = data.project + '/config/config.js';

        let srcPath = join(basePath, 'src/pages');

        //===================== 替换模板文件  ============================
        if (!fs.existsSync(resolve(srcPath, `${data.className}`))) {
          fs.mkdirSync(resolve(srcPath, `${data.className}`))
        }

        //读取目录
        let files = fs.readdirSync(resolve( './src', 'template'));
        files.forEach(file => {
          //读取文件
          let content = fs.readFileSync(resolve('./src', 'template', file), 'utf8');
          //处理文件
          content = modifyTemplate(content, data);
          //写入文件
          let writeFileName = file.split('.')[0];
          fs.writeFileSync(resolve(srcPath, `${data.className}`, `${writeFileName}.js`), content, 'utf-8');
        })


        //===================== 修改config/route  ============================
        let menuName = toLine(data.namespace);
        const { code, routesPath } = getNewRouteCode(
          configPath,
          { name: menuName, icon: 'smile', path: `/fcs/${menuName}`, component: `./${data.className}` },
          '.',
        );

        //写入router.config.js
        fs.writeFileSync(routesPath, code, 'utf-8');

        //写入menu.js
        let menuPath = join(basePath, 'src/locales/zh-CN/menu.js');
        writeMenuLocales(menuPath, { [`menu.${menuName}`]: data.pageTitle });

        success({
          data: 'success'
        })
      } catch (e) {
        console.log(e)
        failure({
          error: '失败'
        })
      }
    }
  });

}
