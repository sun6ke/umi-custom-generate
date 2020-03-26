import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from '@babel/generator';
import * as t from '@babel/types';
import slash from 'slash2';
import prettier from 'prettier';


/**
 * 替换menu.js
 */
export function writeMenuLocales(menuPath, newLocal) {
  const ast = parser.parse(readFileSync(menuPath, 'utf-8'), {
    sourceType: 'module',
    plugins: ['typescript']
  });

  let menuNode = {};
  traverse(ast, {

    ExportDefaultDeclaration({ node }) {
      // export default []
      const { declaration } = node;
      if (t.isObjectExpression(declaration)) {
        menuNode = declaration;
      }
    }
  });

  if (menuNode) {
    const { properties } = getNewRouteNode(newLocal);

    let keys = menuNode.properties.map(property => property.key.value);
    properties.forEach(property => {
      let index = keys.indexOf(property.key.value);
      if (index === -1) {
        menuNode.properties.push(property)
      } else {
        menuNode.properties.splice(index, 1, property)
      }
    })
  }

  const code = generateCode(ast);

  writeFileSync(menuPath, code, 'utf-8')
}


/**
 * 获取目标
 * @param {*} configPath
 * @param {*} newRoute
 */
export function getNewRouteCode(configPath, newRoute, absSrcPath) {
  const ast = parser.parse(readFileSync(configPath, 'utf-8'), {
    sourceType: 'module',
    plugins: ['typescript'],
  });
  let routesNode = null;
  const importModules = [];
  // 查询当前配置文件是否导出 routes 属性
  traverse(ast, {
    Program({ node }) {
      // find import
      const { body } = node;
      body.forEach(item => {
        if (t.isImportDeclaration(item)) {
          const { specifiers } = item;
          const defaultEpecifier = specifiers.find(s => {
            return t.isImportDefaultSpecifier(s) && t.isIdentifier(s.local);
          });
          if (defaultEpecifier && t.isStringLiteral(item.source)) {
            importModules.push({
              identifierName: defaultEpecifier.local.name,
              modulePath: item.source.value,
            });
          }
        }
      });
    },
    AssignmentExpression({ node }) {
      // for exports.routes
      const { left, operator, right } = node;
      if (
        operator === '=' &&
        t.isMemberExpression(left) &&
        t.isIdentifier(left.object) &&
        left.object.name === 'exports' &&
        t.isIdentifier(left.property) &&
        left.property.name === 'routes'
      ) {
        routesNode = right;
      }
    },
    ExportDefaultDeclaration({ node }) {
      // export default []
      const { declaration } = node;
      if (t.isArrayExpression(declaration)) {
        routesNode = declaration;
      }
    },
    ObjectExpression({ node, parent }) {
      // find routes on object, like { routes: [] }
      if (t.isArrayExpression(parent)) {
        // children routes
        return;
      }
      const { properties } = node;
      properties.forEach(p => {
        const { key, value } = p;
        if (t.isObjectProperty(p) && t.isIdentifier(key) && key.name === 'routes') {
          routesNode = value;
        }
      });
    },
  });

  if (routesNode) {
    // routes 配置不在当前文件, 需要 load 对应的文件  export default { routes: pageRoutes } case 1
    if (!t.isArrayExpression(routesNode)) {
      const source = importModules.find(m => {
        return m.identifierName === routesNode.name;
      });
      if (source) {
        const newConfigPath = getModulePath(configPath, source.modulePath, absSrcPath);
        return getNewRouteCode(newConfigPath, newRoute, absSrcPath);
      } else {
        throw new Error(`can not find import of ${routesNode.name}`);
      }
    } else {
      // 配置在当前文件 // export default { routes: [] } case 2
      writeRouteNode(routesNode, newRoute);
    }
  } else {
    throw new Error('route array config not found.');
  }
  const code = generateCode(ast);
  return { code, routesPath: configPath };
}

/**
 * 写入节点
 * @param {*} node 找到的节点
 * @param {*} newRoute 新的路由配置
 */
export function writeRouteNode(targetNode, newRoute, currentPath = '/') {
  console.log(`writeRouteNode currentPath newRoute.path: ${newRoute.path} currentPath: ${currentPath}`);
  const { elements } = targetNode;
  const paths = elements.map(ele => {
    if (!t.isObjectExpression(ele)) {
      return false;
    }
    const { properties } = ele;
    const redirect = properties.find(p => {
      return p.key.name === 'redirect';
    });
    if (redirect) {
      return false;
    }
    const pathProp = properties.find(p => {
      return p.key.name === 'path';
    });
    if (!pathProp) {
      return currentPath;
    }
    let fullPath = pathProp.value.value;
    if (fullPath.indexOf('/') !== 0) {
      fullPath = join(currentPath, fullPath);
    }
    return fullPath;
  });

  const matchedIndex = paths.findIndex(p => {
    return p && newRoute.path.indexOf(winPath(p)) === 0;
  });

  const newNode = getNewRouteNode(newRoute);
  if (matchedIndex === -1) {
    elements.push(newNode);
    // return container for test
    return targetNode;
  } else {
    // matched, insert to children routes
    const matchedEle = elements[matchedIndex];
    const routesProp = matchedEle.properties.find(p => {
      return (
        p.key.name === 'routes' || (process.env.BIGFISH_COMPAT && p.key.name === 'childRoutes')
      );
    });
    if (!routesProp) {
      // not find children routes, insert before the matched element
      elements.splice(matchedIndex, 0, newNode);
      return targetNode;
    }
    return writeRouteNode(routesProp.value, newRoute, paths[matchedIndex]);
  }
}
function getNewRouteNode(newRoute) {
  return parser.parse(`(${JSON.stringify(newRoute)})`).program.body[0].expression;
}
function winPath(path) {
  return slash(path)
}

/**
 * 获取路由配置的真实路径
 * @param {*} modulePath
 */
function getModulePath(configPath, modulePath, absSrcPath) {
  // like @/route.config
  if (/^@\//.test(modulePath)) {
    modulePath = join(absSrcPath, modulePath.replace(/^@\//, ''));
  } else {
    modulePath = join(dirname(configPath), modulePath);
  }
  if (!/\.[j|t]s$/.test(modulePath)) {
    if (existsSync(`${modulePath}.js`)) {
      modulePath = `${modulePath}.js`;
    } else {
      modulePath = `${modulePath}.ts`;
    }
  }
  return modulePath;
}

/**
 * 生成代码
 * @param {*} ast
 */
function generateCode(ast) {
  const newCode = generate(ast, {}).code;
  return prettier.format(newCode, {
    // format same as ant-design-pro
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 100,
    parser: 'typescript',
  });
}

/**
 * 判断是否为String类型
 * @param value
 * @returns {boolean}
 */
export const isString = value => {
  return Object.prototype.toString.call(value) === '[object String]';
};


/**
 * 驼峰转-
 * @param name
 * @returns {string}
 */
export const toLine = (name) => {
  return name.replace(/([A-Z])/g,"-$1").toLowerCase();
}
