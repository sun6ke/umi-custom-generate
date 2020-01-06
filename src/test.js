import { join, dirname, resolve } from 'path';
import * as fs from 'fs';
// let path = require("path");
// let fs = require("fs");
import { getNewRouteCode, isString } from './utils/utlis.js';
let content = fs.readFileSync(resolve('./template', 'index.tmp'), 'utf8');

let data = {
  className: 'Test',
  formList: [
    {
      type: 'INPUT',
      label: '计划编号',
      field: 'pbId',
      placeholder: '请输入',
    }, {
      type: 'MULSELECT',
      label: '发单地',
      field: 'billCityIdList',
      placeholder: '请选择/输入（多选）',
    }, {
      type: 'MULSELECT',
      label: '呈现方式(媒体类型)',
      longLabel: true,
      field: 'productTypeList',
      placeholder: '请选择（多选）',
    }, {
      type: 'MULSELECT',
      label: '发布状态',
      field: 'publishStatusList',
      placeholder: '请选择（多选）',
    }, {
      type: 'INPUT',
      label: '计划名称',
      field: 'pbContent',
      placeholder: '计划名称',
    }, {
      type: 'INPUT',
      label: '客户名称',
      field: 'customerName',
      placeholder: '客户名称',
    }, {
      type: 'INPUT',
      label: '销售人员',
      field: 'saleName',
      placeholder: '请输入关键字',
    }
  ]
}
let reg = /\$\$\{(\w+)\}/g

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

// let newContent = content.replace(matchStr[0], JSON.stringify(data[variableArrey[0]]))
let basePath = 'D:/project/FW_FCS_SALE_Client';
let srcPath = join(basePath, 'src/pages');
if (!fs.existsSync(resolve(srcPath, `${data.className}`))) {
  fs.mkdirSync(resolve(srcPath, `${data.className}`))
}
fs.writeFileSync(resolve(srcPath, `${data.className}`, 'index.js'), content, 'utf-8')

let configPath = 'D:/project/FW_FCS_SALE_Client/config/config.js';
let routeConfigPath = 'D:/project/FW_FCS_SALE_Client/config/router.config.js';

const routesPath = getNewRouteCode(
  configPath,
  { name: 'test', path: '/fcs/test', icon: 'smile', component: './test' },
  '.',
);

//写入router.config.js
fs.writeFileSync(routeConfigPath, routesPath.code, 'utf-8')
